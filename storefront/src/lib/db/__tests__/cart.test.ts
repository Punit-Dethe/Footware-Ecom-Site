import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuery = vi.fn();

vi.mock("../index", () => ({
  query: (text: string, params?: unknown[]) => mockQuery(text, params),
  transaction: vi.fn(),
}));

import { updateAuthorizedCartCheckoutData } from "../cart";

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
