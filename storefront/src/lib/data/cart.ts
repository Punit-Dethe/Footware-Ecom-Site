"use server";

import crypto from "node:crypto";
import type { Cart, CreateCartParams } from "@spree/sdk";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import {
  findCatalogVariantByIdOrSku,
  findCatalogVariantBySku,
} from "@/lib/catalog/catalog-repository";
import {
  addOrIncrementCartItem,
  claimOrMergeGuestCart,
  createGuestCart,
  createUserCart,
  findActiveGuestCart,
  findActiveUserCart,
  loadCartItems,
  markCartAbandoned,
  removeCartItem as removeCartItemFromDb,
  updateCartItemQuantity,
  type DbCart,
  type DbCartItem,
} from "@/lib/db/cart";
import {
  cacheTagSuffix,
  clearCartCookies,
  clearCartToken,
  DEFAULT_SURFACE,
  getAccessToken,
  getCartId,
  getCartToken,
  getClientForSurface,
  setCartCookies,
  type Surface,
} from "@/lib/spree";
import { createClient } from "@/lib/supabase/server";
import { actionResult } from "./utils";

/** Cache tag for a surface's cart, so DTC and wholesale carts invalidate independently. */
function cartTag(surface: Surface): string {
  return `cart${cacheTagSuffix(surface)}`;
}

function checkoutTag(surface: Surface): string {
  return `checkout${cacheTagSuffix(surface)}`;
}

/** Generates a cryptographically secure 256-bit guest bearer token. */
function generateGuestBearerToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Hashes a raw bearer token with SHA-256 for secure database storage/lookup. */
function hashGuestToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Returns the verified Supabase user id if an active session exists.
 * Short-circuits for anonymous shoppers to avoid any remote Auth network calls.
 */
async function getVerifiedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const allCookies =
    typeof cookieStore.getAll === "function" ? cookieStore.getAll() : [];
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"),
  );

  if (!hasAuthCookie) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
      return null;
    }
    const claims = data.claims as Record<string, unknown>;
    return typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

/**
 * Adapts a persistent PostgreSQL cart and its line items into the Spree SDK Cart shape.
 * Catalog attributes, prices, and thumbnails are derived live from the static catalog.
 */
function adaptDbCartToSpreeCart(
  cart: DbCart,
  items: DbCartItem[],
  surface: Surface,
): Cart {
  let totalCents = 0;
  let totalQty = 0;

  const adaptedItems = items.map((item) => {
    const match = findCatalogVariantBySku(item.variant_sku);
    const unitPriceCents = match?.variant.price.amount_in_cents ?? 0;
    const lineTotalCents = unitPriceCents * item.quantity;
    totalCents += lineTotalCents;
    totalQty += item.quantity;

    const displayUnitPrice = match?.variant.price.display_amount ?? `$${(unitPriceCents / 100).toFixed(2)}`;
    const displayLineTotal = `$${(lineTotalCents / 100).toFixed(2)}`;

    return {
      id: item.id,
      name: match?.product.name ?? item.variant_sku,
      slug: match?.product.slug ?? "",
      sku: item.variant_sku,
      variant_id: match?.variant.id ?? item.variant_id ?? item.variant_sku,
      quantity: item.quantity,
      price: {
        amount: (unitPriceCents / 100).toFixed(2),
        currency: cart.currency,
        display_amount: displayUnitPrice,
        amount_in_cents: unitPriceCents,
      },
      display_price: displayUnitPrice,
      total: {
        amount_in_cents: lineTotalCents,
        display_amount: displayLineTotal,
      },
      thumbnail_url: match?.product.thumbnail_url ?? null,
      options_text: match?.variant.options_text ?? null,
    };
  });

  const formattedTotal = `$${(totalCents / 100).toFixed(2)}`;

  return {
    id: cart.id,
    number: `R-MRZ-${cart.id.replace(/-/g, "").slice(-4).toUpperCase()}`,
    // Harmless non-secret compatibility token: NEVER leaks raw guest bearer token!
    token: `cart_${cart.id.replace(/-/g, "").slice(0, 12)}`,
    currency: cart.currency,
    channel_id: surface === "wholesale" ? "ch-wholesale" : "ch-dtc",
    item_count: totalQty,
    total_quantity: totalQty,
    total: formattedTotal,
    display_total: formattedTotal,
    item_total: { display_amount: formattedTotal, amount_in_cents: totalCents },
    display_item_total: formattedTotal,
    total_amount: { display_amount: formattedTotal, amount_in_cents: totalCents },
    ship_total: { display_amount: "$0.00", amount_in_cents: 0 },
    display_ship_total: "$0.00",
    tax_total: { display_amount: "$0.00", amount_in_cents: 0 },
    display_tax_total: "$0.00",
    promo_total: { display_amount: "$0.00", amount_in_cents: 0 },
    display_promo_total: "$0.00",
    current_step: "cart",
    state: "cart",
    items: adaptedItems,
  } as unknown as Cart;
}

