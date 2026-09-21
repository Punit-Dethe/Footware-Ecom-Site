"use server";

import crypto from "node:crypto";
import { updateTag } from "next/cache";
import {
  cacheTagSuffix,
  getCartToken,
  type Surface,
} from "@/lib/storefront";
import { placeOrderFromCart } from "@/lib/db/order";
import {
  createPaymentAttempt,
  findPaymentAttempt,
  markPaymentAttemptConsumed,
} from "@/lib/db/payment-attempt";
import type { Order } from "@/types/commerce";
import { getCart, verifyAuthSession } from "./cart";
import { adaptDbOrderToCommerceOrder } from "./order-adapter";
import { resolveSurfaceForCart } from "./checkout";
import { scheduleOrderConfirmationEmail } from "@/lib/emails/order-confirmation-flow";
import {
  createRazorpayOrder,
  fetchRazorpayOrder,
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

const GENERIC_VERIFICATION_ERROR =
  "We could not verify this payment. Please try again or contact support.";

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
 * Initializes a server-authoritative Razorpay order for an active cart,
 * and records a trusted payment_attempt row bound to the cart and surface.
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

    // Persist server-side payment-attempt binding
    await createPaymentAttempt({
      cartId: cart.id,
      surface,
      provider: "razorpay",
      providerOrderId: razorpayOrder.id,
      amountInCents: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });

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
 *
 * Security guarantees:
 * - Order ID used for HMAC signature verification comes from a server-trusted payment_attempt
 *   record bound strictly to the cart ID and surface (eliminating cross-cart replay attacks).
 * - Live provider Order is fetched and validated for notes (cart_id, surface), amount, and currency.
 * - Live provider Payment is fetched and validated for order ID, 'captured' status, amount, and currency.
 * - Local order placement is idempotent and validates payment identity against existing orders.
 * - Order confirmation email is scheduled ONLY when created === true.
 * - Internal payment integrity errors are logged server-side and sanitized for browser response.
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

    // 1. Authorize current Mirza cart
    const cart = await getCart(cartId, surface);
    if (!cart || cart.id !== cartId) {
      console.error(
        `[payment:integrity] Cart '${cartId}' not found or access denied for surface '${surface}'`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    // 2. Lookup server-trusted payment attempt strictly bound to cart and surface
    const paymentAttempt = await findPaymentAttempt({
      providerOrderId: razorpayOrderId,
      cartId: cart.id,
      surface,
    });

    if (!paymentAttempt) {
      console.error(
        `[payment:integrity] No payment attempt found for providerOrderId='${razorpayOrderId}', cartId='${cart.id}', surface='${surface}'`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    // 3. Cryptographic HMAC verification using SERVER-TRUSTED order ID
    const trustedOrderId = paymentAttempt.provider_order_id;
    const isValidSignature = verifyRazorpayPaymentSignature(
      {
        razorpayOrderId: trustedOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
      config,
    );

    if (!isValidSignature) {
      console.error(
        `[payment:integrity] Invalid HMAC signature for trustedOrderId='${trustedOrderId}', paymentId='${razorpayPaymentId}'`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    // 4. Fetch and verify live Razorpay Order
    const razorpayOrder = await fetchRazorpayOrder(trustedOrderId, config);
    if (razorpayOrder.id !== trustedOrderId) {
      console.error(
        `[payment:integrity] Razorpay order ID mismatch: got '${razorpayOrder.id}', expected '${trustedOrderId}'`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    if (
      razorpayOrder.notes?.cart_id !== cart.id ||
      razorpayOrder.notes?.surface !== surface
    ) {
      console.error(
        `[payment:integrity] Razorpay order notes mismatch. Notes: ${JSON.stringify(razorpayOrder.notes)}, expected cart_id='${cart.id}', surface='${surface}'`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    if (
      razorpayOrder.amount !== paymentAttempt.amount_in_cents ||
      razorpayOrder.currency.toUpperCase() !== paymentAttempt.currency.toUpperCase()
    ) {
      console.error(
        `[payment:integrity] Razorpay order amount/currency mismatch: order has ${razorpayOrder.amount} ${razorpayOrder.currency}, attempt has ${paymentAttempt.amount_in_cents} ${paymentAttempt.currency}`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    // Also verify current authoritative Mirza cart still matches attempt amount/currency
    const currentCartAmount = cart.total_amount?.amount_in_cents ?? 0;
    const currentCartCurrency = (cart.currency || "INR").toUpperCase();
    if (
      currentCartAmount !== paymentAttempt.amount_in_cents ||
      currentCartCurrency !== paymentAttempt.currency.toUpperCase()
    ) {
      console.error(
        `[payment:integrity] Current cart amount/currency mismatch with attempt: cart has ${currentCartAmount} ${currentCartCurrency}, attempt has ${paymentAttempt.amount_in_cents} ${paymentAttempt.currency}`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    // 5. Fetch and verify live Razorpay Payment
    const payment = await fetchRazorpayPayment(razorpayPaymentId, config);

    if (payment.id !== razorpayPaymentId) {
      console.error(
        `[payment:integrity] Payment ID mismatch: got '${payment.id}', expected '${razorpayPaymentId}'`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    if (payment.order_id !== trustedOrderId) {
      console.error(
        `[payment:integrity] Payment order_id mismatch: got '${payment.order_id}', expected '${trustedOrderId}'`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    if (payment.status !== "captured") {
      console.error(
        `[payment:integrity] Payment status is '${payment.status}', expected 'captured'`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    if (
      payment.amount !== paymentAttempt.amount_in_cents ||
      payment.currency.toUpperCase() !== paymentAttempt.currency.toUpperCase()
    ) {
      console.error(
        `[payment:integrity] Payment amount/currency mismatch: payment has ${payment.amount} ${payment.currency}, attempt has ${paymentAttempt.amount_in_cents} ${paymentAttempt.currency}`,
      );
      return { success: false, error: GENERIC_VERIFICATION_ERROR };
    }

    // 6. Resolve user auth / guest token hash
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

    // 7. Place order atomically inside ACID transaction
    const { order, items, created } = await placeOrderFromCart({
      cartId,
      surface,
      verifiedUserId,
      guestTokenHash,
      payment: {
        provider: "razorpay",
        status: "paid",
        providerOrderId: trustedOrderId,
        providerPaymentId: razorpayPaymentId,
        paymentMethod: payment.method,
        paidAt: new Date(payment.created_at * 1000),
        expectedAmountInCents: payment.amount,
        expectedCurrency: payment.currency,
      },
    });

    // 8. Consume payment attempt
    await markPaymentAttemptConsumed({
      attemptId: paymentAttempt.id,
      providerPaymentId: razorpayPaymentId,
    });

    const adaptedOrder = adaptDbOrderToCommerceOrder(order, items);
    updateTag(checkoutTag(surface));
    updateTag(cartTag(surface));

    // Fast checkout: schedule order confirmation email ONLY when created === true
    if (created) {
      scheduleOrderConfirmationEmail({ order, items });
    }

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
      console.error("[payment:gateway] API error:", error.message);
      return {
        success: false,
        error: `Payment gateway error: ${error.message}`,
      };
    }
    console.error("[payment:verification] Verification error:", error);
    return {
      success: false,
      error: GENERIC_VERIFICATION_ERROR,
    };
  }
}
