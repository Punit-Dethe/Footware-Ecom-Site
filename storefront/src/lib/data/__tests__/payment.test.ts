import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetCart, mockPlaceOrderFromCart, mockGetCompletedOrder } = vi.hoisted(() => ({
  mockGetCart: vi.fn(),
  mockPlaceOrderFromCart: vi.fn(),
  mockGetCompletedOrder: vi.fn(),
}));

vi.mock("@/lib/data/cart", () => ({
  getCart: mockGetCart,
  verifyAuthSession: vi.fn().mockResolvedValue({ status: "anonymous" }),
}));

vi.mock("@/lib/db/order", () => ({
  placeOrderFromCart: mockPlaceOrderFromCart,
}));

vi.mock("@/lib/data/checkout", () => ({
  resolveSurfaceForCart: vi.fn().mockResolvedValue("dtc"),
  resolveSurfaceForCartVerified: vi.fn().mockResolvedValue("dtc"),
  getCompletedOrder: mockGetCompletedOrder,
}));

vi.mock("@/lib/spree", () => ({
  cacheTagSuffix: () => "",
  DEFAULT_SURFACE: "dtc",
  isWholesaleEnabled: vi.fn().mockReturnValue(false),
  getCartToken: vi.fn().mockResolvedValue("order-token-123"),
  getCartId: vi.fn().mockResolvedValue("cart-1"),
  getAccessToken: vi.fn().mockResolvedValue(undefined),
  setCartCookies: vi.fn(),
  clearCartCookies: vi.fn(),
  getCartOptions: vi.fn().mockResolvedValue({
    spreeToken: "order-token-123",
    token: undefined,
  }),
  requireCartId: vi.fn().mockResolvedValue("cart-1"),
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

import {
  completeCheckoutOrder,
  confirmPaymentAndCompleteCart,
  createCheckoutPaymentSession,
  createDirectPayment,
} from "@/lib/data/payment";

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
  checkout_email: "guest@example.com",
  completed_at: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
};

const mockOrder = {
  id: "cart-1",
  number: "R100",
  current_step: "complete",
  items: [],
  currency: "USD",
  total: "50.00",
  display_total: "$50.00",
} as any;

describe("payment server actions (first-party architecture)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("completeCheckoutOrder", () => {
    it("places order in PostgreSQL and returns placed order", async () => {
      mockPlaceOrderFromCart.mockResolvedValue({
        order: mockDbOrder,
        items: [],
      });

      const result = await completeCheckoutOrder("cart-1");

      expect(mockPlaceOrderFromCart).toHaveBeenCalledWith({
        cartId: "cart-1",
        surface: "dtc",
        verifiedUserId: null,
        guestTokenHash: expect.any(String),
      });
      expect(result.success).toBe(true);
      expect(result.order?.number).toBe("MRZ-TEST123456");
    });

    it("returns error on placement failure", async () => {
      mockPlaceOrderFromCart.mockRejectedValue(new Error("Cart not found or empty"));

      const result = await completeCheckoutOrder("cart-1");

      expect(result).toEqual({
        success: false,
        error: "Cart not found or empty",
      });
    });
  });

  describe("confirmPaymentAndCompleteCart", () => {
    it("returns existing completed order when cart is already converted", async () => {
      mockGetCart.mockResolvedValue(null);
      mockGetCompletedOrder.mockResolvedValue(mockOrder);

      const result = await confirmPaymentAndCompleteCart("cart-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order).toBe(mockOrder);
      }
    });

    it("places order directly without external payment session calls", async () => {
      mockGetCart.mockResolvedValue({
        ...mockOrder,
        current_step: "payment",
      });
      mockPlaceOrderFromCart.mockResolvedValue({
        order: mockDbOrder,
        items: [],
      });

      const result = await confirmPaymentAndCompleteCart("cart-1");

      expect(mockPlaceOrderFromCart).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("direct payment and retired session compatibility", () => {
    it("createDirectPayment returns success without network call", async () => {
      const result = await createDirectPayment("cart-1", "direct");
      expect(result).toEqual({
        success: true,
        payment: { id: "direct_payment" },
      });
    });

    it("createCheckoutPaymentSession returns safe direct session without external call", async () => {
      const result = await createCheckoutPaymentSession("cart-1", "pm-1");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session?.id).toBe("direct_payment_session");
      }
    });
  });
});
