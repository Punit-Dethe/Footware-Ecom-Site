import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuery = vi.fn();
const mockTransaction = vi.fn();

vi.mock("../index", () => ({
  query: (text: string, params?: unknown[]) => mockQuery(text, params),
  transaction: (cb: any) => mockTransaction(cb),
}));

import { claimOrMergeGuestCart, updateAuthorizedCartCheckoutData } from "../cart";

describe("Database Cart Repository - updateAuthorizedCartCheckoutData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authenticated owner updates active cart on correct surface -> PASS", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const success = await updateAuthorizedCartCheckoutData({
      cartId: "11111111-1111-1111-1111-111111111111",
      surface: "dtc",
      auth: { userId: "user-1" },
      data: {
        checkout_email: "owner@example.com",
        shipping_address: { city: "Dallas" },
      },
    });

    expect(success).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain("UPDATE public.carts");
    expect(sql).toContain("WHERE id = $1");
    expect(sql).toContain("AND surface = $2");
    expect(sql).toContain("AND status = 'active'");
    expect(sql).toContain("AND user_id = $");
    expect(params[0]).toBe("11111111-1111-1111-1111-111111111111");
    expect(params[1]).toBe("dtc");
    expect(params).toContain("user-1");
    expect(params).toContain("owner@example.com");
  });

  it("correct guest bearer updates active cart -> PASS", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const success = await updateAuthorizedCartCheckoutData({
      cartId: "11111111-1111-1111-1111-111111111111",
      surface: "dtc",
      auth: { guestTokenHash: "valid-hash" },
      data: {
        checkout_email: "guest@example.com",
      },
    });

    expect(success).toBe(true);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain("AND guest_token_hash = $");
    expect(params).toContain("valid-hash");
  });

  it("foreign authenticated user is denied when rowCount is 0", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const success = await updateAuthorizedCartCheckoutData({
      cartId: "11111111-1111-1111-1111-111111111111",
      surface: "dtc",
      auth: { userId: "foreign-user" },
      data: { checkout_email: "attacker@example.com" },
    });

    expect(success).toBe(false);
  });

  it("UUID-only checkout-state write denied without auth credentials", async () => {
    const success = await updateAuthorizedCartCheckoutData({
      cartId: "11111111-1111-1111-1111-111111111111",
      surface: "dtc",
      auth: { userId: null, guestTokenHash: null },
      data: { checkout_email: "attacker@example.com" },
    });

    expect(success).toBe(false);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("non-UUID cart id is denied immediately", async () => {
    const success = await updateAuthorizedCartCheckoutData({
      cartId: "not-a-uuid",
      surface: "dtc",
      auth: { userId: "user-1" },
      data: { checkout_email: "test@example.com" },
    });

    expect(success).toBe(false);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("wrong guest token is denied by SQL matching", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const success = await updateAuthorizedCartCheckoutData({
      cartId: "11111111-1111-1111-1111-111111111111",
      surface: "dtc",
      auth: { guestTokenHash: "wrong-token-hash" },
      data: { checkout_email: "attacker@example.com" },
    });

    expect(success).toBe(false);
  });

  it("cross-surface credentials denied when surface filter does not match", async () => {
    // Client requests wholesale update on DTC cart
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const success = await updateAuthorizedCartCheckoutData({
      cartId: "11111111-1111-1111-1111-111111111111",
      surface: "wholesale",
      auth: { userId: "user-1" },
      data: { checkout_email: "user@example.com" },
    });

    expect(success).toBe(false);
    const [, params] = mockQuery.mock.calls[0];
    expect(params[1]).toBe("wholesale");
  });

  it("converted or abandoned cart checkout-state write is denied by status = 'active' requirement", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const success = await updateAuthorizedCartCheckoutData({
      cartId: "11111111-1111-1111-1111-111111111111",
      surface: "dtc",
      auth: { userId: "user-1" },
      data: { checkout_email: "user@example.com" },
    });

    expect(success).toBe(false);
    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toContain("AND status = 'active'");
  });

  it("DB checkout write failure propagates", async () => {
    mockQuery.mockRejectedValueOnce(new Error("PostgreSQL connection timeout"));

    await expect(
      updateAuthorizedCartCheckoutData({
        cartId: "11111111-1111-1111-1111-111111111111",
        surface: "dtc",
        auth: { userId: "user-1" },
        data: { checkout_email: "user@example.com" },
      }),
    ).rejects.toThrow("PostgreSQL connection timeout");
  });
});

