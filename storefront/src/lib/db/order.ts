import "server-only";

import crypto from "node:crypto";
import type { CartSurface } from "./cart";
import { query, transaction } from "./index";
import {
  getStoragePublicUrl,
  resolveResponsiveVariants,
} from "@/lib/media/delivery";

export type OrderStatus = "placed" | "cancelled";

export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  currency: string;
  subtotal_in_cents: number;
  tax_in_cents: number;
  shipping_in_cents: number;
  total_in_cents: number;
  shipping_address_snapshot: Record<string, unknown>;
  billing_address_snapshot: Record<string, unknown>;
  source_cart_id: string;
  surface: CartSurface;
  payment_provider?: string | null;
  payment_status?: string | null;
  payment_provider_order_id?: string | null;
  payment_provider_payment_id?: string | null;
  payment_method?: string | null;
  paid_at?: Date | null;
  completed_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_name: string;
  sku: string;
  size_option: string;
  price_in_cents: number;
  quantity: number;
  total_in_cents: number;
  thumbnail_url: string | null;
  created_at: Date;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapOrderRow(row: Record<string, unknown>): DbOrder {
  return {
    id: row.id as string,
    order_number: row.order_number as string,
    user_id: (row.user_id as string) ?? null,
    email: row.email as string,
    status: row.status as OrderStatus,
    currency: (row.currency as string) || "USD",
    subtotal_in_cents: Number(row.subtotal_in_cents),
    tax_in_cents: Number(row.tax_in_cents || 0),
    shipping_in_cents: Number(row.shipping_in_cents || 0),
    total_in_cents: Number(row.total_in_cents),
    shipping_address_snapshot:
      typeof row.shipping_address_snapshot === "string"
        ? JSON.parse(row.shipping_address_snapshot)
        : (row.shipping_address_snapshot as Record<string, unknown>) || {},
    billing_address_snapshot:
      typeof row.billing_address_snapshot === "string"
        ? JSON.parse(row.billing_address_snapshot)
        : (row.billing_address_snapshot as Record<string, unknown>) || {},
    source_cart_id: row.source_cart_id as string,
    surface: (row.surface as CartSurface) || "dtc",
    payment_provider: (row.payment_provider as string) ?? null,
    payment_status: (row.payment_status as string) ?? null,
    payment_provider_order_id: (row.payment_provider_order_id as string) ?? null,
    payment_provider_payment_id: (row.payment_provider_payment_id as string) ?? null,
    payment_method: (row.payment_method as string) ?? null,
    paid_at: row.paid_at ? new Date(row.paid_at as string | number | Date) : null,
    completed_at: new Date(row.completed_at as string | number | Date),
    created_at: new Date(row.created_at as string | number | Date),
    updated_at: new Date(row.updated_at as string | number | Date),
  };
}

function mapOrderItemRow(row: Record<string, unknown>): DbOrderItem {
  return {
    id: row.id as string,
    order_id: row.order_id as string,
    variant_id: (row.variant_id as string) ?? null,
    product_name: row.product_name as string,
    sku: row.sku as string,
    size_option: row.size_option as string,
    price_in_cents: Number(row.price_in_cents),
    quantity: Number(row.quantity),
    total_in_cents: Number(row.total_in_cents),
    thumbnail_url: (row.thumbnail_url as string) ?? null,
    created_at: new Date(row.created_at as string | number | Date),
  };
}

/**
 * Generates an immutable, collision-resistant human-readable order number.
 * Pattern: MRZ-XXXXXXXXXX (10 uppercase Crockford Base32 characters)
 */
