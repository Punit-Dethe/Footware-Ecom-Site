import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCart,
  mockPlaceOrderFromCart,
  mockVerifyAuthSession,
  mockUpdateTag,
  mockCreateRazorpayOrder,
  mockFetchRazorpayOrder,
  mockFetchRazorpayPayment,
  mockVerifyRazorpayPaymentSignature,
  mockGetRazorpayConfig,
  mockCreatePaymentAttempt,
  mockFindPaymentAttempt,
  mockMarkPaymentAttemptConsumed,
  mockScheduleOrderConfirmationEmail,
} = vi.hoisted(() => ({
  mockGetCart: vi.fn(),
  mockPlaceOrderFromCart: vi.fn(),
  mockVerifyAuthSession: vi.fn(),
  mockUpdateTag: vi.fn(),
  mockCreateRazorpayOrder: vi.fn(),
  mockFetchRazorpayOrder: vi.fn(),
  mockFetchRazorpayPayment: vi.fn(),
  mockVerifyRazorpayPaymentSignature: vi.fn(),
  mockGetRazorpayConfig: vi.fn(),
  mockCreatePaymentAttempt: vi.fn(),
  mockFindPaymentAttempt: vi.fn(),
  mockMarkPaymentAttemptConsumed: vi.fn(),
  mockScheduleOrderConfirmationEmail: vi.fn(),
}));

vi.mock("@/lib/data/cart", () => ({
  getCart: mockGetCart,
  verifyAuthSession: mockVerifyAuthSession,
}));

vi.mock("@/lib/db/order", () => ({
  placeOrderFromCart: mockPlaceOrderFromCart,
}));

vi.mock("@/lib/db/payment-attempt", () => ({
  createPaymentAttempt: mockCreatePaymentAttempt,
  findPaymentAttempt: mockFindPaymentAttempt,
  markPaymentAttemptConsumed: mockMarkPaymentAttemptConsumed,
}));

