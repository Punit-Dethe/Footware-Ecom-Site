import "server-only";

import { query, transaction } from "./index";

export type CartSurface = "dtc" | "wholesale";
export type CartStatus = "active" | "converted" | "abandoned";

export interface DbCart {
  id: string;
  user_id: string | null;
  guest_token_hash: string | null;
  surface: CartSurface;
  currency: string;
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
  status: CartStatus;
  created_at: Date;
  updated_at: Date;
}

export interface DbCartItem {
  id: string;
  cart_id: string;
  variant_id: string | null;
  variant_sku: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

function mapCartRow(row: Record<string, unknown>): DbCart {
  return {
    id: row.id as string,
    user_id: (row.user_id as string) ?? null,
    guest_token_hash: (row.guest_token_hash as string) ?? null,
    surface: row.surface as CartSurface,
    currency: (row.currency as string) || "USD",
    shipping_address: (row.shipping_address as Record<string, unknown>) ?? null,
    billing_address: (row.billing_address as Record<string, unknown>) ?? null,
    status: row.status as CartStatus,
    created_at: new Date(row.created_at as string | number | Date),
    updated_at: new Date(row.updated_at as string | number | Date),
  };
}

function mapCartItemRow(row: Record<string, unknown>): DbCartItem {
  return {
    id: row.id as string,
    cart_id: row.cart_id as string,
    variant_id: (row.variant_id as string) ?? null,
    variant_sku: row.variant_sku as string,
    quantity: Number(row.quantity),
    created_at: new Date(row.created_at as string | number | Date),
    updated_at: new Date(row.updated_at as string | number | Date),
  };
}

/**
 * Finds an active guest cart matching the SHA-256 hash of the guest bearer token and surface.
 */
export async function findActiveGuestCart(
  guestTokenHash: string,
  surface: CartSurface,
): Promise<DbCart | null> {
  const res = await query<Record<string, unknown>>(
    `SELECT id, user_id, guest_token_hash, surface, currency, shipping_address, billing_address, status, created_at, updated_at
     FROM public.carts
     WHERE guest_token_hash = $1 AND surface = $2 AND status = 'active'
     LIMIT 1;`,
    [guestTokenHash, surface],
  );

  return res.rows[0] ? mapCartRow(res.rows[0]) : null;
}

/**
 * Finds an active user cart for a verified user id and surface.
 */
export async function findActiveUserCart(
  userId: string,
  surface: CartSurface,
): Promise<DbCart | null> {
  const res = await query<Record<string, unknown>>(
    `SELECT id, user_id, guest_token_hash, surface, currency, shipping_address, billing_address, status, created_at, updated_at
     FROM public.carts
     WHERE user_id = $1 AND surface = $2 AND status = 'active'
     LIMIT 1;`,
    [userId, surface],
  );

  return res.rows[0] ? mapCartRow(res.rows[0]) : null;
}

/**
 * Finds any cart by its unique UUID (for checkout / order conversion).
 */
export async function findCartById(cartId: string): Promise<DbCart | null> {
  const res = await query<Record<string, unknown>>(
    `SELECT id, user_id, guest_token_hash, surface, currency, shipping_address, billing_address, status, created_at, updated_at
     FROM public.carts
     WHERE id = $1
     LIMIT 1;`,
    [cartId],
  );

  return res.rows[0] ? mapCartRow(res.rows[0]) : null;
}

/**
 * Creates a new active guest cart with a hashed bearer token.
 * Default currency is explicitly USD.
 */
export async function createGuestCart(
  guestTokenHash: string,
  surface: CartSurface,
  currency = "USD",
): Promise<DbCart> {
  const res = await query<Record<string, unknown>>(
    `INSERT INTO public.carts (
       guest_token_hash, surface, currency, status, created_at, updated_at
     ) VALUES ($1, $2, $3, 'active', NOW(), NOW())
     RETURNING id, user_id, guest_token_hash, surface, currency, shipping_address, billing_address, status, created_at, updated_at;`,
    [guestTokenHash, surface, currency],
  );

  return mapCartRow(res.rows[0]);
}

/**
 * Creates or retrieves an active user cart for a verified user and surface.
 */
export async function createUserCart(
  userId: string,
  surface: CartSurface,
  currency = "USD",
): Promise<DbCart> {
  const res = await query<Record<string, unknown>>(
    `INSERT INTO public.carts (
       user_id, surface, currency, status, created_at, updated_at
     ) VALUES ($1, $2, $3, 'active', NOW(), NOW())
     ON CONFLICT (user_id, surface) WHERE status = 'active'
     DO UPDATE SET updated_at = NOW()
     RETURNING id, user_id, guest_token_hash, surface, currency, shipping_address, billing_address, status, created_at, updated_at;`,
    [userId, surface, currency],
  );

  return mapCartRow(res.rows[0]);
}

/**
 * Loads all items for a given cart ordered by creation time.
 */
export async function loadCartItems(cartId: string): Promise<DbCartItem[]> {
  const res = await query<Record<string, unknown>>(
    `SELECT id, cart_id, variant_id, variant_sku, quantity, created_at, updated_at
     FROM public.cart_items
     WHERE cart_id = $1
     ORDER BY created_at ASC;`,
    [cartId],
  );

  return res.rows.map(mapCartItemRow);
}

/**
 * Atomically inserts a new line item or increments quantity if SKU already exists in the cart.
 */
export async function addOrIncrementCartItem(
  cartId: string,
  sku: string,
  quantity: number,
): Promise<DbCartItem> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer");
  }

  const res = await query<Record<string, unknown>>(
    `INSERT INTO public.cart_items (cart_id, variant_sku, quantity, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (cart_id, variant_sku) DO UPDATE
     SET quantity = public.cart_items.quantity + EXCLUDED.quantity,
         updated_at = NOW()
     RETURNING id, cart_id, variant_id, variant_sku, quantity, created_at, updated_at;`,
    [cartId, sku, quantity],
  );

  await query(`UPDATE public.carts SET updated_at = NOW() WHERE id = $1;`, [cartId]);

  return mapCartItemRow(res.rows[0]);
}

