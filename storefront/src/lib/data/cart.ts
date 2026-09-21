"use server";

import crypto from "node:crypto";
import type { Cart, CreateCartParams } from "@/types/commerce";
import { cookies } from "next/headers";
import {
  getPublicCatalogSnapshot,
  type CatalogProduct,
  type CatalogVariant,
} from "@/lib/catalog/catalog-repository";
import {
  formatMoney,
  formatZeroMoney,
  isSupportedCurrency,
  resolveVariantPrice,
} from "@/lib/data/pricing";
import { getVariantByIdOrSku } from "@/lib/db/catalog";
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
  switchAuthorizedCartCurrency,
  updateCartItemQuantity,
  type DbCart,
  type DbCartItem,
} from "@/lib/db/cart";
import {
  clearCartCookies,
  clearCartToken,
  DEFAULT_SURFACE,
  getCartToken,
  setCartCookies,
  type Surface,
} from "@/lib/storefront";
import { createClient } from "@/lib/supabase/server";
import { actionResult } from "./utils";

/** Generates a cryptographically secure 256-bit guest bearer token. */
function generateGuestBearerToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Hashes a raw bearer token with SHA-256 for secure database storage/lookup. */
function hashGuestToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export type AuthVerificationResult =
  | { status: "anonymous" }
  | { status: "authenticated"; userId: string };

/**
 * Verifies the Supabase authentication session.
 *
 * Semantic behavior:
 * - No Supabase auth cookie: short-circuits to anonymous without remote network calls (0 auth requests).
 * - Valid claims: returns authenticated with verified user id.
 * - Normal invalid / expired session: returns anonymous.
 * - Unexpected transport or server exception: throws to fail closed.
 */