export function generateOrderNumber(): string {
  const alphabet = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(10);
  let code = "MRZ-";
  for (let i = 0; i < 10; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

/**
 * Places an order from an authorized persistent cart inside a single ACID transaction.
 *
 * Guarantees:
 * - Row locking on source cart prevents concurrent race conditions.
 * - Idempotent: returns existing order if source_cart_id was already converted.
 * - Validates non-empty cart and resolves every line item against the authoritative catalog.
 */
export interface VerifiedPaymentDetails {
  provider: "razorpay";
  status: "paid";
  providerOrderId: string;
  providerPaymentId: string;
  paymentMethod?: string | null;
  paidAt: Date;
  expectedAmountInCents: number;
  expectedCurrency: string;
}

/**
 * Places an order from an active cart in a single atomic transaction.
 * - Cartesian products avoided by batching and single-row operations.
 * - Idempotent: returns existing order if source_cart_id was already converted.
 * - Subtotal and totals computed server-side in cents.
 * - Requires verified captured payment matching authoritative cart amount/currency.
 * - Source cart marked 'converted' while preserving guest_token_hash for confirmation read.
 */
export async function placeOrderFromCart(params: {
  cartId: string;
  surface: CartSurface;
  verifiedUserId?: string | null;
  guestTokenHash?: string | null;
  paymentAttemptId: string;
  payment: VerifiedPaymentDetails;
}): Promise<{ order: DbOrder; items: DbOrderItem[]; created: boolean }> {
  const { cartId, surface, verifiedUserId, guestTokenHash, paymentAttemptId, payment } = params;

  if (payment?.status !== "paid" || !payment.providerPaymentId || !payment.providerOrderId) {
    throw new Error("Cannot place order without verified captured payment");
  }

  if (!paymentAttemptId) {
    throw new Error("Cannot place order without trusted paymentAttemptId");
  }

  return await transaction(async (client) => {
    // 1. Lock source cart FOR UPDATE
    const cartRes = await client.query<Record<string, unknown>>(
      `SELECT id, user_id, guest_token_hash, surface, currency, shipping_address, billing_address, checkout_email, status
       FROM public.carts
       WHERE id = $1
       FOR UPDATE;`,
      [cartId],
    );

    const cart = cartRes.rows[0];
    if (!cart) {
      throw new Error("Cart not found");
    }

    // 2. Authorization verification
    if (verifiedUserId) {
      if (cart.user_id !== verifiedUserId) {
        throw new Error("Unauthorized to convert this cart");
      }
    } else if (guestTokenHash) {
      if (cart.guest_token_hash !== guestTokenHash) {
        throw new Error("Unauthorized to convert this cart");
      }
    } else {
      throw new Error("Missing authentication or guest authorization credentials");
    }

    // 2b. Surface verification
    if (cart.surface !== surface) {
      throw new Error(`Cart surface mismatch: cart belongs to '${cart.surface}', requested '${surface}'`);
    }

    // 2c. Lock payment_attempt row FOR UPDATE in the SAME transaction
    const attemptRes = await client.query<Record<string, unknown>>(
      `SELECT id, cart_id, surface, provider, provider_order_id, provider_payment_id, amount_in_cents, currency, status, consumed_at
       FROM public.payment_attempts
       WHERE id = $1
       FOR UPDATE;`,
      [paymentAttemptId],
    );

    const attempt = attemptRes.rows[0];
    if (!attempt) {
      throw new Error("Payment attempt not found");
    }

    if (attempt.id !== paymentAttemptId) {
      throw new Error("Payment attempt ID mismatch");
    }
    if (attempt.cart_id !== cartId) {
      throw new Error("Payment attempt does not belong to requested cart");
    }
    if (attempt.surface !== surface) {
      throw new Error(
        `Payment attempt surface mismatch: attempt belongs to '${attempt.surface}', requested '${surface}'`,
      );
    }
    if (attempt.provider !== "razorpay") {
      throw new Error(
        `Payment attempt provider mismatch: expected 'razorpay', got '${attempt.provider}'`,
      );
    }
    if (attempt.provider_order_id !== payment.providerOrderId) {
      throw new Error("Payment attempt provider order ID mismatch");
    }
    if (Number(attempt.amount_in_cents) !== payment.expectedAmountInCents) {
      throw new Error(
        `Payment attempt amount mismatch: attempt has ${attempt.amount_in_cents}, payment was ${payment.expectedAmountInCents}`,
      );
    }
    if (String(attempt.currency).toUpperCase() !== payment.expectedCurrency.toUpperCase()) {
      throw new Error(
        `Payment attempt currency mismatch: attempt has '${attempt.currency}', payment was '${payment.expectedCurrency}'`,
      );
    }

    // 2d. Payment-attempt status handling
    if (attempt.status === "created") {
      // Allow normal finalization
    } else if (attempt.status === "consumed") {
      if (attempt.provider_payment_id !== payment.providerPaymentId) {
        throw new Error(
          `Payment attempt already consumed with different payment ID: '${attempt.provider_payment_id}' vs '${payment.providerPaymentId}'`,
        );
      }
      // Allow idempotent retry when provider_payment_id === verified payment ID
    } else {
      throw new Error(
        `Invalid payment attempt status '${attempt.status}', expected 'created' or 'consumed'`,
      );
    }

    // 3. Idempotency check: does an order already exist for this source_cart_id?
    const existingOrderRes = await client.query<Record<string, unknown>>(
      `SELECT * FROM public.orders WHERE source_cart_id = $1;`,
      [cartId],
    );

    if (existingOrderRes.rows.length > 0) {
      const existingOrder = mapOrderRow(existingOrderRes.rows[0]);

      // Validate payment identity on existing order:
      // Prevent an unrelated second payment from being accepted as an idempotent completion
      if (
        existingOrder.payment_provider_order_id !== payment.providerOrderId ||
        existingOrder.payment_provider_payment_id !== payment.providerPaymentId
      ) {
        throw new Error(
          "Cannot complete order: cart was already converted with different payment details",
        );
      }

      // Ensure the payment_attempt is consumed with that same payment ID inside THIS transaction
      const consumeAttemptRes = await client.query<Record<string, unknown>>(
        `UPDATE public.payment_attempts
         SET status = 'consumed',
             provider_payment_id = $2,
             consumed_at = COALESCE(consumed_at, NOW()),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id;`,
        [attempt.id, payment.providerPaymentId],
      );

      if (consumeAttemptRes.rows.length === 0) {
        throw new Error("Failed to finalize payment attempt for existing order");
      }

      const existingItemsRes = await client.query<Record<string, unknown>>(
        `SELECT * FROM public.order_items WHERE order_id = $1 ORDER BY created_at ASC;`,
        [existingOrder.id],
      );
      return {
        order: existingOrder,
        items: existingItemsRes.rows.map(mapOrderItemRow),
        created: false,
      };
    }

    // 3b. Active status verification (only active carts can place new orders)
    if (cart.status !== "active") {
      throw new Error(`Cannot place order: cart status is '${cart.status}', must be 'active'`);
    }

    // 4. Load cart items joined directly to variants, variant_prices, and products inside the transaction
    const cartCurrency = ((cart.currency as string) || "USD").toUpperCase();
    const cartItemsRes = await client.query<Record<string, unknown>>(
      `SELECT
         ci.id AS cart_item_id,
         ci.cart_id,
         ci.variant_id,
         ci.variant_sku,
         ci.quantity,
         v.id AS db_variant_id,
         v.sku AS db_variant_sku,
         v.size_option,
         vp.price_in_cents AS authoritative_price_in_cents,
         v.active AS variant_active,
         v.quantity_on_hand,
         v.backorderable,
         p.id AS product_id,
         p.name AS product_name,
         p.slug AS product_slug,
         p.status AS product_status,
          (
            SELECT ma.storage_path
            FROM public.product_media pm
            JOIN public.media_assets ma ON ma.id = pm.media_asset_id
            WHERE pm.product_id = p.id
            ORDER BY pm.is_hero DESC, pm.position ASC, pm.created_at ASC
            LIMIT 1
          ) AS hero_storage_path,
          (
            SELECT ma.processed_variants
            FROM public.product_media pm
            JOIN public.media_assets ma ON ma.id = pm.media_asset_id
            WHERE pm.product_id = p.id
            ORDER BY pm.is_hero DESC, pm.position ASC, pm.created_at ASC
            LIMIT 1
          ) AS hero_variants
       FROM public.cart_items ci
       JOIN public.variants v ON v.id = ci.variant_id
       JOIN public.products p ON p.id = v.product_id
       LEFT JOIN public.variant_prices vp ON vp.variant_id = v.id AND vp.currency = $2
       WHERE ci.cart_id = $1
       FOR UPDATE OF ci;`,
      [cartId, cartCurrency],
    );

    if (cartItemsRes.rows.length === 0) {
      throw new Error("Cannot place order for an empty cart");
    }

    // 5. Snapshot items and calculate totals directly from PostgreSQL catalog rows inside transaction
    let subtotalInCents = 0;
    const snapshottedItems: Array<{
      variant_id: string | null;
      product_name: string;
      sku: string;
      size_option: string;
      price_in_cents: number;
      quantity: number;
      total_in_cents: number;
      thumbnail_url: string | null;
    }> = [];

    for (const row of cartItemsRes.rows) {
      const dbSku = row.db_variant_sku as string;
      const recordedSku = row.variant_sku as string;
      const quantity = Number(row.quantity);

      if (!row.db_variant_id || !row.product_id) {
        throw new Error(`Cannot place order: unknown catalog variant SKU '${recordedSku || row.variant_id}'`);
      }

      if (recordedSku && dbSku !== recordedSku) {
        throw new Error(
          `Cannot place order: cart item variant_id '${row.variant_id}' has SKU '${dbSku}', but cart item recorded SKU '${recordedSku}'`,
        );
      }

      const sku = dbSku;

      if (row.product_status !== "active" || !row.variant_active) {
        throw new Error(`Cannot place order: variant '${sku}' is no longer active`);
      }

      const qoh = Number(row.quantity_on_hand || 0);
      const backorderable = Boolean(row.backorderable);
      if (qoh <= 0 && !backorderable) {
        throw new Error(`Cannot place order: variant '${sku}' is out of stock`);
      }

      const priceRaw = row.authoritative_price_in_cents;
      if (priceRaw == null) {
        throw new Error(
          `Cannot place order: variant '${sku}' has no configured price for market currency '${cartCurrency}'`,
        );
      }

      const priceInCents = Number(priceRaw);
      const lineTotalInCents = priceInCents * quantity;
      subtotalInCents += lineTotalInCents;

      const heroVariants = resolveResponsiveVariants(
        row.hero_variants as Parameters<typeof resolveResponsiveVariants>[0],
      );
      const thumbUrl =
        heroVariants?.["320"]?.webp ||
        getStoragePublicUrl(row.hero_storage_path as string | null);

      snapshottedItems.push({
        variant_id: row.db_variant_id as string,
        product_name: row.product_name as string,
        sku,
        size_option: row.size_option ? `Size: UK/India ${row.size_option}` : "Standard",
        price_in_cents: priceInCents,
        quantity,
        total_in_cents: lineTotalInCents,
        thumbnail_url: thumbUrl,
      });
    }

    const taxInCents = 0;
    const shippingInCents = 0;
    const totalInCents = subtotalInCents + taxInCents + shippingInCents;

    // Verify authoritative cart amount & currency match verified payment
    if (totalInCents !== payment.expectedAmountInCents) {
      throw new Error(
        `Payment amount mismatch: cart total is ${totalInCents}, verified payment was ${payment.expectedAmountInCents}`,
      );
    }
    const currency = (cart.currency as string) || "USD";
    if (currency.toUpperCase() !== payment.expectedCurrency.toUpperCase()) {
      throw new Error(
        `Payment currency mismatch: cart currency is '${currency}', verified payment was '${payment.expectedCurrency}'`,
      );
    }

    // 6. Resolve checkout email
    let email: string | null = (cart.checkout_email as string) || null;
    if (!email) {
      const billing = cart.billing_address as Record<string, unknown> | null;
      const shipping = cart.shipping_address as Record<string, unknown> | null;
      email =
        (billing?.email as string) ||
        (shipping?.email as string) ||
        null;
    }
    if (!email && cart.user_id) {
      const userRes = await client.query<{ email: string }>(
        `SELECT email FROM auth.users WHERE id = $1;`,
        [cart.user_id],
      );
      email = userRes.rows[0]?.email || null;
    }

    if (!email) {
      throw new Error("Checkout email is required to place an order");
    }

    // 7. Snapshots for addresses
    const shippingSnapshot = cart.shipping_address || {};
    const billingSnapshot = cart.billing_address || cart.shipping_address || {};

    // 8. Generate order number & insert order
    const orderNumber = generateOrderNumber();

    const insertOrderRes = await client.query<Record<string, unknown>>(
      `INSERT INTO public.orders (
         order_number, user_id, email, status, currency,
         subtotal_in_cents, tax_in_cents, shipping_in_cents, total_in_cents,
         shipping_address_snapshot, billing_address_snapshot,
         source_cart_id, surface,
         payment_provider, payment_status, payment_provider_order_id, payment_provider_payment_id, payment_method, paid_at,
         completed_at, created_at, updated_at
       ) VALUES ($1, $2, $3, 'placed', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW(), NOW())
       ON CONFLICT (source_cart_id) DO NOTHING
       RETURNING *;`,
      [
        orderNumber,
        cart.user_id || null,
        email.trim().toLowerCase(),
        currency,
        subtotalInCents,
        taxInCents,
        shippingInCents,
        totalInCents,
        JSON.stringify(shippingSnapshot),
        JSON.stringify(billingSnapshot),
        cartId,
        surface,
        payment.provider,
        payment.status,
        payment.providerOrderId,
        payment.providerPaymentId,
        payment.paymentMethod || null,
        payment.paidAt,
      ],
    );

    // If ON CONFLICT source_cart_id triggered concurrently
    let orderRow = insertOrderRes.rows[0];
    if (!orderRow) {
      const fallbackRes = await client.query<Record<string, unknown>>(
        `SELECT * FROM public.orders WHERE source_cart_id = $1;`,
        [cartId],
      );
      orderRow = fallbackRes.rows[0];
      const existingOrder = mapOrderRow(orderRow);
      if (
        existingOrder.payment_provider_order_id !== payment.providerOrderId ||
        existingOrder.payment_provider_payment_id !== payment.providerPaymentId
      ) {
        throw new Error(
          "Cannot complete order: cart was already converted with different payment details",
        );
      }
      // Ensure the payment_attempt is consumed with that same payment ID inside THIS transaction
      const consumeFallbackRes = await client.query<Record<string, unknown>>(
        `UPDATE public.payment_attempts
         SET status = 'consumed',
             provider_payment_id = $2,
             consumed_at = COALESCE(consumed_at, NOW()),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id;`,
        [attempt.id, payment.providerPaymentId],
      );
      if (consumeFallbackRes.rows.length === 0) {
        throw new Error("Failed to finalize payment attempt for existing order");
      }

      const itemsRes = await client.query<Record<string, unknown>>(
        `SELECT * FROM public.order_items WHERE order_id = $1 ORDER BY created_at ASC;`,
        [orderRow.id],
      );
      return {
        order: existingOrder,
        items: itemsRes.rows.map(mapOrderItemRow),
        created: false,
      };
    }

    const order = mapOrderRow(orderRow);

    // 9. Insert order_items
    const insertedItems: DbOrderItem[] = [];
    for (const snap of snapshottedItems) {
      const itemRes = await client.query<Record<string, unknown>>(
        `INSERT INTO public.order_items (
           order_id, variant_id, product_name, sku, size_option,
           price_in_cents, quantity, total_in_cents, thumbnail_url, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING *;`,
        [
          order.id,
          snap.variant_id,
          snap.product_name,
          snap.sku,
          snap.size_option,
          snap.price_in_cents,
          snap.quantity,
          snap.total_in_cents,
          snap.thumbnail_url,
        ],
      );
      insertedItems.push(mapOrderItemRow(itemRes.rows[0]));
    }

    // 10. Mark cart converted (RETAIN guest_token_hash for confirmation authorization)
    await client.query(
      `UPDATE public.carts
       SET status = 'converted', updated_at = NOW()
       WHERE id = $1;`,
      [cartId],
    );

    // 11. Consume payment attempt in THIS SAME ACID transaction before commit
    const updateAttemptRes = await client.query<Record<string, unknown>>(
      `UPDATE public.payment_attempts
       SET status = 'consumed',
           provider_payment_id = $2,
           consumed_at = COALESCE(consumed_at, NOW()),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id;`,
      [attempt.id, payment.providerPaymentId],
    );

    if (updateAttemptRes.rows.length !== 1) {
      throw new Error(
        `Failed to finalize payment attempt: expected 1 row updated, got ${updateAttemptRes.rows.length}`,
      );
    }

    return { order, items: insertedItems, created: true };
  });
}

/**
 * List orders for a verified user, sorted newest first.
 */
export async function listOrdersForUser(
  userId: string,
  options?: { limit?: number; offset?: number },
): Promise<{ orders: DbOrder[]; totalCount: number; itemsByOrderId: Map<string, DbOrderItem[]> }> {
  if (!userId) {
    throw new Error("User ID is required to list orders");
  }

  const limit = options?.limit ?? 25;
  const offset = options?.offset ?? 0;

  const countRes = await query<{ count: string }>(
    `SELECT count(*) as count FROM public.orders WHERE user_id = $1;`,
    [userId],
  );
  const totalCount = Number(countRes.rows[0]?.count || 0);

  const ordersRes = await query<Record<string, unknown>>(
    `SELECT * FROM public.orders
     WHERE user_id = $1
     ORDER BY completed_at DESC
     LIMIT $2 OFFSET $3;`,
    [userId, limit, offset],
  );

  const orders = ordersRes.rows.map(mapOrderRow);
  const itemsByOrderId = new Map<string, DbOrderItem[]>();

  if (orders.length > 0) {
    const orderIds = orders.map((o) => o.id);
    const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(", ");
    const itemsRes = await query<Record<string, unknown>>(
      `SELECT * FROM public.order_items
       WHERE order_id IN (${placeholders})
       ORDER BY created_at ASC;`,
      orderIds,
    );

    for (const row of itemsRes.rows) {
      const item = mapOrderItemRow(row);
      const list = itemsByOrderId.get(item.order_id) || [];
      list.push(item);
      itemsByOrderId.set(item.order_id, list);
    }
  }

  return { orders, totalCount, itemsByOrderId };
}

/**
 * Retrieve a specific order by UUID or order_number for a verified user.
 */
export async function getOrderForUser(
  userId: string,
  orderIdOrNumber: string,
): Promise<{ order: DbOrder; items: DbOrderItem[] } | null> {
  if (!userId) {
    throw new Error("User ID is required to get order");
  }

  const isUuid = UUID_REGEX.test(orderIdOrNumber);

  const orderRes = isUuid
    ? await query<Record<string, unknown>>(
        `SELECT * FROM public.orders WHERE id = $1 AND user_id = $2;`,
        [orderIdOrNumber, userId],
      )
    : await query<Record<string, unknown>>(
        `SELECT * FROM public.orders WHERE order_number = $1 AND user_id = $2;`,
        [orderIdOrNumber, userId],
      );

  const row = orderRes.rows[0];
  if (!row) return null;

  const order = mapOrderRow(row);
  const itemsRes = await query<Record<string, unknown>>(
    `SELECT * FROM public.order_items WHERE order_id = $1 ORDER BY created_at ASC;`,
    [order.id],
  );

  return {
    order,
    items: itemsRes.rows.map(mapOrderItemRow),
  };
}

/**
 * Retrieve an order by its source cart ID with strict authorization:
 * - Authenticated: order.user_id matches auth.userId
 * - Guest: source cart guest_token_hash matches auth.guestTokenHash
 */
export async function getOrderBySourceCartAuthorized(
  cartId: string,
  auth: { userId?: string | null; guestTokenHash?: string | null; surface?: CartSurface },
): Promise<{ order: DbOrder; items: DbOrderItem[] } | null> {
  if (!UUID_REGEX.test(cartId)) return null;

  // 1. Fetch order and source cart together
  const res = await query<Record<string, unknown>>(
    `SELECT o.*, c.guest_token_hash as cart_guest_token_hash, c.user_id as cart_user_id, c.surface as cart_surface
     FROM public.orders o
     JOIN public.carts c ON o.source_cart_id = c.id
     WHERE o.source_cart_id = $1;`,
    [cartId],
  );

  const row = res.rows[0];
  if (!row) return null;

  // Surface isolation (defense-in-depth)
  if (auth.surface) {
    if (row.surface !== auth.surface || row.cart_surface !== auth.surface) {
      return null;
    }
  }

  // 2. Authorize
  const orderUserId = row.user_id as string | null;
  const cartGuestTokenHash = row.cart_guest_token_hash as string | null;

  let isAuthorized = false;
  if (auth.userId && orderUserId === auth.userId) {
    isAuthorized = true;
  } else if (auth.guestTokenHash && cartGuestTokenHash === auth.guestTokenHash) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return null;
  }

  const order = mapOrderRow(row);
  const itemsRes = await query<Record<string, unknown>>(
    `SELECT * FROM public.order_items WHERE order_id = $1 ORDER BY created_at ASC;`,
    [order.id],
  );

  return {
    order,
    items: itemsRes.rows.map(mapOrderItemRow),
  };
}
