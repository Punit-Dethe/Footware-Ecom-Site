import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCart,
  mockPlaceOrderFromCart,
  mockVerifyAuthSession,
  mockUpdateTag,
  mockCreateRazorpayOrder,
  mockFetchRazorpayPayment,
  mockVerifyRazorpayPaymentSignature,
  mockGetRazorpayConfig,
} = vi.hoisted(() => ({
  mockGetCart: vi.fn(),
  mockPlaceOrderFromCart: vi.fn(),
  mockVerifyAuthSession: vi.fn(),
  mockUpdateTag: vi.fn(),
  mockCreateRazorpayOrder: vi.fn(),
  mockFetchRazorpayPayment: vi.fn(),
  mockVerifyRazorpayPaymentSignature: vi.fn(),
  mockGetRazorpayConfig: vi.fn(),
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

vi.mock("@/lib/storefront", () => ({
  cacheTagSuffix: () => "",
  DEFAULT_SURFACE: "dtc",
  isWholesaleEnabled: vi.fn().mockReturnValue(false),
  getCartToken: vi.fn().mockResolvedValue("guest-bearer-token-raw-123"),
}));

vi.mock("next/cache", () => ({
  updateTag: mockUpdateTag,
}));

vi.mock("@/lib/payments/razorpay", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/payments/razorpay")>();
  return {
    ...actual,
    createRazorpayOrder: mockCreateRazorpayOrder,
    fetchRazorpayPayment: mockFetchRazorpayPayment,
    verifyRazorpayPaymentSignature: mockVerifyRazorpayPaymentSignature,
    getRazorpayConfig: mockGetRazorpayConfig,
  };
});

import {
  createRazorpayCheckoutOrder,
  verifyRazorpayPaymentAndCompleteOrder,
} from "@/lib/data/payment";
import {
  RazorpayApiError,
  RazorpayConfigError,
} from "@/lib/payments/razorpay";

const mockDbOrder = {
  id: "33333333-3333-3333-3333-333333333333",
  user_id: null,
  source_cart_id: "cart-1",
  order_number: "MRZ-TEST123456",
  status: "complete",
  currency: "INR",
  total_in_cents: 129900,
  item_total_in_cents: 129900,
  tax_total_in_cents: 0,
  shipping_total_in_cents: 0,
  discount_total_in_cents: 0,
  payment_provider: "razorpay",
  payment_status: "paid",
  payment_provider_order_id: "order_test_123",
  payment_provider_payment_id: "pay_test_456",
  payment_method: "upi",
  paid_at: new Date("2026-09-22T00:00:00Z"),
  shipping_address: null,
  billing_address: null,
  checkout_email: "customer@example.com",
  completed_at: new Date("2026-09-22T00:00:00Z"),
  created_at: new Date("2026-09-22T00:00:00Z"),
  updated_at: new Date("2026-09-22T00:00:00Z"),
};

const mockCart = {
  id: "cart-1",
  currency: "INR",
  total_amount: { amount_in_cents: 129900 },
  items: [
    {
      id: "item-1",
      quantity: 1,
      variant_id: "var-1",
      price: { amount_in_cents: 129900 },
    },
  ],
  email: "customer@example.com",
  shipping_address: {
    first_name: "Aarav",
    last_name: "Sharma",
    phone: "+919876543210",
  },
};

describe("payment server actions (Razorpay integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRazorpayConfig.mockReturnValue({
      keyId: "rzp_test_public_key",
      keySecret: "rzp_test_secret_key",
    });
  });

  describe("createRazorpayCheckoutOrder", () => {
    it("successfully creates a server-authoritative Razorpay order", async () => {
      mockGetCart.mockResolvedValue(mockCart);
      mockCreateRazorpayOrder.mockResolvedValue({
        id: "order_rzp_999",
        amount: 129900,
        currency: "INR",
      });

      const result = await createRazorpayCheckoutOrder("cart-1");

      expect(result).toEqual({
        success: true,
        razorpayOrderId: "order_rzp_999",
        amount: 129900,
        currency: "INR",
        keyId: "rzp_test_public_key",
        customer: {
          name: "Aarav Sharma",
          email: "customer@example.com",
          contact: "+919876543210",
        },
      });
      expect(mockCreateRazorpayOrder).toHaveBeenCalledWith(
        {
          amount: 129900,
          currency: "INR",
          receipt: "cart1",
          notes: {
            cart_id: "cart-1",
            surface: "dtc",
          },
        },
        {
          keyId: "rzp_test_public_key",
          keySecret: "rzp_test_secret_key",
        },
      );
    });

    it("rejects order creation if cart is not found or empty", async () => {
      mockGetCart.mockResolvedValue(null);

      const result = await createRazorpayCheckoutOrder("cart-1");
      expect(result).toEqual({
        success: false,
        error: "Cart not found or access denied",
      });

      mockGetCart.mockResolvedValue({ ...mockCart, items: [] });
      const emptyResult = await createRazorpayCheckoutOrder("cart-1");
      expect(emptyResult).toEqual({
        success: false,
        error: "Cannot create payment order for an empty cart",
      });
    });

    it("rejects order creation if cart total amount is zero or negative", async () => {
      mockGetCart.mockResolvedValue({
        ...mockCart,
        total_amount: { amount_in_cents: 0 },
      });

      const result = await createRazorpayCheckoutOrder("cart-1");
      expect(result).toEqual({
        success: false,
        error: "Cart total must be greater than zero",
      });
    });

    it("returns clean error if Razorpay credentials are missing", async () => {
      mockGetCart.mockResolvedValue(mockCart);
      mockGetRazorpayConfig.mockImplementation(() => {
        throw new RazorpayConfigError("Razorpay credentials are not configured.");
      });

      const result = await createRazorpayCheckoutOrder("cart-1");
      expect(result).toEqual({
        success: false,
        error: "Razorpay credentials are not configured.",
      });
    });

    it("returns clean error if Razorpay API fails", async () => {
      mockGetCart.mockResolvedValue(mockCart);
      mockCreateRazorpayOrder.mockRejectedValue(
        new RazorpayApiError("Bad request from Razorpay", 400, "BAD_REQUEST_ERROR"),
      );

      const result = await createRazorpayCheckoutOrder("cart-1");
      expect(result).toEqual({
        success: false,
        error: "Payment service error: Bad request from Razorpay",
      });
    });
  });

  describe("verifyRazorpayPaymentAndCompleteOrder", () => {
    it("completes checkout when signature and payment are valid", async () => {
      mockVerifyRazorpayPaymentSignature.mockReturnValue(true);
      mockFetchRazorpayPayment.mockResolvedValue({
        id: "pay_test_456",
        order_id: "order_test_123",
        amount: 129900,
        currency: "INR",
        status: "captured",
        method: "upi",
        created_at: 1774224000,
      });
      mockVerifyAuthSession.mockResolvedValue({
        status: "authenticated",
        userId: "auth-user-999",
      });
      mockPlaceOrderFromCart.mockResolvedValue({
        order: { ...mockDbOrder, user_id: "auth-user-999" },
        items: [],
      });

      const result = await verifyRazorpayPaymentAndCompleteOrder({
        cartId: "cart-1",
        razorpayOrderId: "order_test_123",
        razorpayPaymentId: "pay_test_456",
        razorpaySignature: "valid_signature_abc",
      });

      expect(mockVerifyRazorpayPaymentSignature).toHaveBeenCalledWith(
        {
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature_abc",
        },
        {
          keyId: "rzp_test_public_key",
          keySecret: "rzp_test_secret_key",
        },
      );

      expect(mockPlaceOrderFromCart).toHaveBeenCalledWith({
        cartId: "cart-1",
        surface: "dtc",
        verifiedUserId: "auth-user-999",
        guestTokenHash: null,
        payment: {
          provider: "razorpay",
          status: "paid",
          providerOrderId: "order_test_123",
          providerPaymentId: "pay_test_456",
          paymentMethod: "upi",
          paidAt: new Date(1774224000 * 1000),
          expectedAmountInCents: 129900,
          expectedCurrency: "INR",
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order.number).toBe("MRZ-TEST123456");
        expect(result.order.payment_status).toBe("paid");
      }
      expect(mockUpdateTag).toHaveBeenCalledWith("checkout");
      expect(mockUpdateTag).toHaveBeenCalledWith("cart");
    });

    it("verifies and places order for guest using SHA-256 hashed bearer token", async () => {
      mockVerifyRazorpayPaymentSignature.mockReturnValue(true);
      mockFetchRazorpayPayment.mockResolvedValue({
        id: "pay_test_456",
        order_id: "order_test_123",
        amount: 129900,
        currency: "INR",
        status: "captured",
        method: "card",
        created_at: 1774224000,
      });
      mockVerifyAuthSession.mockResolvedValue({ status: "anonymous" });
      mockPlaceOrderFromCart.mockResolvedValue({
        order: mockDbOrder,
        items: [],
      });

      const expectedHash = crypto
        .createHash("sha256")
        .update("guest-bearer-token-raw-123")
        .digest("hex");

      const result = await verifyRazorpayPaymentAndCompleteOrder({
        cartId: "cart-1",
        razorpayOrderId: "order_test_123",
        razorpayPaymentId: "pay_test_456",
        razorpaySignature: "valid_signature_abc",
      });

      expect(mockPlaceOrderFromCart).toHaveBeenCalledWith({
        cartId: "cart-1",
        surface: "dtc",
        verifiedUserId: null,
        guestTokenHash: expectedHash,
        payment: expect.objectContaining({
          provider: "razorpay",
          status: "paid",
          providerOrderId: "order_test_123",
          providerPaymentId: "pay_test_456",
        }),
      });
      expect(result.success).toBe(true);
    });

    it("rejects completion if payment signature is invalid", async () => {
      mockVerifyRazorpayPaymentSignature.mockReturnValue(false);

      const result = await verifyRazorpayPaymentAndCompleteOrder({
        cartId: "cart-1",
        razorpayOrderId: "order_test_123",
        razorpayPaymentId: "pay_test_456",
        razorpaySignature: "invalid_tampered_signature",
      });

      expect(result).toEqual({
        success: false,
        error: "Invalid payment signature verification",
      });
      expect(mockFetchRazorpayPayment).not.toHaveBeenCalled();
      expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
    });

    it("rejects completion if fetched payment order_id does not match", async () => {
      mockVerifyRazorpayPaymentSignature.mockReturnValue(true);
      mockFetchRazorpayPayment.mockResolvedValue({
        id: "pay_test_456",
        order_id: "different_order_999",
        amount: 129900,
        currency: "INR",
        status: "captured",
        method: "card",
        created_at: 1774224000,
      });

      const result = await verifyRazorpayPaymentAndCompleteOrder({
        cartId: "cart-1",
        razorpayOrderId: "order_test_123",
        razorpayPaymentId: "pay_test_456",
        razorpaySignature: "valid_signature_abc",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("does not match expected");
      }
      expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
    });

    it("rejects completion if fetched payment status is not captured", async () => {
      mockVerifyRazorpayPaymentSignature.mockReturnValue(true);
      mockFetchRazorpayPayment.mockResolvedValue({
        id: "pay_test_456",
        order_id: "order_test_123",
        amount: 129900,
        currency: "INR",
        status: "authorized", // Not captured yet
        method: "card",
        created_at: 1774224000,
      });

      const result = await verifyRazorpayPaymentAndCompleteOrder({
        cartId: "cart-1",
        razorpayOrderId: "order_test_123",
        razorpayPaymentId: "pay_test_456",
        razorpaySignature: "valid_signature_abc",
      });

      expect(result).toEqual({
        success: false,
        error: "Payment status is 'authorized', expected 'captured'",
      });
      expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
    });

    it("handles placeOrderFromCart rejection gracefully", async () => {
      mockVerifyRazorpayPaymentSignature.mockReturnValue(true);
      mockFetchRazorpayPayment.mockResolvedValue({
        id: "pay_test_456",
        order_id: "order_test_123",
        amount: 129900,
        currency: "INR",
        status: "captured",
        method: "card",
        created_at: 1774224000,
      });
      mockVerifyAuthSession.mockResolvedValue({ status: "anonymous" });
      mockPlaceOrderFromCart.mockRejectedValue(
        new Error("Payment amount mismatch: cart total is 150000, verified payment was 129900"),
      );

      const result = await verifyRazorpayPaymentAndCompleteOrder({
        cartId: "cart-1",
        razorpayOrderId: "order_test_123",
        razorpayPaymentId: "pay_test_456",
        razorpaySignature: "valid_signature_abc",
      });

      expect(result).toEqual({
        success: false,
        error: "Payment amount mismatch: cart total is 150000, verified payment was 129900",
      });
    });
  });
});
