"use server";

import crypto from "node:crypto";
import { updateTag } from "next/cache";
import {
  cacheTagSuffix,
  getCartId,
  getCartToken,
  isWholesaleEnabled,
  type Surface,
} from "@/lib/spree";
import {
  findCartById,
  updateAuthorizedCartCheckoutData,
  updateAuthorizedCartCurrency,
} from "@/lib/db/cart";
import { getOrderBySourceCartAuthorized } from "@/lib/db/order";
import type { AddressParams, Cart } from "@/types/commerce";
import { getCart, verifyAuthSession } from "./cart";
import { adaptDbOrderToCart } from "./order-adapter";
import { actionResult } from "./utils";
import { getWholesaleChannel } from "./wholesale";

/**
 * Determine which surface a checkout belongs to by matching its cart id against
 * the per-surface cart-id cookie or the database carts.surface column. Cheap and correct for in-session actions,
 * where the cookie is always present. For the offsite-payment return path — where
 * the cookie may be gone — use {@link resolveSurfaceForCartVerified} instead.
 * Defaults to DTC when it matches neither.
 */
export async function resolveSurfaceForCart(cartId: string): Promise<Surface> {
  if (!isWholesaleEnabled()) return "dtc";
  const wholesaleCartId = await getCartId("wholesale");
  if (wholesaleCartId === cartId) return "wholesale";

  try {
    const dbCart = await findCartById(cartId);
    if (dbCart?.surface) {
      return dbCart.surface;
    }
  } catch {
    // Fall back to DTC
  }

  return "dtc";
}

/**
 * Result of the verified surface resolution. `"unverified"` is distinct from
 * `"dtc"` on purpose: it means the wholesale check couldn't run to completion
 * (transient fetch/channel failure), so the surface is *unknown*, not confirmed
 * DTC. Callers on the offsite-payment path must fail closed on `"unverified"`
 * rather than routing a possibly-wholesale checkout through the DTC client.
 */
export type VerifiedSurface = Surface | "unverified";

/**
 * Like {@link resolveSurfaceForCart}, but confirms an ambiguous cart against the
 * database carts.surface column or channel_id rather than trusting the cookie alone.
 */
export async function resolveSurfaceForCartVerified(
  cartId: string,
): Promise<VerifiedSurface> {
  if (!isWholesaleEnabled()) return "dtc";

  const wholesaleCartId = await getCartId("wholesale");
  if (wholesaleCartId === cartId) return "wholesale";

  try {
    const dbCart = await findCartById(cartId);
    if (dbCart?.surface) {
      return dbCart.surface;
    }
  } catch {
    // DB lookup error, fall through
  }

  try {
    const [cart, channel] = await Promise.all([
      getCart(cartId, "wholesale"),
      getWholesaleChannel(),
    ]);
    if (!cart || !channel) return "unverified";
    if (cart.channel_id == null) return "unverified";
    return cart.channel_id === channel.id ? "wholesale" : "dtc";
  } catch {
    return "unverified";
  }
}

/** Checkout cache tag, segmented per surface. */
function checkoutTag(surface: Surface): string {
  return `checkout${cacheTagSuffix(surface)}`;
}

function cartTag(surface: Surface): string {
  return `cart${cacheTagSuffix(surface)}`;
}

export async function getCompletedOrder(cartId: string): Promise<Cart | null> {
  const surface = await resolveSurfaceForCart(cartId);
  const authSession = await verifyAuthSession();

  let userId: string | null = null;
  let guestTokenHash: string | null = null;

  if (authSession.status === "authenticated") {
    userId = authSession.userId;
  }

  const rawToken = await getCartToken(surface);
  if (rawToken) {
    guestTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  if (!userId && !guestTokenHash) {
    return null;
  }

  const result = await getOrderBySourceCartAuthorized(cartId, {
    userId,
    guestTokenHash,
    surface,
  });
  if (!result) return null;

  return adaptDbOrderToCart(result.order, result.items);
}

export async function getCheckoutOrder(cartId: string): Promise<Cart | null> {
  const surface = await resolveSurfaceForCart(cartId);

  // Try active cart first (order may still be in checkout)
  const cart = await getCart(undefined, surface);
  if (cart && cart.id === cartId) return cart;

  // Cart completed — fetch as completed order.
  return await getCompletedOrder(cartId);
}

export async function updateOrderAddresses(
  cartId: string,
  addresses: {
    shipping_address?: AddressParams;
    billing_address?: AddressParams;
    shipping_address_id?: string;
    billing_address_id?: string;
    use_shipping?: boolean;
    email?: string;
  },
) {
  return actionResult(async () => {
    const surface = await resolveSurfaceForCart(cartId);
    const authSession = await verifyAuthSession();

    let userId: string | null = null;
    let guestTokenHash: string | null = null;

    if (authSession.status === "authenticated") {
      userId = authSession.userId;
    } else {
      const rawToken = await getCartToken(surface);
      if (rawToken) {
        guestTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      }
    }

    if (!userId && !guestTokenHash) {
      throw new Error("Unauthorized to update checkout addresses");
    }

    const updated = await updateAuthorizedCartCheckoutData({
      cartId,
      surface,
      auth: { userId, guestTokenHash },
      data: {
        shipping_address: addresses.shipping_address as Record<string, unknown> | undefined,
        billing_address: addresses.billing_address as Record<string, unknown> | undefined,
        checkout_email: addresses.email,
      },
    });

    if (!updated) {
      throw new Error("Failed to update cart checkout data: cart not found or unauthorized");
    }

    // Single mutation authority: PostgreSQL is the sole backend
    const cart = await getCart(cartId, surface);
    if (!cart) {
      throw new Error("Failed to retrieve updated cart");
    }

    updateTag(checkoutTag(surface));
    updateTag(cartTag(surface));
    return { cart };
  }, "Failed to update addresses");
}

export async function updateCartMarket(
  cartId: string,
  params: { currency: string; locale?: string },
) {
  return actionResult(async () => {
    const surface = await resolveSurfaceForCart(cartId);
    const authSession = await verifyAuthSession();

    let userId: string | null = null;
    let guestTokenHash: string | null = null;

    if (authSession.status === "authenticated") {
      userId = authSession.userId;
    } else {
      const rawToken = await getCartToken(surface);
      if (rawToken) {
        guestTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      }
    }

    if (!userId && !guestTokenHash) {
      throw new Error("Unauthorized to update cart market");
    }

    await updateAuthorizedCartCurrency({
      cartId,
      surface,
      auth: { userId, guestTokenHash },
      currency: params.currency,
    });

    const cart = await getCart(cartId, surface);
    updateTag(checkoutTag(surface));
    updateTag(cartTag(surface));
    return { cart };
  }, "Failed to update order market");
}