/**
 * Updates quantity of a specific line item in a cart.
 * If quantity <= 0, deletes the line item.
 */
export async function updateCartItemQuantity(
  cartId: string,
  lineItemId: string,
  quantity: number,
): Promise<boolean> {
  if (quantity <= 0) {
    return removeCartItem(cartId, lineItemId);
  }

  const res = await query(
    `UPDATE public.cart_items
     SET quantity = $3, updated_at = NOW()
     WHERE id = $1 AND cart_id = $2;`,
    [lineItemId, cartId, quantity],
  );

  if ((res.rowCount ?? 0) > 0) {
    await query(`UPDATE public.carts SET updated_at = NOW() WHERE id = $1;`, [cartId]);
    return true;
  }
  return false;
}

/**
 * Removes a specific line item from a cart.
 */
export async function removeCartItem(
  cartId: string,
  lineItemId: string,
): Promise<boolean> {
  const res = await query(
    `DELETE FROM public.cart_items
     WHERE id = $1 AND cart_id = $2;`,
    [lineItemId, cartId],
  );

  if ((res.rowCount ?? 0) > 0) {
    await query(`UPDATE public.carts SET updated_at = NOW() WHERE id = $1;`, [cartId]);
    return true;
  }
  return false;
}

/**
 * Marks a cart abandoned and clears its guest token hash.
 */
export async function markCartAbandoned(cartId: string): Promise<void> {
  await query(
    `UPDATE public.carts
     SET status = 'abandoned', guest_token_hash = NULL, updated_at = NOW()
     WHERE id = $1;`,
    [cartId],
  );
}

