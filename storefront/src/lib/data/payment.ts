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
import { verifyAuthSession } from "./cart";
import { adaptDbOrderToCommerceOrder } from "./order-adapter";
import { resolveSurfaceForCart } from "./checkout";
import { scheduleOrderConfirmationEmail } from "@/lib/emails/order-confirmation-flow";

function checkoutTag(surface: Surface): string {
  return `checkout${cacheTagSuffix(surface)}`;
}

function cartTag(surface: Surface): string {
  return `cart${cacheTagSuffix(surface)}`;
}

/**
 * Completes the order by placing it into PostgreSQL first-party orders table.
 * Idempotent: returns existing order if source_cart_id was already converted.
 */
export async function completeCheckoutOrder(
  cartId: string,
  knownSurface?: Surface,
): Promise<
  | { success: true; order: Order }
  | { success: false; error: string }
> {
  const tStart = performance.now();
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
    const preflightMs = Math.round(performance.now() - tStart);

    const { order, items } = await placeOrderFromCart({
      cartId,
      surface,
      verifiedUserId,
      guestTokenHash,
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
          preflightMs,
          totalMs,
        }),
      );
    }

    return { success: true as const, order: adaptedOrder as unknown as Order };
  } catch (error: unknown) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to complete order",
    };
  }
}
