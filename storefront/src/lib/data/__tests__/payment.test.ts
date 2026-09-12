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

const mockClient = {
  carts: {
    get: vi.fn(),
    list: vi.fn(),
    complete: vi.fn(),
    paymentSessions: {
      create: vi.fn(),
      complete: vi.fn(),
    },
  },
};

vi.mock("@/lib/spree", () => ({
  getClient: () => mockClient,
  getClientForSurface: () => mockClient,
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
  completeCheckoutPaymentSession,
  confirmPaymentAndCompleteCart,
  createCheckoutPaymentSession,
} from "@/lib/data/payment";

const mockSession = {
  id: "session-1",
  status: "pending",
  external_data: { client_secret: "pi_secret_123" },
};

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
const mockDbItems: any[] = [];

const mockOrder = {
  id: "cart-1",
  number: "R100",
  current_step: "complete",
};

describe("payment server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCheckoutPaymentSession", () => {
    it("returns success with session", async () => {
      mockClient.carts.paymentSessions.create.mockResolvedValue(mockSession);

      const result = await createCheckoutPaymentSession("cart-1", "pm-1");

      expect(mockClient.carts.paymentSessions.create).toHaveBeenCalledWith(
        "cart-1",
        { payment_method_id: "pm-1" },
        { spreeToken: "order-token-123", token: undefined },
      );
      expect(result).toEqual({ success: true, session: mockSession });
    });

    it("passes external_data when provided", async () => {
      mockClient.carts.paymentSessions.create.mockResolvedValue(mockSession);

      await createCheckoutPaymentSession("cart-1", "pm-1", {
        stripe_payment_method_id: "spm_123",
      });

      expect(mockClient.carts.paymentSessions.create).toHaveBeenCalledWith(
        "cart-1",
        {
          payment_method_id: "pm-1",
          external_data: { stripe_payment_method_id: "spm_123" },
        },
        { spreeToken: "order-token-123", token: undefined },
      );
    });

    it("returns error on failure", async () => {
      mockClient.carts.paymentSessions.create.mockRejectedValue(
        new Error("Gateway unavailable"),
      );

      const result = await createCheckoutPaymentSession("cart-1", "pm-1");

      expect(result).toEqual({
        success: false,
        error: "Gateway unavailable",
      });
    });
  });

  describe("completeCheckoutPaymentSession", () => {
    it("returns success with session", async () => {
      const completedSession = { ...mockSession, status: "completed" };
      mockClient.carts.paymentSessions.complete.mockResolvedValue(
        completedSession,
      );

      const result = await completeCheckoutPaymentSession(
        "cart-1",
        "session-1",
      );

      expect(mockClient.carts.paymentSessions.complete).toHaveBeenCalledWith(
        "cart-1",
        "session-1",
        undefined,
        { spreeToken: "order-token-123", token: undefined },
      );
      expect(result).toEqual({ success: true, session: completedSession });
    });

    it("returns error on failure", async () => {
      mockClient.carts.paymentSessions.complete.mockRejectedValue(
        new Error("Session expired"),
      );

      const result = await completeCheckoutPaymentSession(
        "cart-1",
        "session-1",
      );

      expect(result).toEqual({ success: false, error: "Session expired" });
    });
  });

  describe("completeCheckoutOrder", () => {
    it("returns success with placed order", async () => {
      mockPlaceOrderFromCart.mockResolvedValue({
        order: mockDbOrder,
        items: mockDbItems,
      });

      const result = await completeCheckoutOrder("cart-1");

      expect(mockPlaceOrderFromCart).toHaveBeenCalledWith({
        cartId: "cart-1",
        surface: "dtc",
        verifiedUserId: null,
        guestTokenHash: expect.any(String),
      });
      expect(result.success).toBe(true);
      expect((result as any).order.number).toBe("MRZ-TEST123456");
    });

    it("returns error on failure", async () => {
      mockPlaceOrderFromCart.mockRejectedValue(
        new Error("Payment required"),
      );

      const result = await completeCheckoutOrder("cart-1");

      expect(result).toEqual({ success: false, error: "Payment required" });
    });

    it("returns fallback message for non-Error throws", async () => {
      mockPlaceOrderFromCart.mockRejectedValue("unexpected");

      const result = await completeCheckoutOrder("cart-1");

      expect(result).toEqual({
        success: false,
        error: "Failed to complete order",
      });
    });
  });

  describe("confirmPaymentAndCompleteCart", () => {
    it("passes cartId to getCart for explicit lookup", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "complete",
      });

      await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(mockGetCart).toHaveBeenCalledWith("cart-1", "dtc");
    });

    it("succeeds when cart is already complete", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "complete",
      });

      const result = await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(result).toEqual({
        success: true,
        order: { id: "cart-1", current_step: "complete" },
      });
      expect(mockClient.carts.paymentSessions.complete).not.toHaveBeenCalled();
      expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
    });

    it("completes payment session then completes the order", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "payment",
      });
      mockClient.carts.paymentSessions.complete.mockResolvedValue({
        id: "session-1",
        status: "completed",
      });
      mockPlaceOrderFromCart.mockResolvedValue({
        order: mockDbOrder,
        items: mockDbItems,
      });

      const result = await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(mockClient.carts.paymentSessions.complete).toHaveBeenCalled();
      expect(mockPlaceOrderFromCart).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("returns error when payment session fails", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "payment",
      });
      mockClient.carts.paymentSessions.complete.mockResolvedValue({
        id: "session-1",
        status: "failed",
      });

      const result = await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(result).toEqual({
        success: false,
        error: "Payment was not successful. Please try again.",
      });
      expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
    });

    it("skips session completion when no session ID provided", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "payment",
      });
      mockPlaceOrderFromCart.mockResolvedValue({
        order: mockDbOrder,
        items: mockDbItems,
      });

      const result = await confirmPaymentAndCompleteCart("cart-1");

      expect(mockClient.carts.paymentSessions.complete).not.toHaveBeenCalled();
      expect(mockPlaceOrderFromCart).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("returns success when cart is not found and authorized completed order exists", async () => {
      mockGetCart.mockResolvedValue(null);
      mockGetCompletedOrder.mockResolvedValue(mockOrder);

      const result = await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, order: mockOrder });
    });

    it("returns failure when missing cart and completed order is absent or unauthorized", async () => {
      mockGetCart.mockResolvedValue(null);
      mockGetCompletedOrder.mockResolvedValue(null);

      const result = await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(result).toEqual({
        success: false,
        error: "Order not found or unauthorized.",
      });
      expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
    });

    it("propagates failure when completed-order lookup suffers an outage", async () => {
      mockGetCart.mockResolvedValue(null);
      mockGetCompletedOrder.mockRejectedValue(new Error("Database connection failure"));

      const result = await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(result).toEqual({
        success: false,
        error: "Database connection failure",
      });
      expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
    });

    it("returns error when complete throws error", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "payment",
      });
      mockPlaceOrderFromCart.mockRejectedValue(
        new Error("Order cannot be completed"),
      );

      const result = await confirmPaymentAndCompleteCart("cart-1");

      expect(result).toEqual({
        success: false,
        error: "Order cannot be completed",
      });
    });

    it("returns error when getCart throws an unexpected database error", async () => {
      mockGetCart.mockRejectedValue(new Error("Database connection error"));

      const result = await confirmPaymentAndCompleteCart("cart-1");

      expect(result).toEqual({
        success: false,
        error: "Database connection error",
      });
    });
  });
});