/**
 * Merges or claims a guest cart into a user cart for a verified user upon login.
 *
 * Scenarios:
 * Case A: Guest cart exists, user cart does NOT exist
 *         -> Claim the guest cart directly: update user_id = userId, guest_token_hash = NULL. Same cart ID is retained.
 * Case B: User cart exists, guest cart does NOT exist
 *         -> Return user cart.
 * Case C: Both guest cart and user cart exist
 *         -> Merge guest items into user cart by SKU addition.
 *         -> Mark guest cart abandoned and clear its token hash.
 *         -> Return user cart.
 *
 * The operation runs in a transaction with row locking and is idempotent.
 */
export async function claimOrMergeGuestCart(
  userId: string,
  guestTokenHash: string,
  surface: CartSurface,
): Promise<DbCart> {
  return await transaction(async (client) => {
    // 1. Lock active guest cart if exists
    const guestRes = await client.query<Record<string, unknown>>(
      `SELECT id, user_id, guest_token_hash, surface, currency, shipping_address, billing_address, status, created_at, updated_at
       FROM public.carts
       WHERE guest_token_hash = $1 AND surface = $2 AND status = 'active'
       FOR UPDATE;`,
      [guestTokenHash, surface],
    );

    const guestCart = guestRes.rows[0] ? mapCartRow(guestRes.rows[0]) : null;

    // 2. Lock active user cart if exists
    const userRes = await client.query<Record<string, unknown>>(
      `SELECT id, user_id, guest_token_hash, surface, currency, shipping_address, billing_address, status, created_at, updated_at
       FROM public.carts
       WHERE user_id = $1 AND surface = $2 AND status = 'active'
       FOR UPDATE;`,
      [userId, surface],
    );

    const userCart = userRes.rows[0] ? mapCartRow(userRes.rows[0]) : null;

    // Case B: User cart exists, no guest cart to merge
    if (!guestCart) {
      if (userCart) return userCart;
      // Neither exists: create user cart
      const createRes = await client.query<Record<string, unknown>>(
        `INSERT INTO public.carts (user_id, surface, currency, status, created_at, updated_at)
         VALUES ($1, $2, 'USD', 'active', NOW(), NOW())
         RETURNING id, user_id, guest_token_hash, surface, currency, shipping_address, billing_address, status, created_at, updated_at;`,
        [userId, surface],
      );
      return mapCartRow(createRes.rows[0]);
    }

    // If guest cart is already owned by this user, return it
    if (guestCart.user_id === userId) {
      return guestCart;
    }

    // Case A: Guest cart exists, user cart does NOT exist
    // Claim guest cart directly, retaining its cart ID!
    if (!userCart) {
      const claimRes = await client.query<Record<string, unknown>>(
        `UPDATE public.carts
         SET user_id = $1, guest_token_hash = NULL, updated_at = NOW()
         WHERE id = $2
         RETURNING id, user_id, guest_token_hash, surface, currency, shipping_address, billing_address, status, created_at, updated_at;`,
        [userId, guestCart.id],
      );
      return mapCartRow(claimRes.rows[0]);
    }

    // Case C: Both guest cart and user cart exist
    // Merge guest line items into user cart
    const guestItemsRes = await client.query<Record<string, unknown>>(
      `SELECT id, cart_id, variant_id, variant_sku, quantity, created_at, updated_at
       FROM public.cart_items
       WHERE cart_id = $1
       FOR UPDATE;`,
      [guestCart.id],
    );

    for (const item of guestItemsRes.rows) {
      await client.query(
        `INSERT INTO public.cart_items (cart_id, variant_sku, quantity, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (cart_id, variant_sku) DO UPDATE
         SET quantity = public.cart_items.quantity + EXCLUDED.quantity,
             updated_at = NOW();`,
        [userCart.id, item.variant_sku, item.quantity],
      );
    }

    // Mark guest cart abandoned and detach token
    await client.query(
      `UPDATE public.carts
       SET status = 'abandoned', guest_token_hash = NULL, updated_at = NOW()
       WHERE id = $1;`,
      [guestCart.id],
    );

    await client.query(`UPDATE public.carts SET updated_at = NOW() WHERE id = $1;`, [userCart.id]);

    return userCart;
  });
}
