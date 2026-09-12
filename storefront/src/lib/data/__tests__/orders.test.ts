import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCookies,
  mockGetClaims,
  mockListOrdersForUser,
  mockGetOrderForUser,
} = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockGetClaims: vi.fn(),
  mockListOrdersForUser: vi.fn(),
  mockGetOrderForUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getClaims: mockGetClaims,
    },
  }),
}));

vi.mock("@/lib/db/order", () => ({
  listOrdersForUser: mockListOrdersForUser,
  getOrderForUser: mockGetOrderForUser,
}));

import { getOrder, getOrders } from "@/lib/data/orders";

const mockDbOrder = {
  id: "33333333-3333-3333-3333-333333333333",
  user_id: "user-123",
  source_cart_id: "cart-abc",
  order_number: "MRZ-TEST123456",
  status: "complete",
  currency: "USD",
  subtotal_in_cents: 9000,
  shipping_in_cents: 0,
  tax_in_cents: 900,
  total_in_cents: 9900,
  shipping_address_snapshot: {
    first_name: "John",
    last_name: "Doe",
    address1: "123 Main St",
    city: "New York",
    state_name: "NY",
    postal_code: "10001",
    country_iso: "US",
  },
  billing_address_snapshot: null,
  email: "john@example.com",
  surface: "dtc" as const,
  completed_at: new Date("2026-09-12T12:00:00Z"),
  created_at: new Date("2026-09-12T12:00:00Z"),
  updated_at: new Date("2026-09-12T12:00:00Z"),
};

const mockDbOrderItem = {
  id: "44444444-4444-4444-4444-444444444444",
  order_id: "33333333-3333-3333-3333-333333333333",
  variant_id: null,
  product_name: "Test Oxford Shoe",
  sku: "TEST-SKU-42",
  size_option: "42",
  price_in_cents: 9000,
  quantity: 1,
  total_in_cents: 9000,
  thumbnail_url: "https://example.com/test.jpg",
  created_at: new Date("2026-09-12T12:00:00Z"),
};

