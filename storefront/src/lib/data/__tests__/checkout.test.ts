import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCart,
  mockGetOrderBySourceCartAuthorized,
  mockUpdateAuthorizedCartCheckoutData,
  mockUpdateAuthorizedCartCurrency,
  mockVerifyAuthSession,
  mockGetCartToken,
} = vi.hoisted(() => ({
  mockGetCart: vi.fn(),
  mockGetOrderBySourceCartAuthorized: vi.fn(),
  mockUpdateAuthorizedCartCheckoutData: vi.fn().mockResolvedValue(true),
  mockUpdateAuthorizedCartCurrency: vi.fn().mockResolvedValue(true),
  mockVerifyAuthSession: vi.fn().mockResolvedValue({ status: "anonymous" }),
  mockGetCartToken: vi.fn().mockResolvedValue("order-token-123"),
}));

vi.mock("@/lib/data/cart", () => ({
  getCart: mockGetCart,
  verifyAuthSession: mockVerifyAuthSession,
}));

vi.mock("@/lib/db/order", () => ({
  getOrderBySourceCartAuthorized: mockGetOrderBySourceCartAuthorized,
}));

vi.mock("@/lib/db/cart", () => ({
  findCartById: vi.fn().mockResolvedValue(null),
  updateAuthorizedCartCheckoutData: mockUpdateAuthorizedCartCheckoutData,
  updateAuthorizedCartCurrency: mockUpdateAuthorizedCartCurrency,
}));

vi.mock("@/lib/spree", () => ({
  cacheTagSuffix: () => "",
  DEFAULT_SURFACE: "dtc",
  isWholesaleEnabled: vi.fn().mockReturnValue(false),
  getCartToken: mockGetCartToken,
  getCartId: vi.fn((surface = "dtc") =>
    Promise.resolve(surface === "wholesale" ? undefined : "order-1"),
  ),
  getAccessToken: vi.fn().mockResolvedValue(undefined),
  setCartCookies: vi.fn(),
  clearCartCookies: vi.fn(),
  isPoisonedDtcCartId: vi.fn().mockResolvedValue(false),
  getCartOptions: vi.fn().mockResolvedValue({
    spreeToken: "order-token-123",
    token: undefined,
  }),
  requireCartId: vi.fn().mockResolvedValue("order-1"),
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

import {
  getCheckoutOrder,
  selectDeliveryRate,
  updateCartMarket,
  updateOrderAddresses,
} from "@/lib/data/checkout";

const mockOrder = {
  id: "order-1",
  number: "R100",
  current_step: "address",
  items: [],
  currency: "USD",
  total: "50.00",
  display_total: "$50.00",
} as any;

describe("checkout server actions (first-party architecture)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCheckoutOrder", () => {
    it("returns cart when still in checkout", async () => {
      mockGetCart.mockResolvedValue(mockOrder);

      const result = await getCheckoutOrder("order-1");

      expect(mockGetCart).toHaveBeenCalled();
      expect(result).toBe(mockOrder);
    });

    it("falls back to getCompletedOrder when cart is null (completed)", async () => {
      mockGetCart.mockResolvedValue(null);
      mockGetOrderBySourceCartAuthorized.mockResolvedValue({
        order: {
          id: "33333333-3333-3333-3333-333333333333",
          user_id: null,
          source_cart_id: "order-1",
          order_number: "MRZ-TEST123456",
          status: "complete",
          currency: "USD",
          total_in_cents: 5000,
          item_total_in_cents: 5000,
          tax_total_in_cents: 0,
          shipping_total_in_cents: 0,
          discount_total_in_cents: 0,
          shipping_address: null,
          billing_address: null,
          checkout_email: "guest@example.com",
          completed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        items: [],
      });

      const result = await getCheckoutOrder("order-1");

      expect(mockGetOrderBySourceCartAuthorized).toHaveBeenCalledWith(
        "order-1",
        {
          userId: null,
          guestTokenHash: expect.any(String),
          surface: "dtc",
        },
      );
      expect(result).not.toBeNull();
      expect(result?.number).toBe("MRZ-TEST123456");
    });

    it("returns null when both cart and order fail", async () => {
      mockGetCart.mockResolvedValue(null);
      mockGetOrderBySourceCartAuthorized.mockResolvedValue(null);

      const result = await getCheckoutOrder("bad-id");

      expect(result).toBeNull();
    });
  });

  describe("updateOrderAddresses", () => {
    it("persists checkout data to PostgreSQL and returns first-party cart without Spree mirror call", async () => {
      mockUpdateAuthorizedCartCheckoutData.mockResolvedValue(true);
      mockGetCart.mockResolvedValue(mockOrder);
      const addresses = { email: "test@example.com" };

      const result = await updateOrderAddresses("order-1", addresses);

      expect(mockUpdateAuthorizedCartCheckoutData).toHaveBeenCalledWith({
        cartId: "order-1",
        surface: "dtc",
        auth: {
          userId: null,
          guestTokenHash: expect.any(String),
        },
        data: {
          shipping_address: undefined,
          billing_address: undefined,
          checkout_email: "test@example.com",
        },
      });
      expect(mockGetCart).toHaveBeenCalledWith("order-1", "dtc");
      expect(result).toEqual({ success: true, cart: mockOrder });
    });

    it("denies update when anonymous with no guest token", async () => {
      mockVerifyAuthSession.mockResolvedValueOnce({ status: "anonymous" });
      mockGetCartToken.mockResolvedValueOnce(undefined);

      const result = await updateOrderAddresses("order-1", {
        email: "test@example.com",
      });

      expect(result).toEqual({
        success: false,
        error: "Unauthorized to update checkout addresses",
      });
      expect(mockUpdateAuthorizedCartCheckoutData).not.toHaveBeenCalled();
    });

    it("denies update when first-party write fails authorization", async () => {
      mockUpdateAuthorizedCartCheckoutData.mockResolvedValueOnce(false);

      const result = await updateOrderAddresses("order-1", {
        email: "test@example.com",
      });

      expect(result).toEqual({
        success: false,
        error:
          "Failed to update cart checkout data: cart not found or unauthorized",
      });
    });

    it("fails action and propagates when first-party DB write throws", async () => {
      mockUpdateAuthorizedCartCheckoutData.mockRejectedValueOnce(
        new Error("Database connection error"),
      );

      const result = await updateOrderAddresses("order-1", {
        email: "test@example.com",
      });

      expect(result).toEqual({
        success: false,
        error: "Database connection error",
      });
    });
  });

  describe("updateCartMarket", () => {
    it("updates currency in PostgreSQL and returns updated cart", async () => {
      mockUpdateAuthorizedCartCurrency.mockResolvedValue(true);
      const updatedOrder = { ...mockOrder, currency: "EUR" };
      mockGetCart.mockResolvedValue(updatedOrder);

      const result = await updateCartMarket("order-1", {
        currency: "EUR",
        locale: "de",
      });

      expect(mockUpdateAuthorizedCartCurrency).toHaveBeenCalledWith({
        cartId: "order-1",
        surface: "dtc",
        currency: "EUR",
        auth: expect.any(Object),
      });
      expect(result).toEqual({ success: true, cart: updatedOrder });
    });
  });

  describe("selectDeliveryRate (retired live mutation path)", () => {
    it("returns current cart without calling external shipping engine", async () => {
      mockGetCart.mockResolvedValue(mockOrder);

      const result = await selectDeliveryRate("order-1", "ship-1", "rate-1");

      expect(result).toEqual({ success: true, cart: mockOrder });
    });
  });
});