export async function verifyAuthSession(): Promise<AuthVerificationResult> {
  const cookieStore = await cookies();
  const allCookies =
    typeof cookieStore.getAll === "function" ? cookieStore.getAll() : [];
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"),
  );

  if (!hasAuthCookie) {
    return { status: "anonymous" };
  }

  let data: any = null;
  let error: any = null;

  try {
    const supabase = await createClient();
    const claimsRes = await supabase.auth.getClaims();
    data = claimsRes.data;
    error = claimsRes.error;
  } catch (err: unknown) {
    throw new Error(
      `Auth verification service unavailable: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    const name = error.name || "";
    const message = error.message || "";
    if (
      (typeof status === "number" && status >= 500) ||
      name === "AuthRetryableFetchError" ||
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ETIMEDOUT")
    ) {
      throw new Error(`Auth verification service unavailable: ${message}`);
    }
    // Normal invalid/expired session
    return { status: "anonymous" };
  }

  if (!data?.claims) {
    return { status: "anonymous" };
  }

  const claims = data.claims as Record<string, unknown>;
  const userId = typeof claims.sub === "string" ? claims.sub : null;
  if (!userId) {
    return { status: "anonymous" };
  }

  return { status: "authenticated", userId };
}

/**
 * Returns the verified Supabase user id if an active session exists.
 * Short-circuits for anonymous shoppers to avoid any remote Auth network calls.
 */
async function getVerifiedUserId(): Promise<string | null> {
  const auth = await verifyAuthSession();
  return auth.status === "authenticated" ? auth.userId : null;
}

/**
 * Adapts a persistent PostgreSQL cart and its line items into the commerce Cart shape.
 * Catalog attributes, prices, and thumbnails are derived live from the static catalog.
 * Unknown SKUs are never priced at $0; adaptation fails closed with an error.
 */
async function adaptDbCartToCommerceCart(
  cart: DbCart,
  items: DbCartItem[],
  surface: Surface,
): Promise<Cart> {
  const cartCurrency = (cart.currency || "USD").toUpperCase();
  let totalCents = 0;
  let totalQty = 0;

  let adaptedItems: any[] = [];
  if (items.length > 0) {
    const { products } = await getPublicCatalogSnapshot(cartCurrency);

    adaptedItems = items.map((item) => {
      let match: { product: CatalogProduct; variant: CatalogVariant } | null =
        null;

      if (item.variant_id) {
        for (const p of products) {
          const v = p.variants.find((vItem) => vItem.id === item.variant_id);
          if (v) {
            match = { product: p, variant: v };
            break;
          }
        }
      } else {
        for (const p of products) {
          const v = p.variants.find((vItem) => vItem.sku === item.variant_sku);
          if (v) {
            match = { product: p, variant: v };
            break;
          }
        }
      }

      if (!match) {
        throw new Error(
          `Cart item references unavailable catalog variant: ${item.variant_sku || item.variant_id}`,
        );
      }

      if (item.variant_sku && match.variant.sku !== item.variant_sku) {
        throw new Error(
          `Cart item integrity error: variant_id '${item.variant_id}' resolves to SKU '${match.variant.sku}', but item records SKU '${item.variant_sku}'`,
        );
      }

      if (!match.variant.in_stock || !match.variant.purchasable) {
        throw new Error(
          `Cart item references unavailable catalog variant: ${item.variant_sku || item.variant_id}`,
        );
      }
      const unitPriceCents = match.variant.price.amount_in_cents;
      const lineTotalCents = unitPriceCents * item.quantity;
      totalCents += lineTotalCents;
      totalQty += item.quantity;

      const displayUnitPrice = match.variant.price.display_amount;
      const displayLineTotal = formatMoney(lineTotalCents, cartCurrency);

      return {
        id: item.id,
        name: match.product.name,
        slug: match.product.slug,
        sku: match.variant.sku,
        variant_id: match.variant.id,
        quantity: item.quantity,
        price: {
          amount: (unitPriceCents / 100).toFixed(2),
          currency: cartCurrency,
          display_amount: displayUnitPrice,
          amount_in_cents: unitPriceCents,
        },
        display_price: displayUnitPrice,
        total: {
          amount_in_cents: lineTotalCents,
          display_amount: displayLineTotal,
        },
        thumbnail_url: match.product.thumbnail_url ?? null,
        options_text: match.variant.options_text ?? null,
      };
    });
  }

  const formattedTotal = formatMoney(totalCents, cartCurrency);

  return {
    id: cart.id,
    number: `R-MRZ-${cart.id.replace(/-/g, "").slice(-4).toUpperCase()}`,
    // Harmless non-secret compatibility token: NEVER leaks raw guest bearer token!
    token: `cart_${cart.id.replace(/-/g, "").slice(0, 12)}`,
    currency: cartCurrency,
    channel_id: surface === "wholesale" ? "ch-wholesale" : "ch-dtc",
    item_count: totalQty,
    total_quantity: totalQty,
    total: formattedTotal,
    display_total: formattedTotal,
    item_total: { display_amount: formattedTotal, amount_in_cents: totalCents },
    display_item_total: formattedTotal,
    total_amount: { display_amount: formattedTotal, amount_in_cents: totalCents },
    ship_total: { display_amount: formatZeroMoney(cartCurrency), amount_in_cents: 0 },
    display_ship_total: formatZeroMoney(cartCurrency),
    tax_total: "0.00",
    display_tax_total: formatZeroMoney(cartCurrency),
    promo_total: { display_amount: formatZeroMoney(cartCurrency), amount_in_cents: 0 },
    display_promo_total: formatZeroMoney(cartCurrency),
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

async function reconcileAuthorizedCartCurrency(
  cart: DbCart,
  surface: Surface,
  expectedCurrency: string | undefined,
  auth: { userId?: string | null; guestTokenHash?: string | null },
): Promise<DbCart> {
  if (!expectedCurrency) return cart;
  const currency = expectedCurrency.toUpperCase();
  if (!isSupportedCurrency(currency)) {
    throw new Error(`Unsupported cart currency '${expectedCurrency}'`);
  }
  if (cart.currency.toUpperCase() === currency) return cart;

  const switched = await switchAuthorizedCartCurrency({
    cartId: cart.id,
    surface,
    auth,
    currency,
  });
  if (!switched) {
    throw new Error("Failed to reconcile cart with selected market");
  }
  return switched;
}

/**
 * Resolves the raw authorized PostgreSQL DbCart without loading line items or adapting catalog.
 * Solves single-resolution auth invariant for cart mutations.
 * Anonymous requests make 0 remote Supabase Auth network calls.
 */
export async function getAuthorizedDbCart(
  surface: Surface = DEFAULT_SURFACE,
  explicitCartId?: string,
  expectedCurrency?: string,
): Promise<DbCart | null> {
  const auth = await verifyAuthSession();
  const rawGuestToken = await getCartToken(surface);

  // Authenticated flow
  if (auth.status === "authenticated") {
    const verifiedUserId = auth.userId;
    let userCart: DbCart | null = null;

    if (rawGuestToken) {
      const guestTokenHash = hashGuestToken(rawGuestToken);
      userCart = await claimOrMergeGuestCart(
        verifiedUserId,
        guestTokenHash,
        surface,
      );
      try {
        await clearCartToken(surface);
        await setCartCookies(userCart.id, undefined, surface);
      } catch {
        // Read context ignore
      }
    } else {
      userCart = await findActiveUserCart(verifiedUserId, surface);
    }

    if (!userCart) {
      return null;
    }

    if (explicitCartId && userCart.id !== explicitCartId) {
      return null;
    }

    return await reconcileAuthorizedCartCurrency(
      userCart,
      surface,
      expectedCurrency,
      { userId: verifiedUserId },
    );
  }

  // Anonymous guest flow
  if (!rawGuestToken) {
    return null;
  }

  const guestTokenHash = hashGuestToken(rawGuestToken);
  const guestCart = await findActiveGuestCart(guestTokenHash, surface);

  if (!guestCart) {
    await dropSurfaceCartCookies(surface);
    return null;
  }

  if (explicitCartId && guestCart.id !== explicitCartId) {
    return null;
  }

  return await reconcileAuthorizedCartCurrency(
    guestCart,
    surface,
    expectedCurrency,
    { guestTokenHash },
  );
}

/**
 * Resolves existing authorized DbCart or creates one in a single pass.
 * Verifies auth exactly once. Never calls loadCartItems or adaptDbCartToCommerceCart.
 */
export async function getOrCreateAuthorizedDbCart(
  surface: Surface = DEFAULT_SURFACE,
  currency = "USD",
): Promise<DbCart> {
  const normCurrency = (currency || "USD").toUpperCase();
  if (!isSupportedCurrency(normCurrency)) {
    throw new Error(`Unsupported cart currency '${currency}'`);
  }
  const auth = await verifyAuthSession();
  const rawGuestToken = await getCartToken(surface);

  if (auth.status === "authenticated") {
    const verifiedUserId = auth.userId;
    let userCart: DbCart | null = null;

    if (rawGuestToken) {
      const guestTokenHash = hashGuestToken(rawGuestToken);
      userCart = await claimOrMergeGuestCart(
        verifiedUserId,
        guestTokenHash,
        surface,
        normCurrency,
      );
      try {
        await clearCartToken(surface);
        await setCartCookies(userCart.id, undefined, surface);
      } catch {
        // Best effort
      }
    } else {
      userCart = await findActiveUserCart(verifiedUserId, surface);
    }

    if (userCart) {
      return await reconcileAuthorizedCartCurrency(
        userCart,
        surface,
        normCurrency,
        { userId: verifiedUserId },
      );
    }

    const newUserCart = await createUserCart(verifiedUserId, surface, normCurrency);
    try {
      await setCartCookies(newUserCart.id, undefined, surface);
    } catch {
      // Best effort
    }
    return newUserCart;
  }

  // Anonymous guest flow
  if (rawGuestToken) {
    const guestTokenHash = hashGuestToken(rawGuestToken);
    const guestCart = await findActiveGuestCart(guestTokenHash, surface);
    if (guestCart) {
      return await reconcileAuthorizedCartCurrency(
        guestCart,
        surface,
        normCurrency,
        { guestTokenHash },
      );
    }
    await dropSurfaceCartCookies(surface);
  }

  // Generate secure 256-bit guest token
  const rawToken = generateGuestBearerToken();
  const guestTokenHash = hashGuestToken(rawToken);
  const newGuestCart = await createGuestCart(guestTokenHash, surface, normCurrency);

  try {
    await setCartCookies(newGuestCart.id, rawToken, surface);
  } catch {
    // Best effort
  }

  return newGuestCart;
}

/**
 * Get the current authorized cart for a surface.
 * Returns null if no cart exists, or if cart ID does not match the caller's authorization.
 * Persistent PostgreSQL cart is the sole source of truth; zero legacy cart read fallbacks.
 */
export async function getCart(
  explicitCartId?: string,
  surface: Surface = DEFAULT_SURFACE,
  expectedCurrency?: string,
): Promise<Cart | null> {
  const cart = await getAuthorizedDbCart(surface, explicitCartId, expectedCurrency);
  if (!cart) {
    return null;
  }

  const items = await loadCartItems(cart.id);
  return await adaptDbCartToCommerceCart(cart, items, surface);
}

/**
 * Get existing cart or create a new one on a surface.
 * Creates either a user-owned cart or a cryptographically secure guest cart.
 */
export async function getOrCreateCart(
  params?: CreateCartParams & { currency?: string },
  surface: Surface = DEFAULT_SURFACE,
): Promise<Cart> {
  const currency = params?.currency || "USD";
  const cart = await getOrCreateAuthorizedDbCart(surface, currency);
  const items = await loadCartItems(cart.id);
  return await adaptDbCartToCommerceCart(cart, items, surface);
}

/**
 * Clears the active cart for a surface.
 * Marks the active cart abandoned in PostgreSQL and clears browser cart cookies.
 */
export async function clearCart(surface: Surface = DEFAULT_SURFACE) {
  return actionResult(async () => {
    const cart = await getAuthorizedDbCart(surface);
    if (cart) {
      await markCartAbandoned(cart.id);
    }
    await clearCartCookies(surface);
    return {};
  }, "Failed to clear cart");
}

/**
 * Adds an item to the current cart.
 * Validates variant against authoritative PostgreSQL catalog.
 * Executes exactly 4 queries on warm catalog cache (1 variant, 1 find cart, 1 CTE mutate, 1 load items).
 */
export async function addToCart(
  variantId: string,
  quantity: number,
  surface: Surface = DEFAULT_SURFACE,
  currency?: string,
) {
  return actionResult(async () => {
    const match = await getVariantByIdOrSku(variantId);
    if (!match) {
      throw new Error("Variant not found in catalog");
    }

    if (match.product_status !== "active" || !match.active) {
      throw new Error("Variant is currently unavailable");
    }

    if (match.quantity_on_hand <= 0 && !match.backorderable) {
      throw new Error("Variant is out of stock");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Quantity must be a positive integer");
    }

    const targetCurrency = (currency || "USD").toUpperCase();
    if (!isSupportedCurrency(targetCurrency)) {
      throw new Error(`Unsupported cart currency '${currency}'`);
    }
    const targetPrice = resolveVariantPrice(match.prices, targetCurrency);
    if (!targetPrice || targetPrice.price_in_cents <= 0) {
      throw new Error(
        `Variant is not priced for the selected market (${targetCurrency})`,
      );
    }

    const cart = await getOrCreateAuthorizedDbCart(surface, targetCurrency);
    await addOrIncrementCartItem(cart.id, match.id, match.sku, quantity);

    const items = await loadCartItems(cart.id);
    const updatedCart = await adaptDbCartToCommerceCart(cart, items, surface);
    return { cart: updatedCart };
  }, "Failed to add item to cart");
}

/**
 * Verifies that all line items in a cart have an available, in-stock price in the target currency.
 * Throws if any item cannot be sold in the target market.
 */
export async function ensureCartMarket(
  cartId: string,
  targetCurrency: string,
): Promise<void> {
  const normCurrency = (targetCurrency || "USD").toUpperCase();
  const items = await loadCartItems(cartId);
  if (items.length === 0) return;

  const { products } = await getPublicCatalogSnapshot(normCurrency);

  for (const item of items) {
    let match: { product: CatalogProduct; variant: CatalogVariant } | null = null;
    for (const p of products) {
      const v = item.variant_id
        ? p.variants.find((vItem) => vItem.id === item.variant_id)
        : p.variants.find((vItem) => vItem.sku === item.variant_sku);
      if (v) {
        match = { product: p, variant: v };
        break;
      }
    }

    if (!match?.variant.purchasable || !match.variant.in_stock) {
      throw new Error(
        `Item '${item.variant_sku || item.variant_id}' is not available for purchase in ${normCurrency}`,
      );
    }
  }
}

/**
 * Updates quantity of a specific line item in the current authorized cart.
 * Executes exactly 3 queries on warm catalog cache (1 find cart, 1 CTE mutate, 1 load items).
 */
export async function updateCartItem(
  lineItemId: string,
  quantity: number,
  surface: Surface = DEFAULT_SURFACE,
) {
  return actionResult(async () => {
    const cart = await getAuthorizedDbCart(surface);
    if (!cart) {
      throw new Error("Cart not found");
    }

    const success = await updateCartItemQuantity(cart.id, lineItemId, quantity);
    if (!success) {
      throw new Error("Line item not found in cart");
    }

    const items = await loadCartItems(cart.id);
    const updatedCart = await adaptDbCartToCommerceCart(cart, items, surface);
    return { cart: updatedCart };
  }, "Failed to update cart item");
}

/**
 * Removes a specific line item from the current authorized cart.
 * Executes exactly 3 queries on warm catalog cache (1 find cart, 1 CTE mutate, 1 load items).
 */
export async function removeCartItem(
  lineItemId: string,
  surface: Surface = DEFAULT_SURFACE,
) {
  return actionResult(async () => {
    const cart = await getAuthorizedDbCart(surface);
    if (!cart) {
      throw new Error("Cart not found");
    }

    const success = await removeCartItemFromDb(cart.id, lineItemId);
    if (!success) {
      throw new Error("Line item not found in cart");
    }

    const items = await loadCartItems(cart.id);
    const updatedCart = await adaptDbCartToCommerceCart(cart, items, surface);
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

    return {};
  }, "Failed to associate cart");
}


