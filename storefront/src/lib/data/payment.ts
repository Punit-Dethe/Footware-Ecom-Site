"use server";

import crypto from "node:crypto";
import { updateTag } from "next/cache";
import {
  cacheTagSuffix,
  getCartToken,
  type Surface,
} from "@/lib/storefront";
import { placeOrderFromCart } from "@/lib/db/order";
import type { Order } from "@/types/commerce";
import { getCart, verifyAuthSession } from "./cart";
import { adaptDbOrderToCommerceOrder } from "./order-adapter";
import { resolveSurfaceForCart } from "./checkout";
import { scheduleOrderConfirmationEmail } from "@/lib/emails/order-confirmation-flow";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayConfig,
  RazorpayApiError,
  RazorpayConfigError,
  verifyRazorpayPaymentSignature,
} from "@/lib/payments/razorpay";

function checkoutTag(surface: Surface): string {
  return `checkout${cacheTagSuffix(surface)}`;
}

function cartTag(surface: Surface): string {
  return `cart${cacheTagSuffix(surface)}`;
}

export interface CreateRazorpayCheckoutOrderResult {
  success: true;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  customer: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export type CreateRazorpayCheckoutOrderResponse =
  | CreateRazorpayCheckoutOrderResult
  | { success: false; error: string };

/**
 * Initializes a server-authoritative Razorpay order for an active cart.
 * Key Secret is NEVER returned or sent to client.
 */
export async function createRazorpayCheckoutOrder(
  cartId: string,
  knownSurface?: Surface,
): Promise<CreateRazorpayCheckoutOrderResponse> {
  try {
    const surface = knownSurface ?? (await resolveSurfaceForCart(cartId));
    const cart = await getCart(cartId, surface);

    if (!cart || cart.id !== cartId) {
      return { success: false, error: "Cart not found or access denied" };
    }

    if (!cart.items || cart.items.length === 0) {
      return {
        success: false,
        error: "Cannot create payment order for an empty cart",
      };
    }

    const amountInCents = cart.total_amount?.amount_in_cents ?? 0;
    if (amountInCents <= 0) {
      return { success: false, error: "Cart total must be greater than zero" };
    }

    const currency = (cart.currency || "INR").toUpperCase();
    const config = getRazorpayConfig();

    // Receipt identifier constrained to 40 characters maximum by Razorpay API
    const receipt = cart.id.replace(/-/g, "").slice(0, 40);

    const razorpayOrder = await createRazorpayOrder(
      {
        amount: amountInCents,
        currency,
        receipt,
        notes: {
          cart_id: cart.id,
          surface,
        },
      },
      config,
    );

    const shipping = cart.shipping_address;
    const billing = cart.billing_address;

    const customerName =
      [shipping?.first_name, shipping?.last_name].filter(Boolean).join(" ") ||
      [billing?.first_name, billing?.last_name].filter(Boolean).join(" ") ||
      undefined;

    const customerEmail =
      cart.email ||
      ((shipping as Record<string, unknown> | undefined)?.email as
        | string
        | undefined) ||
      ((billing as Record<string, unknown> | undefined)?.email as
        | string
        | undefined) ||
      undefined;

    const customerContact = shipping?.phone || billing?.phone || undefined;

    return {
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: config.keyId,
      customer: {
        name: customerName,
        email: customerEmail,
        contact: customerContact,
      },
    };
  } catch (err: unknown) {
    if (err instanceof RazorpayConfigError) {
      return { success: false, error: err.message };
    }
    if (err instanceof RazorpayApiError) {
      return { success: false, error: `Payment service error: ${err.message}` };
    }
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to initialize payment",
    };
  }
}

export interface VerifyRazorpayPaymentParams {
  cartId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  knownSurface?: Surface;
}

export type VerifyRazorpayPaymentResponse =
  | { success: true; order: Order }
  | { success: false; error: string };

/**
 * Verifies Razorpay payment signature and status, and completes order placement atomically.
 * Prevents payment bypass by requiring cryptographic signature verification,
 * live payment status confirmation ('captured'), and exact cart amount/currency matching.
 */
export async function verifyRazorpayPaymentAndCompleteOrder(
  params: VerifyRazorpayPaymentParams,
): Promise<VerifyRazorpayPaymentResponse> {
  const {
    cartId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    knownSurface,
  } = params;
  const tStart = performance.now();

  try {
    if (
      !cartId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return {
        success: false,
        error: "Missing required payment verification details",
      };
    }

    const surface = knownSurface ?? (await resolveSurfaceForCart(cartId));
    const config = getRazorpayConfig();

    // 1. Cryptographic HMAC verification using constant-time comparison
    const isValidSignature = verifyRazorpayPaymentSignature(
      {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
      config,
    );

    if (!isValidSignature) {
      return {
        success: false,
        error: "Invalid payment signature verification",
      };
    }

    // 2. Fetch authoritative payment status directly from Razorpay
    const payment = await fetchRazorpayPayment(razorpayPaymentId, config);

    if (payment.order_id !== razorpayOrderId) {
      return {
        success: false,
        error: `Payment order ID '${payment.order_id}' does not match expected '${razorpayOrderId}'`,
      };
    }

    if (payment.status !== "captured") {
      return {
        success: false,
        error: `Payment status is '${payment.status}', expected 'captured'`,
      };
    }

    // 3. Resolve user auth / guest token hash
    const authSession = await verifyAuthSession();
    let verifiedUserId: string | null = null;
    let guestTokenHash: string | null = null;

    if (authSession.status === "authenticated") {
      verifiedUserId = authSession.userId;
    } else {
      const rawToken = await getCartToken(surface);
      if (rawToken) {
        guestTokenHash = crypto
          .createHash("sha256")
          .update(rawToken)
          .digest("hex");
      }
    }

    // 4. Place order atomically inside ACID transaction (enforcing amount & currency parity)
    const { order, items } = await placeOrderFromCart({
      cartId,
      surface,
      verifiedUserId,
      guestTokenHash,
      payment: {
        provider: "razorpay",
        status: "paid",
        providerOrderId: razorpayOrderId,
        providerPaymentId: razorpayPaymentId,
        paymentMethod: payment.method,
        paidAt: new Date(payment.created_at * 1000),
        expectedAmountInCents: payment.amount,
        expectedCurrency: payment.currency,
      },
    });

    const adaptedOrder = adaptDbOrderToCommerceOrder(order, items);
    updateTag(checkoutTag(surface));
    updateTag(cartTag(surface));

    // Fast checkout: schedule order confirmation email in post-response background task
    scheduleOrderConfirmationEmail({ order, items });

    const totalMs = Math.round(performance.now() - tStart);
    if (process.env.PERF_DIAGNOSTICS === "1") {
      console.log(
        JSON.stringify({
          type: "checkout_timing",
          totalMs,
        }),
      );
    }

    return { success: true, order: adaptedOrder as unknown as Order };
  } catch (error: unknown) {
    if (error instanceof RazorpayConfigError) {
      return { success: false, error: error.message };
    }
    if (error instanceof RazorpayApiError) {
      return {
        success: false,
        error: `Payment gateway error: ${error.message}`,
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to complete order",
    };
  }
}