/** Best-effort cookie clear (cookies aren't writable during a Server Component render). */
async function dropSurfaceCartCookies(surface: Surface): Promise<void> {
  try {
    await clearCartCookies(surface);
  } catch {
    // Ignore — cookie clearing is best-effort in read contexts
  }
}

/**
 * Get the current authorized cart for a surface.
 * Returns null if no cart exists, or if cart ID does not match the caller's authorization.
 */
export async function getCart(
  explicitCartId?: string,
  surface: Surface = DEFAULT_SURFACE,
): Promise<Cart | null> {
  const verifiedUserId = await getVerifiedUserId();
  const rawGuestToken = await getCartToken(surface);

  try {
    // Authenticated flow
    if (verifiedUserId) {
      let userCart: DbCart | null = null;

      // If an active guest token is present, claim or merge it into the user cart
      if (rawGuestToken) {
        try {
          const guestTokenHash = hashGuestToken(rawGuestToken);
          userCart = await claimOrMergeGuestCart(
            verifiedUserId,
            guestTokenHash,
            surface,
          );
          // Clear the raw guest token cookie now that it is merged into the user cart
          try {
            await clearCartToken(surface);
            await setCartCookies(userCart.id, undefined, surface);
          } catch {
            // Read context ignore
          }
        } catch {
          userCart = await findActiveUserCart(verifiedUserId, surface);
        }
      } else {
        userCart = await findActiveUserCart(verifiedUserId, surface);
      }

      if (userCart) {
        // IDOR Protection: explicit cart lookup must match the authenticated user's cart
        if (!explicitCartId || userCart.id === explicitCartId) {
          const items = await loadCartItems(userCart.id);
          return adaptDbCartToSpreeCart(userCart, items, surface);
        }
      }
    }

    // Anonymous guest flow
    if (rawGuestToken) {
      // IDOR Protection: cart UUID without matching guest token or user session is rejected
      const guestTokenHash = hashGuestToken(rawGuestToken);
      const guestCart = await findActiveGuestCart(guestTokenHash, surface);

      if (guestCart) {
        if (!explicitCartId || guestCart.id === explicitCartId) {
          const items = await loadCartItems(guestCart.id);
          return adaptDbCartToSpreeCart(guestCart, items, surface);
        }
      } else {
        // Stale or invalid guest token
        await dropSurfaceCartCookies(surface);
      }
    }
  } catch {
    // Database transient failure or unconfigured in test environment
  }

  // Fallback for checkout cart lookups (e.g. order completion / legacy Spree backend)
  const fallbackCartId = explicitCartId ?? (await getCartId(surface));
  if (fallbackCartId) {
    try {
      const client = getClientForSurface(surface);
      const spreeToken = rawGuestToken;
      const token = await getAccessToken();
      const spreeCart = await client.carts.get(fallbackCartId, {
        spreeToken,
        token,
      });
      return spreeCart;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Get existing cart or create a new one on a surface.
 * Creates either a user-owned cart or a cryptographically secure guest cart.
 */
export async function getOrCreateCart(
  _params?: CreateCartParams,
  surface: Surface = DEFAULT_SURFACE,
): Promise<Cart> {
  const existing = await getCart(undefined, surface);
  if (existing) {
    return existing;
  }

  const verifiedUserId = await getVerifiedUserId();

  if (verifiedUserId) {
    const userCart = await createUserCart(verifiedUserId, surface, "USD");
    try {
      await setCartCookies(userCart.id, undefined, surface);
    } catch {
      // Best effort
    }
    updateTag(cartTag(surface));
    return adaptDbCartToSpreeCart(userCart, [], surface);
  }

  // Generate secure 256-bit guest token
  const rawToken = generateGuestBearerToken();
  const guestTokenHash = hashGuestToken(rawToken);
  const guestCart = await createGuestCart(guestTokenHash, surface, "USD");

  try {
    await setCartCookies(guestCart.id, rawToken, surface);
  } catch {
    // Best effort
  }

  updateTag(cartTag(surface));
  return adaptDbCartToSpreeCart(guestCart, [], surface);
}

/**
 * Clears the active cart for a surface.
 * Marks the active cart abandoned in PostgreSQL and clears browser cart cookies.
 */
export async function clearCart(surface: Surface = DEFAULT_SURFACE) {
  return actionResult(async () => {
    const cart = await getCart(undefined, surface);
    if (cart) {
      await markCartAbandoned(cart.id);
    }
    await clearCartCookies(surface);
    updateTag(cartTag(surface));
    updateTag(checkoutTag(surface));
    return {};
  }, "Failed to clear cart");
}

/**
 * Adds an item to the current cart.
 * Validates variant against current static catalog. Unknown variants are strictly rejected (no PRODUCTS[0] fallback).
 */
export async function addToCart(
  variantId: string,
  quantity: number,
  surface: Surface = DEFAULT_SURFACE,
) {
  return actionResult(async () => {
    const match = findCatalogVariantByIdOrSku(variantId);
    if (!match) {
      throw new Error("Variant not found in catalog");
    }

    if (!match.variant.purchasable || !match.variant.in_stock) {
      throw new Error("Variant is currently unavailable");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Quantity must be a positive integer");
    }

    const cart = await getOrCreateCart(undefined, surface);
    await addOrIncrementCartItem(cart.id, match.variant.sku, quantity);

    updateTag(cartTag(surface));
    const updatedCart = await getCart(cart.id, surface);
    return { cart: updatedCart };
  }, "Failed to add item to cart");
}

/**
 * Updates quantity of a specific line item in the current authorized cart.
 */
export async function updateCartItem(
  lineItemId: string,
  quantity: number,
  surface: Surface = DEFAULT_SURFACE,
) {
  return actionResult(async () => {
    const cart = await getCart(undefined, surface);
    if (!cart) {
      throw new Error("Cart not found");
    }

    const success = await updateCartItemQuantity(cart.id, lineItemId, quantity);
    if (!success) {
      throw new Error("Line item not found in cart");
    }

    updateTag(cartTag(surface));
    const updatedCart = await getCart(cart.id, surface);
    return { cart: updatedCart };
  }, "Failed to update cart item");
}

/**
 * Removes a specific line item from the current authorized cart.
 */
export async function removeCartItem(
  lineItemId: string,
  surface: Surface = DEFAULT_SURFACE,
) {
  return actionResult(async () => {
    const cart = await getCart(undefined, surface);
    if (!cart) {
      throw new Error("Cart not found");
    }

    const success = await removeCartItemFromDb(cart.id, lineItemId);
    if (!success) {
      throw new Error("Line item not found in cart");
    }

    updateTag(cartTag(surface));
    const updatedCart = await getCart(cart.id, surface);
    return { cart: updatedCart };
  }, "Failed to remove cart item");
}

/**
 * Synchronizes cart state on authentication changes (login or logout).
 */
export async function syncCartOnAuthChange(
  surface: Surface = DEFAULT_SURFACE,
): Promise<Cart | null> {
  const verifiedUserId = await getVerifiedUserId();
  if (!verifiedUserId) {
    return null;
  }
  return await getCart(undefined, surface);
}

/**
 * Explicitly associates/merges a guest cart with the authenticated customer.
 */
export async function associateCartWithUser(
  surface: Surface = DEFAULT_SURFACE,
) {
  return actionResult(async () => {
    const verifiedUserId = await getVerifiedUserId();
    const rawGuestToken = await getCartToken(surface);

    if (!verifiedUserId || !rawGuestToken) {
      return {};
    }

    const guestTokenHash = hashGuestToken(rawGuestToken);
    const mergedCart = await claimOrMergeGuestCart(
      verifiedUserId,
      guestTokenHash,
      surface,
    );

    await clearCartToken(surface);
    await setCartCookies(mergedCart.id, undefined, surface);

    updateTag(cartTag(surface));
    updateTag(checkoutTag(surface));
    return {};
  }, "Failed to associate cart");
}