vi.mock("@/lib/emails/order-confirmation-flow", () => ({
  scheduleOrderConfirmationEmail: mockScheduleOrderConfirmationEmail,
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
    fetchRazorpayOrder: mockFetchRazorpayOrder,
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

const defaultPaymentAttempt = {
  id: "attempt-1",
  cart_id: "cart-1",
  surface: "dtc",
  provider: "razorpay",
  provider_order_id: "order_test_123",
  provider_payment_id: null,
  amount_in_cents: 129900,
  currency: "INR",
  status: "created" as const,
  created_at: new Date(),
  updated_at: new Date(),
  consumed_at: null,
};

const defaultRazorpayOrder = {
  id: "order_test_123",
  entity: "order",
  amount: 129900,
  amount_paid: 129900,
  amount_due: 0,
  currency: "INR",
  receipt: "cart1",
  status: "paid",
  attempts: 1,
  notes: {
    cart_id: "cart-1",
    surface: "dtc",
  },
  created_at: 1774224000,
};

const defaultRazorpayPayment = {
  id: "pay_test_456",
  entity: "payment",
  amount: 129900,
  currency: "INR",
  status: "captured" as const,
  order_id: "order_test_123",
  method: "upi",
  created_at: 1774224000,
};

const GENERIC_ERROR = "We could not verify this payment. Please try again or contact support.";

describe("payment server actions (Razorpay integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRazorpayConfig.mockReturnValue({
      keyId: "rzp_test_public_key",
      keySecret: "rzp_test_secret_key",
    });
    mockGetCart.mockResolvedValue(mockCart);
    mockFindPaymentAttempt.mockResolvedValue(defaultPaymentAttempt);
    mockFetchRazorpayOrder.mockResolvedValue(defaultRazorpayOrder);
    mockFetchRazorpayPayment.mockResolvedValue(defaultRazorpayPayment);
    mockVerifyRazorpayPaymentSignature.mockReturnValue(true);
    mockPlaceOrderFromCart.mockResolvedValue({
      order: mockDbOrder,
      items: [],
      created: true,
    });
    mockMarkPaymentAttemptConsumed.mockResolvedValue({
      ...defaultPaymentAttempt,
      status: "consumed",
      provider_payment_id: "pay_test_456",
      consumed_at: new Date(),
    });
  });

  describe("createRazorpayCheckoutOrder", () => {
    it("successfully creates a server-authoritative Razorpay order and persists payment_attempt", async () => {
      mockCreateRazorpayOrder.mockResolvedValue({
        id: "order_rzp_999",
        amount: 129900,
        currency: "INR",
      });
      mockCreatePaymentAttempt.mockResolvedValue({
        ...defaultPaymentAttempt,
        provider_order_id: "order_rzp_999",
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

      expect(mockCreatePaymentAttempt).toHaveBeenCalledWith({
        cartId: "cart-1",
        surface: "dtc",
        provider: "razorpay",
        providerOrderId: "order_rzp_999",
        amountInCents: 129900,
        currency: "INR",
      });
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
      mockVerifyAuthSession.mockResolvedValue({
        status: "authenticated",
        userId: "auth-user-999",
      });
      mockPlaceOrderFromCart.mockResolvedValue({
        order: { ...mockDbOrder, user_id: "auth-user-999" },
        items: [],
        created: true,
      });

      const result = await verifyRazorpayPaymentAndCompleteOrder({
        cartId: "cart-1",
        razorpayOrderId: "order_test_123",
        razorpayPaymentId: "pay_test_456",
        razorpaySignature: "valid_signature_abc",
      });

      // Assert lookup of payment attempt by providerOrderId, cartId, surface
      expect(mockFindPaymentAttempt).toHaveBeenCalledWith({
        providerOrderId: "order_test_123",
        cartId: "cart-1",
        surface: "dtc",
      });

      // Assert HMAC verification uses SERVER-STORED provider_order_id
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

      // Assert Razorpay Order and Payment were fetched and verified
      expect(mockFetchRazorpayOrder).toHaveBeenCalledWith(
        "order_test_123",
        expect.objectContaining({ keyId: "rzp_test_public_key" }),
      );
      expect(mockFetchRazorpayPayment).toHaveBeenCalledWith(
        "pay_test_456",
        expect.objectContaining({ keyId: "rzp_test_public_key" }),
      );

      // Assert placeOrderFromCart called with trusted parameters
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

      // Assert payment attempt consumed
      expect(mockMarkPaymentAttemptConsumed).toHaveBeenCalledWith({
        attemptId: "attempt-1",
        providerPaymentId: "pay_test_456",
      });

      // Assert order confirmation email scheduled
      expect(mockScheduleOrderConfirmationEmail).toHaveBeenCalledWith({
        order: expect.objectContaining({ id: "33333333-3333-3333-3333-333333333333" }),
        items: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order.number).toBe("MRZ-TEST123456");
        expect(result.order.payment_status).toBe("paid");
      }
      expect(mockUpdateTag).toHaveBeenCalledWith("checkout");
      expect(mockUpdateTag).toHaveBeenCalledWith("cart");
    });

    describe("Cross-cart replay defense", () => {
      it("rejects verification when attempt belongs to Cart A but verification requests Cart B", async () => {
        // Both Cart A and Cart B are valid authorized carts with same amount and currency
        mockGetCart.mockResolvedValue({
          ...mockCart,
          id: "cart-B",
        });
        // DB lookup WHERE provider_order_id = 'order_test_cart_A' AND cart_id = 'cart-B' yields null (attempt belongs to cart-A)
        mockFindPaymentAttempt.mockResolvedValue(null);

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-B",
          razorpayOrderId: "order_test_cart_A",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature_for_cart_A",
        });

        expect(mockFindPaymentAttempt).toHaveBeenCalledWith({
          providerOrderId: "order_test_cart_A",
          cartId: "cart-B",
          surface: "dtc",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockVerifyRazorpayPaymentSignature).not.toHaveBeenCalled();
        expect(mockFetchRazorpayOrder).not.toHaveBeenCalled();
        expect(mockFetchRazorpayPayment).not.toHaveBeenCalled();
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });
    });

    describe("Trusted order ID enforcement", () => {
      it("uses server-stored order ID for HMAC verification, ignoring tampered client callback order ID", async () => {
        mockFindPaymentAttempt.mockResolvedValue({
          ...defaultPaymentAttempt,
          provider_order_id: "order_server_trusted_456",
        });
        mockFetchRazorpayOrder.mockResolvedValue({
          ...defaultRazorpayOrder,
          id: "order_server_trusted_456",
        });
        mockFetchRazorpayPayment.mockResolvedValue({
          ...defaultRazorpayPayment,
          order_id: "order_server_trusted_456",
        });
        mockVerifyAuthSession.mockResolvedValue({ status: "anonymous" });

        await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_server_trusted_456",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_sig",
        });

        // HMAC verification MUST be called with the server-stored ID
        expect(mockVerifyRazorpayPaymentSignature).toHaveBeenCalledWith(
          expect.objectContaining({
            razorpayOrderId: "order_server_trusted_456",
            razorpayPaymentId: "pay_test_456",
          }),
          expect.any(Object),
        );
      });
    });

    describe("Provider Order verification", () => {
      it("rejects when Razorpay order notes.cart_id does not match", async () => {
        mockFetchRazorpayOrder.mockResolvedValue({
          ...defaultRazorpayOrder,
          notes: { cart_id: "different-cart", surface: "dtc" },
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });

      it("rejects when Razorpay order notes.surface does not match", async () => {
        mockFetchRazorpayOrder.mockResolvedValue({
          ...defaultRazorpayOrder,
          notes: { cart_id: "cart-1", surface: "wholesale" },
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });

      it("rejects when Razorpay order amount does not match attempt", async () => {
        mockFetchRazorpayOrder.mockResolvedValue({
          ...defaultRazorpayOrder,
          amount: 99999, // Mismatch with attempt 129900
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });

      it("rejects when Razorpay order currency does not match attempt", async () => {
        mockFetchRazorpayOrder.mockResolvedValue({
          ...defaultRazorpayOrder,
          currency: "USD", // Mismatch with attempt INR
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });

      it("rejects when current Mirza cart amount mismatches attempt", async () => {
        mockGetCart.mockResolvedValue({
          ...mockCart,
          total_amount: { amount_in_cents: 150000 }, // Changed while paying
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });
    });

    describe("Provider Payment verification", () => {
      it("rejects when payment order_id does not match trustedOrderId", async () => {
        mockFetchRazorpayPayment.mockResolvedValue({
          ...defaultRazorpayPayment,
          order_id: "order_wrong_mismatch",
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });

      it("rejects when payment amount does not match attempt amount", async () => {
        mockFetchRazorpayPayment.mockResolvedValue({
          ...defaultRazorpayPayment,
          amount: 50000,
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });

      it("rejects when payment currency does not match attempt currency", async () => {
        mockFetchRazorpayPayment.mockResolvedValue({
          ...defaultRazorpayPayment,
          currency: "EUR",
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });

      it("rejects when payment status is not captured", async () => {
        mockFetchRazorpayPayment.mockResolvedValue({
          ...defaultRazorpayPayment,
          status: "authorized",
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });
    });

    describe("Idempotency and Confirmation Email Deduplication", () => {
      it("schedules confirmation email on initial verification (created: true)", async () => {
        mockVerifyAuthSession.mockResolvedValue({ status: "anonymous" });
        mockPlaceOrderFromCart.mockResolvedValue({
          order: mockDbOrder,
          items: [],
          created: true,
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result.success).toBe(true);
        expect(mockScheduleOrderConfirmationEmail).toHaveBeenCalledTimes(1);
      });

      it("returns same order and does NOT send another email on idempotent retry (created: false)", async () => {
        mockVerifyAuthSession.mockResolvedValue({ status: "anonymous" });
        mockPlaceOrderFromCart.mockResolvedValue({
          order: mockDbOrder,
          items: [],
          created: false,
        });

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order.number).toBe("MRZ-TEST123456");
        }
        // Deduplicated: NO second email scheduled!
        expect(mockScheduleOrderConfirmationEmail).not.toHaveBeenCalled();
      });
    });

    describe("Guest checkout authentication", () => {
      it("verifies and places order for guest using SHA-256 hashed bearer token", async () => {
        mockVerifyAuthSession.mockResolvedValue({ status: "anonymous" });
        mockPlaceOrderFromCart.mockResolvedValue({
          order: mockDbOrder,
          items: [],
          created: true,
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
    });

    describe("Error hygiene", () => {
      it("returns generic error when signature is invalid, without leaking secrets", async () => {
        mockVerifyRazorpayPaymentSignature.mockReturnValue(false);

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "invalid_sig",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
        expect(mockFetchRazorpayOrder).not.toHaveBeenCalled();
        expect(mockPlaceOrderFromCart).not.toHaveBeenCalled();
      });

      it("returns generic error when placeOrderFromCart throws, without leaking database internals", async () => {
        mockVerifyAuthSession.mockResolvedValue({ status: "anonymous" });
        mockPlaceOrderFromCart.mockRejectedValue(
          new Error("psql: unique constraint violation on public.orders (source_cart_id)"),
        );

        const result = await verifyRazorpayPaymentAndCompleteOrder({
          cartId: "cart-1",
          razorpayOrderId: "order_test_123",
          razorpayPaymentId: "pay_test_456",
          razorpaySignature: "valid_signature",
        });

        expect(result).toEqual({
          success: false,
          error: GENERIC_ERROR,
        });
      });
    });
  });
});
