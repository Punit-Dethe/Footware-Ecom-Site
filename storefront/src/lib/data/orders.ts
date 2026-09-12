"use server";

import type { Order, OrderListParams } from "@spree/sdk";
import { cookies } from "next/headers";
import { getOrderForUser, listOrdersForUser } from "@/lib/db/order";
import type { Surface } from "@/lib/spree";
import { createClient } from "@/lib/supabase/server";
import { adaptDbOrderToSpree } from "./order-adapter";

/**
 * Extracts and cryptographically verifies the authenticated Supabase user ID.
 * Follows strict fail-closed semantics identical to B4:
 * - Anonymous / no auth cookie -> returns null (0 remote network calls)
 * - Expired/invalid session -> returns null
 * - Supabase outage (500+, network failure) -> throws (fails closed)
 */
async function getVerifiedUserId(options?: {
  allowAnonymous?: boolean;
}): Promise<string | null> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"),
  );

  if (!hasAuthCookie) {
    if (options?.allowAnonymous) {
      return null;
    }
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    const name = error.name || "";
    if (
      (typeof status === "number" && status >= 500) ||
      name === "AuthRetryableFetchError" ||
      error.message?.includes("fetch failed")
    ) {
      throw error;
    }
    if (options?.allowAnonymous) {
      return null;
    }
    throw new Error("Unauthorized");
  }

  if (!data?.claims?.sub || typeof data.claims.sub !== "string") {
    if (options?.allowAnonymous) {
      return null;
    }
    throw new Error("Unauthorized");
  }

  return data.claims.sub;
}

/**
 * Retrieve paginated order history for the authenticated user from PostgreSQL public.orders.
 * Zero Spree backend calls, zero Spree fallback.
 */
export async function getOrders(params?: OrderListParams): Promise<{
  data: Order[];
  meta: {
    page: number;
    limit: number;
    count: number;
    pages: number;
    from: number;
    to: number;
    in: number;
    previous: number | null;
    next: number | null;
  };
}> {
  const userId = await getVerifiedUserId({ allowAnonymous: true });
  if (!userId) {
    return {
      data: [],
      meta: {
        page: 1,
        limit: params?.limit ?? 25,
        count: 0,
        pages: 0,
        from: 0,
        to: 0,
        in: 0,
        previous: null,
        next: null,
      },
    };
  }

  const limit = params?.limit ?? 25;
  const page = params?.page ?? 1;
  const offset = (page - 1) * limit;

  const { orders, totalCount, itemsByOrderId } = await listOrdersForUser(
    userId,
    { limit, offset },
  );

  const adaptedOrders = orders.map((order) =>
    adaptDbOrderToSpree(order, itemsByOrderId.get(order.id) || []),
  );

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: adaptedOrders,
    meta: {
      page,
      limit,
      count: totalCount,
      pages: totalPages,
      from: totalCount > 0 ? offset + 1 : 0,
      to: Math.min(offset + limit, totalCount),
      in: adaptedOrders.length,
      previous: page > 1 ? page - 1 : null,
      next: page < totalPages ? page + 1 : null,
    },
  };
}

/**
 * Retrieve a single order by ID or order number, scoped strictly to the authenticated user.
 * Zero Spree backend calls, zero Spree fallback.
 */
export async function getOrder(
  id: string,
  _params?: Record<string, unknown>,
  _surface?: Surface,
): Promise<Order | null> {
  const userId = await getVerifiedUserId({ allowAnonymous: true });
  if (!userId) {
    return null;
  }

  const result = await getOrderForUser(userId, id);
  if (!result) return null;

  return adaptDbOrderToSpree(result.order, result.items);
}
