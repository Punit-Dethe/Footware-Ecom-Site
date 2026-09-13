"use server";

import crypto from "node:crypto";
import { updateTag } from "next/cache";
import {
  cacheTagSuffix,
  getCartToken,
  type Surface,
} from "@/lib/spree";
import { placeOrderFromCart } from "@/lib/db/order";
import type { Order } from "@/types/commerce";
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
  _cartId: string,
  _paymentMethodId: string,
  _externalData?: Record<string, unknown>,
) {
  return actionResult(async () => {
    return { session: { id: "direct_payment_session", external_data: {} } };
  }, "Failed to create payment session");
}

export async function updateCheckoutPaymentSession(
  _cartId: string,
  _sessionId: string,
  _params: { amount?: string; external_data?: Record<string, unknown> } = {},
) {
  return actionResult(async () => {
    return { session: { id: "direct_payment_session" } };
  }, "Failed to update payment session");
}

export async function createDirectPayment(
  cartId: string,
  _paymentMethodId: string,
) {
  return actionResult(async () => {
    const surface = await resolveSurfaceForCart(cartId);
    updateTag(checkoutTag(surface));
    return { payment: { id: "direct_payment" } };
  }, "Failed to create payment");
}

export async function completeCheckoutPaymentSession(
  _cartId: string,
  _sessionId: string,
  _params?: { session_result?: string; external_data?: Record<string, unknown> },
) {
  return actionResult(async () => {
    return { session: { id: "direct_payment_session", status: "completed" } };
  }, "Failed to complete payment session");
}

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
 * Confirms payment and completes the order.
 * First-party PostgreSQL placement; zero Spree payment gateway dependency.
 */
export async function confirmPaymentAndCompleteCart(
  cartId: string,
  _sessionId?: string,
  _sessionResult?: string,
  _redirectResult?: string,
  _adyenSessionId?: string,
): Promise<
  { success: true; order: unknown } | { success: false; error: string }
> {
  const verifiedSurface = await resolveSurfaceForCartVerified(cartId);
  if (verifiedSurface === "unverified") {
    return {
      success: false,
      error: "Couldn't confirm your order yet. Please try again in a moment.",
    };
  }
  const surface = verifiedSurface;
  try {
    const cart = await getCart(cartId, surface);
    if (!cart) {
      // Cart not found — order may already be completed.
      const completedOrder = await getCompletedOrder(cartId);
      if (completedOrder) {
        return { success: true, order: completedOrder };
      }
      return {
        success: false,
        error: "Order not found or unauthorized.",
      };
    }

    if (cart.current_step === "complete") {
      return { success: true, order: cart };
    }

    // Complete order through first-party PostgreSQL placement
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
