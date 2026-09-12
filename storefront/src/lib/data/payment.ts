"use server";

import crypto from "node:crypto";
import type { Order } from "@spree/sdk";
import { updateTag } from "next/cache";
import {
  cacheTagSuffix,
  getCartOptions,
  getCartToken,
  getClientForSurface,
  requireCartId,
  type Surface,
} from "@/lib/spree";
import { placeOrderFromCart } from "@/lib/db/order";
import { getCart, verifyAuthSession } from "./cart";
import { adaptDbOrderToSpree } from "./order-adapter";
import {
  getCompletedOrder,
  resolveSurfaceForCart,
  resolveSurfaceForCartVerified,
} from "./checkout";
import { actionResult } from "./utils";

function checkoutTag(surface: Surface): string {
  return `checkout${cacheTagSuffix(surface)}`;
}

function cartTag(surface: Surface): string {
  return `cart${cacheTagSuffix(surface)}`;
}

export async function createCheckoutPaymentSession(
  cartId: string,
  paymentMethodId: string,
  externalData?: Record<string, unknown>,
) {
  return actionResult(async () => {
    const surface = await resolveSurfaceForCart(cartId);
    const options = await getCartOptions(surface);
    const id = await requireCartId(surface);
    const session = await getClientForSurface(
      surface,
    ).carts.paymentSessions.create(
      id,
      {
        payment_method_id: paymentMethodId,
        ...(externalData && { external_data: externalData }),
      },
      options,
    );
    updateTag(checkoutTag(surface));
    return { session };
  }, "Failed to create payment session");
}

/**
 * Syncs an existing payment session with the provider (e.g. after the cart
 * total changed). Keeps the provider-side session — and therefore the
 * mounted gateway form — alive, unlike creating a fresh session.
 */
export async function updateCheckoutPaymentSession(
  cartId: string,
  sessionId: string,
  params: { amount?: string; external_data?: Record<string, unknown> } = {},
) {
  return actionResult(async () => {
    const surface = await resolveSurfaceForCart(cartId);
    const options = await getCartOptions(surface);
    const id = await requireCartId(surface);
    const session = await getClientForSurface(
      surface,
    ).carts.paymentSessions.update(id, sessionId, params, options);
    updateTag(checkoutTag(surface));
    return { session };
  }, "Failed to update payment session");
}

/**
 * Creates a direct payment for non-session payment methods
 * (e.g. Check, Cash on Delivery, Bank Transfer).
 */
export async function createDirectPayment(
  cartId: string,
  paymentMethodId: string,
) {
  return actionResult(async () => {
    const surface = await resolveSurfaceForCart(cartId);
    const options = await getCartOptions(surface);
    const id = await requireCartId(surface);
    const payment = await getClientForSurface(surface).carts.payments.create(
      id,
      { payment_method_id: paymentMethodId },
      options,
    );
    updateTag(checkoutTag(surface));
    return { payment };
  }, "Failed to create payment");
}

export async function completeCheckoutPaymentSession(
  cartId: string,
  sessionId: string,
  params?: { session_result?: string; external_data?: Record<string, unknown> },
) {
  return actionResult(async () => {
    const surface = await resolveSurfaceForCart(cartId);
    const options = await getCartOptions(surface);
    const id = await requireCartId(surface);
    const session = await getClientForSurface(
      surface,
    ).carts.paymentSessions.complete(id, sessionId, params, options);
    updateTag(checkoutTag(surface));
    return { session };
  }, "Failed to complete payment session");
}

/**
 * Completes the order. Treats 403 and 422 as success:
 * - 403 = cart already completed (e.g. webhook handler completed it)
/**
 * Completes the order by placing it into PostgreSQL first-party orders table.
 * Idempotent: returns existing order if source_cart_id was already converted.
 */
export async function completeCheckoutOrder(
  cartId: string,
  knownSurface?: Surface,
) {
  const surface = knownSurface ?? (await resolveSurfaceForCart(cartId));
  try {
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

    const { order, items } = await placeOrderFromCart({
      cartId,
      surface,
      verifiedUserId,
      guestTokenHash,
    });

    const adaptedOrder = adaptDbOrderToSpree(order, items);
    updateTag(checkoutTag(surface));
    updateTag(cartTag(surface));
    return { success: true as const, order: adaptedOrder as unknown as Order };
  } catch (error: unknown) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to complete order",
    };
  }
}

/**
 * Confirms payment and completes the order after returning from an offsite
 * payment gateway (e.g. CashApp, 3D Secure).
 */
export async function confirmPaymentAndCompleteCart(
  cartId: string,
  sessionId?: string,
  sessionResult?: string,
  redirectResult?: string,
  adyenSessionId?: string,
): Promise<
  { success: true; order: unknown } | { success: false; error: string }
> {
  // Cookies may have been cleared during the offsite redirect, so verify the
  // surface against the cart's own channel rather than trusting the cookie.
  const verifiedSurface = await resolveSurfaceForCartVerified(cartId);
  if (verifiedSurface === "unverified") {
    // The wholesale check couldn't run to completion (transient fetch/channel
    // failure). Fail closed rather than defaulting to DTC: completing a
    // possibly-wholesale checkout through the DTC client, or reporting success
    // for a cart we couldn't fetch, would be worse than asking the caller to
    // retry once the backend recovers.
    return {
      success: false,
      error: "Couldn't confirm your order yet. Please try again in a moment.",
    };
  }
  const surface = verifiedSurface;
  try {
    const cart = await getCart(cartId, surface);
    if (!cart) {
      // Cart not found — the order may already be completed (e.g. by webhook).
      // Try fetching it as a completed order before giving up.
      const completedOrder = await getCompletedOrder(cartId).catch(
        () => null,
      );
      return { success: true, order: completedOrder };
    }

    if (cart.current_step === "complete") {
      return { success: true, order: cart };
    }

    if (sessionId) {
      const options = await getCartOptions(surface);
      const id = await requireCartId(surface);
      const completeResult = await getClientForSurface(
        surface,
      ).carts.paymentSessions.complete(
        id,
        sessionId,
        sessionResult ? { session_result: sessionResult } : undefined,
        options,
      );
      if (completeResult.status === "failed") {
        return {
          success: false,
          error: "Payment was not successful. Please try again.",
        };
      }
    } else if (redirectResult) {
      // Adyen redirect flow: redirectResult is appended by Adyen to the return URL.
      // Pass it to the backend which resolves the session and processes the redirect.
      const options = await getCartOptions(surface);
      const id = await requireCartId(surface);
      const completeResult = await getClientForSurface(
        surface,
      ).carts.paymentSessions.complete(
        id,
        adyenSessionId ?? "",
        {
          external_data: {
            redirect_result: redirectResult,
          },
        },
        options,
      );
      if (completeResult.status === "failed") {
        return {
          success: false,
          error: "Payment was not successful. Please try again.",
        };
      }
    }

    // Pass the verified surface so completion doesn't re-resolve from the
    // (possibly cleared) cookie.
    const result = await completeCheckoutOrder(cartId, surface);
    if (result.success) {
      return { success: true, order: result.order };
    }
    return { success: false, error: result.error };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to confirm payment. Please try again.",
    };
  }
}
