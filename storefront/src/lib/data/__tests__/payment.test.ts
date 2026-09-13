import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCart,
  mockPlaceOrderFromCart,
  mockVerifyAuthSession,
  mockUpdateTag,
} = vi.hoisted(() => ({
  mockGetCart: vi.fn(),
  mockPlaceOrderFromCart: vi.fn(),
  mockVerifyAuthSession: vi.fn(),
  mockUpdateTag: vi.fn(),
}));

vi.mock("@/lib/data/cart", () => ({
  getCart: mockGetCart,
  verifyAuthSession: mockVerifyAuthSession,
}));

vi.mock("@/lib/db/order", () => ({
  placeOrderFromCart: mockPlaceOrderFromCart,
}));

vi.mock("@/lib/data/checkout", () => ({
  resolveSurfaceForCart: vi.fn().mockResolvedValue("dtc"),
}));

vi.mock("@/lib/spree", () => ({
  cacheTagSuffix: () => "",
  DEFAULT_SURFACE: "dtc",
  isWholesaleEnabled: vi.fn().mockReturnValue(false),
  getCartToken: vi.fn().mockResolvedValue("guest-bearer-token-raw-123"),
}));

vi.mock("next/cache", () => ({
  updateTag: mockUpdateTag,
}));

import { completeCheckoutOrder } from "@/lib/data/payment";

const mockDbOrder = {
  id: "33333333-3333-3333-3333-333333333333",
  user_id: null,
  source_cart_id: "cart-1",
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
  checkout_email: "customer@example.com",
  completed_at: new Date("2026-09-13T10:00:00Z"),
  created_at: new Date("2026-09-13T10:00:00Z"),
  updated_at: new Date("2026-09-13T10:00:00Z"),
};

describe("payment server actions (first-party architecture)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("completeCheckoutOrder", () => {
    it("completes checkout for authenticated user with verified user ID", async () => {
      mockVerifyAuthSession.mockResolvedValue({
        status: "authenticated",
        userId: "auth-user-999",
      });
      mockPlaceOrderFromCart.mockResolvedValue({
        order: { ...mockDbOrder, user_id: "auth-user-999" },
        items: [],
      });

      const result = await completeCheckoutOrder("cart-1");

      expect(mockPlaceOrderFromCart).toHaveBeenCalledWith({
        cartId: "cart-1",
        surface: "dtc",
        verifiedUserId: "auth-user-999",
        guestTokenHash: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order.number).toBe("MRZ-TEST123456");
      }
      expect(mockUpdateTag).toHaveBeenCalledWith("checkout");
      expect(mockUpdateTag).toHaveBeenCalledWith("cart");
    });

    it("completes checkout for guest using SHA-256 hashed bearer token", async () => {
      mockVerifyAuthSession.mockResolvedValue({
        status: "anonymous",
      });
      mockPlaceOrderFromCart.mockResolvedValue({
        order: mockDbOrder,
        items: [],
      });

      const expectedHash = crypto
        .createHash("sha256")
        .update("guest-bearer-token-raw-123")
        .digest("hex");

      const result = await completeCheckoutOrder("cart-1");

      expect(mockPlaceOrderFromCart).toHaveBeenCalledWith({
        cartId: "cart-1",
        surface: "dtc",
        verifiedUserId: null,
        guestTokenHash: expectedHash,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order.number).toBe("MRZ-TEST123456");
      }
    });

    it("uses explicitly provided surface when known", async () => {
      mockVerifyAuthSession.mockResolvedValue({
        status: "authenticated",
        userId: "wholesale-user-1",
      });
      mockPlaceOrderFromCart.mockResolvedValue({
        order: { ...mockDbOrder, user_id: "wholesale-user-1" },
        items: [],
      });

      const result = await completeCheckoutOrder("cart-1", "wholesale");

      expect(mockPlaceOrderFromCart).toHaveBeenCalledWith({
        cartId: "cart-1",
        surface: "wholesale",
        verifiedUserId: "wholesale-user-1",
        guestTokenHash: null,
      });
      expect(result.success).toBe(true);
    });

    it("returns error on placement failure (e.g. empty cart)", async () => {
      mockVerifyAuthSession.mockResolvedValue({ status: "anonymous" });
      mockPlaceOrderFromCart.mockRejectedValue(new Error("Cart not found or empty"));

      const result = await completeCheckoutOrder("cart-1");

      expect(result).toEqual({
        success: false,
        error: "Cart not found or empty",
      });
    });

    it("returns generic error message on non-Error exceptions", async () => {
      mockVerifyAuthSession.mockResolvedValue({ status: "anonymous" });
      mockPlaceOrderFromCart.mockRejectedValue("unexpected transport failure");

      const result = await completeCheckoutOrder("cart-1");

      expect(result).toEqual({
        success: false,
        error: "Failed to complete order",
      });
    });
  });
});