describe("Database Cart Repository - claimOrMergeGuestCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Case A: guest cart exists, user cart does not -> claims guest cart directly", async () => {
    mockTransaction.mockImplementation(async (cb) => {
      const fakeClient = {
        query: vi
          .fn()
          .mockResolvedValueOnce({
            // 1. Lock guest cart
            rows: [
              {
                id: "guest-cart-1",
                user_id: null,
                guest_token_hash: "hash-guest",
                surface: "dtc",
                currency: "USD",
                status: "active",
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          })
          .mockResolvedValueOnce({
            // 2. Lock user cart (none)
            rows: [],
          })
          .mockResolvedValueOnce({
            // 3. Claim guest cart
            rows: [
              {
                id: "guest-cart-1",
                user_id: "user-1",
                guest_token_hash: null,
                surface: "dtc",
                currency: "USD",
                status: "active",
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          }),
      };
      return cb(fakeClient);
    });

    const res = await claimOrMergeGuestCart("user-1", "hash-guest", "dtc");
    expect(res.id).toBe("guest-cart-1");
    expect(res.user_id).toBe("user-1");
    expect(res.guest_token_hash).toBeNull();
  });

  it("Case B: user cart exists, guest cart does not -> returns user cart", async () => {
    mockTransaction.mockImplementation(async (cb) => {
      const fakeClient = {
        query: vi
          .fn()
          .mockResolvedValueOnce({
            // 1. Lock guest cart (none)
            rows: [],
          })
          .mockResolvedValueOnce({
            // 2. Lock user cart
            rows: [
              {
                id: "user-cart-1",
                user_id: "user-1",
                guest_token_hash: null,
                surface: "dtc",
                currency: "USD",
                status: "active",
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          }),
      };
      return cb(fakeClient);
    });

    const res = await claimOrMergeGuestCart("user-1", "hash-guest", "dtc");
    expect(res.id).toBe("user-cart-1");
    expect(res.user_id).toBe("user-1");
  });

  it("Case C: both exist -> merges items into user cart with variant_id and abandons guest cart", async () => {
    const executedQueries: any[] = [];
    mockTransaction.mockImplementation(async (cb) => {
      const fakeClient = {
        query: vi.fn(async (sql: string, params?: any[]) => {
          executedQueries.push({ sql, params });
          if (sql.includes("WHERE guest_token_hash = $1")) {
            return {
              rows: [
                {
                  id: "guest-cart-1",
                  user_id: null,
                  guest_token_hash: "hash-guest",
                  surface: "dtc",
                  currency: "USD",
                  status: "active",
                },
              ],
            };
          }
          if (sql.includes("WHERE user_id = $1")) {
            return {
              rows: [
                {
                  id: "user-cart-1",
                  user_id: "user-1",
                  guest_token_hash: null,
                  surface: "dtc",
                  currency: "USD",
                  status: "active",
                },
              ],
            };
          }
          if (sql.includes("FROM public.cart_items") && sql.includes("cart_id = $1")) {
            return {
              rows: [
                {
                  id: "item-1",
                  cart_id: "guest-cart-1",
                  variant_id: "var-uuid-99",
                  variant_sku: "MIRZA-OFF-001-8",
                  quantity: 2,
                },
              ],
            };
          }
          return { rowCount: 1, rows: [] };
        }),
      };
      return cb(fakeClient);
    });

    const res = await claimOrMergeGuestCart("user-1", "hash-guest", "dtc");
    expect(res.id).toBe("user-cart-1");

    // Verify INSERT statement merges both variant_id and variant_sku, with conflict resolution
    const insertCall = executedQueries.find((q) =>
      q.sql.includes("INSERT INTO public.cart_items"),
    );
    expect(insertCall).toBeDefined();
    expect(insertCall.sql).toContain("variant_id");
    expect(insertCall.sql).toContain("variant_sku");
    expect(insertCall.sql).toContain("SET variant_id = EXCLUDED.variant_id");
    expect(insertCall.sql).toContain("quantity = public.cart_items.quantity + EXCLUDED.quantity");
    expect(insertCall.params).toEqual(["user-cart-1", "var-uuid-99", "MIRZA-OFF-001-8", 2]);

    // Verify guest cart was marked abandoned
    const abandonCall = executedQueries.find((q) =>
      q.sql.includes("status = 'abandoned'"),
    );
    expect(abandonCall).toBeDefined();
    expect(abandonCall.params[0]).toBe("guest-cart-1");
  });
});