describe("First-Party Orders Data Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrders", () => {
    it("returns empty list without remote calls when no auth cookie is present (fast path)", async () => {
      mockCookies.mockResolvedValue({
        getAll: () => [{ name: "unrelated-cookie", value: "foo" }],
      });

      const result = await getOrders();

      expect(result.data).toEqual([]);
      expect(result.meta.count).toBe(0);
      expect(mockGetClaims).not.toHaveBeenCalled();
      expect(mockListOrdersForUser).not.toHaveBeenCalled();
    });

    it("returns empty list when auth session is invalid / expired", async () => {
      mockCookies.mockResolvedValue({
        getAll: () => [{ name: "sb-hkncfdsvgjopkujmmxem-auth-token", value: "bad" }],
      });
      mockGetClaims.mockResolvedValue({
        data: null,
        error: { name: "AuthSessionMissingError", message: "Auth session missing" },
      });

      const result = await getOrders();

      expect(result.data).toEqual([]);
      expect(result.meta.count).toBe(0);
      expect(mockListOrdersForUser).not.toHaveBeenCalled();
    });

    it("fails closed (throws) when auth verification suffers a 500+ outage or transport error", async () => {
      mockCookies.mockResolvedValue({
        getAll: () => [{ name: "sb-hkncfdsvgjopkujmmxem-auth-token", value: "token" }],
      });
      mockGetClaims.mockResolvedValue({
        data: null,
        error: { status: 503, message: "Service Unavailable" },
      });

      await expect(getOrders()).rejects.toThrow("Service Unavailable");
      expect(mockListOrdersForUser).not.toHaveBeenCalled();
    });

    it("fails closed (throws) when DB query fails", async () => {
      mockCookies.mockResolvedValue({
        getAll: () => [{ name: "sb-hkncfdsvgjopkujmmxem-auth-token", value: "token" }],
      });
      mockGetClaims.mockResolvedValue({
        data: { claims: { sub: "user-123" } },
        error: null,
      });
      mockListOrdersForUser.mockRejectedValue(new Error("Connection terminated unexpectedly"));

      await expect(getOrders()).rejects.toThrow("Connection terminated unexpectedly");
    });

    it("returns adapted orders with pagination metadata for authenticated user", async () => {
      mockCookies.mockResolvedValue({
        getAll: () => [{ name: "sb-hkncfdsvgjopkujmmxem-auth-token", value: "token" }],
      });
      mockGetClaims.mockResolvedValue({
        data: { claims: { sub: "user-123" } },
        error: null,
      });

      const itemsMap = new Map();
      itemsMap.set(mockDbOrder.id, [mockDbOrderItem]);

      mockListOrdersForUser.mockResolvedValue({
        orders: [mockDbOrder],
        totalCount: 1,
        itemsByOrderId: itemsMap,
      });

      const result = await getOrders({ page: 1, limit: 10 });

      expect(mockListOrdersForUser).toHaveBeenCalledWith("user-123", {
        limit: 10,
        offset: 0,
      });
      expect(result.data).toHaveLength(1);

      const order = result.data[0];
      expect(order.id).toBe(mockDbOrder.id);
      expect(order.number).toBe("MRZ-TEST123456");
      expect(order.email).toBe("john@example.com");
      expect(order.total).toBe("99.00");
      expect(order.display_total).toBe("$99.00");
      expect(order.display_item_total).toBe("$90.00");
      expect(order.items).toHaveLength(1);
      expect(order.items[0].name).toBe("Test Oxford Shoe");
      expect((order.items[0] as any).sku).toBe("TEST-SKU-42");
      expect(order.items[0].display_price).toBe("$90.00");
      expect(result.meta).toEqual({
        count: 1,
        pages: 1,
        page: 1,
        limit: 10,
        from: 1,
        to: 1,
        in: 1,
        previous: null,
        next: null,
      });
    });
  });

  describe("getOrder", () => {
    it("returns null without remote calls when no auth cookie is present (fast path)", async () => {
      mockCookies.mockResolvedValue({
        getAll: () => [],
      });

      const result = await getOrder("MRZ-TEST123456");

      expect(result).toBeNull();
      expect(mockGetClaims).not.toHaveBeenCalled();
      expect(mockGetOrderForUser).not.toHaveBeenCalled();
    });

    it("returns null when order is not found or belongs to another user", async () => {
      mockCookies.mockResolvedValue({
        getAll: () => [{ name: "sb-hkncfdsvgjopkujmmxem-auth-token", value: "token" }],
      });
      mockGetClaims.mockResolvedValue({
        data: { claims: { sub: "user-123" } },
        error: null,
      });
      mockGetOrderForUser.mockResolvedValue(null);

      const result = await getOrder("foreign-order-id");

      expect(mockGetOrderForUser).toHaveBeenCalledWith("user-123", "foreign-order-id");
      expect(result).toBeNull();
    });

    it("fails closed (throws) when DB query fails during single order lookup", async () => {
      mockCookies.mockResolvedValue({
        getAll: () => [{ name: "sb-hkncfdsvgjopkujmmxem-auth-token", value: "token" }],
      });
      mockGetClaims.mockResolvedValue({
        data: { claims: { sub: "user-123" } },
        error: null,
      });
      mockGetOrderForUser.mockRejectedValue(new Error("Database offline"));

      await expect(getOrder("MRZ-TEST123456")).rejects.toThrow("Database offline");
    });

    it("returns adapted order details when found for authenticated user", async () => {
      mockCookies.mockResolvedValue({
        getAll: () => [{ name: "sb-hkncfdsvgjopkujmmxem-auth-token", value: "token" }],
      });
      mockGetClaims.mockResolvedValue({
        data: { claims: { sub: "user-123" } },
        error: null,
      });
      mockGetOrderForUser.mockResolvedValue({
        order: mockDbOrder,
        items: [mockDbOrderItem],
      });

      const result = await getOrder("MRZ-TEST123456");

      expect(mockGetOrderForUser).toHaveBeenCalledWith("user-123", "MRZ-TEST123456");
      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockDbOrder.id);
      expect(result?.number).toBe("MRZ-TEST123456");
      expect(result?.shipping_address?.address1).toBe("123 Main St");
      expect(result?.items).toHaveLength(1);
    });
  });
});
