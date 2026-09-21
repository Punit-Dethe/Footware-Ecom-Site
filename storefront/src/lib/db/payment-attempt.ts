import "server-only";

import { query } from "./index";

export type PaymentAttemptStatus = "created" | "paid" | "consumed" | "failed";

export interface DbPaymentAttempt {
  id: string;
  cart_id: string;
  surface: string;
  provider: string;
  provider_order_id: string;
  provider_payment_id: string | null;
  amount_in_cents: number;
  currency: string;
  status: PaymentAttemptStatus;
  created_at: Date;
  updated_at: Date;
  consumed_at: Date | null;
}

function mapPaymentAttemptRow(row: Record<string, unknown>): DbPaymentAttempt {
  return {
    id: row.id as string,
    cart_id: row.cart_id as string,
    surface: row.surface as string,
    provider: row.provider as string,
    provider_order_id: row.provider_order_id as string,
    provider_payment_id: (row.provider_payment_id as string) ?? null,
    amount_in_cents: Number(row.amount_in_cents),
    currency: row.currency as string,
    status: row.status as PaymentAttemptStatus,
    created_at: new Date(row.created_at as string | number | Date),
    updated_at: new Date(row.updated_at as string | number | Date),
    consumed_at: row.consumed_at
      ? new Date(row.consumed_at as string | number | Date)
      : null,
  };
}

/**
 * Persists an authoritative server-side payment attempt bound to a specific cart and surface.
 */
export async function createPaymentAttempt(params: {
  cartId: string;
  surface: string;
  provider?: string;
  providerOrderId: string;
  amountInCents: number;
  currency: string;
}): Promise<DbPaymentAttempt> {
  const {
    cartId,
    surface,
    provider = "razorpay",
    providerOrderId,
    amountInCents,
    currency,
  } = params;

  const res = await query<Record<string, unknown>>(
    `INSERT INTO public.payment_attempts (
       cart_id, surface, provider, provider_order_id, amount_in_cents, currency, status, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, 'created', NOW(), NOW())
     RETURNING *;`,
    [cartId, surface, provider, providerOrderId, amountInCents, currency.toUpperCase()],
  );

  return mapPaymentAttemptRow(res.rows[0]);
}

/**
 * Look up a server-trusted payment attempt strictly bound to the requested cart and surface.
 * Defends against cross-cart payment replay.
 */
export async function findPaymentAttempt(params: {
  providerOrderId: string;
  cartId: string;
  surface: string;
}): Promise<DbPaymentAttempt | null> {
  const { providerOrderId, cartId, surface } = params;

  const res = await query<Record<string, unknown>>(
    `SELECT * FROM public.payment_attempts
     WHERE provider_order_id = $1 AND cart_id = $2 AND surface = $3
     LIMIT 1;`,
    [providerOrderId, cartId, surface],
  );

  if (res.rows.length === 0) {
    return null;
  }

  return mapPaymentAttemptRow(res.rows[0]);
}

/**
 * Marks a payment attempt as consumed after successful order creation.
 * Idempotent: returns existing attempt if already consumed with the same payment ID.
 */
export async function markPaymentAttemptConsumed(params: {
  attemptId: string;
  providerPaymentId: string;
}): Promise<DbPaymentAttempt> {
  const { attemptId, providerPaymentId } = params;

  const res = await query<Record<string, unknown>>(
    `UPDATE public.payment_attempts
     SET status = 'consumed',
         provider_payment_id = $2,
         consumed_at = COALESCE(consumed_at, NOW()),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *;`,
    [attemptId, providerPaymentId],
  );

  if (res.rows.length === 0) {
    throw new Error(`Payment attempt '${attemptId}' not found`);
  }

  return mapPaymentAttemptRow(res.rows[0]);
}
