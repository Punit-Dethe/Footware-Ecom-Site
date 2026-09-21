import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayConfig,
  RazorpayApiError,
  RazorpayConfigError,
  verifyRazorpayPaymentSignature,
} from "../razorpay";

describe("Razorpay Server Utility", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getRazorpayConfig", () => {
    it("throws RazorpayConfigError when credentials are not configured", () => {
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;

      expect(() => getRazorpayConfig()).toThrow(RazorpayConfigError);
      expect(() => getRazorpayConfig()).toThrow("Razorpay credentials are not configured.");
    });

    it("throws RazorpayConfigError when only Key ID is configured", () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_123456";
      delete process.env.RAZORPAY_KEY_SECRET;

      expect(() => getRazorpayConfig()).toThrow(RazorpayConfigError);
    });

    it("returns keyId and keySecret when both are present", () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_123456";
      process.env.RAZORPAY_KEY_SECRET = "secret_test_abcdef";

      const config = getRazorpayConfig();
      expect(config).toEqual({
        keyId: "rzp_test_123456",
        keySecret: "secret_test_abcdef",
      });
    });
  });

  describe("verifyRazorpayPaymentSignature", () => {
    const config = {
      keyId: "rzp_test_sample",
      keySecret: "my_super_secret_key",
    };
    const orderId = "order_DBJOWzybf0sJbb";
    const paymentId = "pay_29Ae39qD5w70Q6";

    it("returns true for a cryptographically valid HMAC-SHA256 signature", () => {
      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac("sha256", config.keySecret)
        .update(payload)
        .digest("hex");

      const isValid = verifyRazorpayPaymentSignature(
        {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
        },
        config,
      );

      expect(isValid).toBe(true);
    });

    it("returns false for a forged or tampered signature", () => {
      const isValid = verifyRazorpayPaymentSignature(
        {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: "invalid_signature_hex_value_1234567890abcdef",
        },
        config,
      );

      expect(isValid).toBe(false);
    });

    it("returns false if payment ID is altered", () => {
      const payload = `${orderId}|${paymentId}`;
      const signature = crypto
        .createHmac("sha256", config.keySecret)
        .update(payload)
        .digest("hex");

      const isValid = verifyRazorpayPaymentSignature(
        {
          razorpayOrderId: orderId,
          razorpayPaymentId: "pay_different",
          razorpaySignature: signature,
        },
        config,
      );

      expect(isValid).toBe(false);
    });

    it("returns false if signature signed with different secret", () => {
      const payload = `${orderId}|${paymentId}`;
      const wrongSignature = crypto
        .createHmac("sha256", "wrong_secret")
        .update(payload)
        .digest("hex");

      const isValid = verifyRazorpayPaymentSignature(
        {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: wrongSignature,
        },
        config,
      );

      expect(isValid).toBe(false);
    });

    it("returns false if any argument is empty", () => {
      expect(
        verifyRazorpayPaymentSignature(
          {
            razorpayOrderId: "",
            razorpayPaymentId: paymentId,
            razorpaySignature: "sig",
          },
          config,
        ),
      ).toBe(false);

      expect(
        verifyRazorpayPaymentSignature(
          {
            razorpayOrderId: orderId,
            razorpayPaymentId: "",
            razorpaySignature: "sig",
          },
          config,
        ),
      ).toBe(false);
    });
  });

  describe("createRazorpayOrder", () => {
    const config = {
      keyId: "rzp_test_sample",
      keySecret: "sample_secret",
    };

    it("sends proper Basic Auth header and partial_payment: false", async () => {
      const mockOrderRes = {
        id: "order_123",
        entity: "order",
        amount: 129900,
        amount_paid: 0,
        amount_due: 129900,
        currency: "INR",
        receipt: "rcpt_cart_1",
        status: "created",
        attempts: 0,
        notes: { mirza_cart_id: "cart-1" },
        created_at: 1726000000,
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => mockOrderRes,
      } as Response);

      const order = await createRazorpayOrder(
        {
          amount: 129900,
          currency: "inr",
          receipt: "rcpt_cart_1",
          notes: { mirza_cart_id: "cart-1" },
        },
        config,
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.razorpay.com/v1/orders",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from("rzp_test_sample:sample_secret").toString("base64")}`,
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            amount: 129900,
            currency: "INR",
            receipt: "rcpt_cart_1",
            partial_payment: false,
            notes: { mirza_cart_id: "cart-1" },
          }),
        }),
      );

      expect(order.id).toBe("order_123");
      expect(order.amount).toBe(129900);
      expect(order.currency).toBe("INR");
    });

    it("throws RazorpayApiError with description on failure", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "Currency USD is not enabled for your account",
          },
        }),
      } as Response);

      await expect(
        createRazorpayOrder(
          {
            amount: 5000,
            currency: "USD",
            receipt: "rcpt_cart_2",
          },
          config,
        ),
      ).rejects.toBeInstanceOf(RazorpayApiError);
    });
  });

  describe("fetchRazorpayOrder", () => {
    const config = {
      keyId: "rzp_test_sample",
      keySecret: "sample_secret",
    };

    it("fetches order details by order ID", async () => {
      const mockOrder = {
        id: "order_123",
        entity: "order",
        amount: 129900,
        currency: "INR",
        status: "created",
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const order = await fetchRazorpayOrder("order_123", config);

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.razorpay.com/v1/orders/order_123",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from("rzp_test_sample:sample_secret").toString("base64")}`,
          }),
        }),
      );

      expect(order.id).toBe("order_123");
    });
  });

  describe("fetchRazorpayPayment", () => {
    const config = {
      keyId: "rzp_test_sample",
      keySecret: "sample_secret",
    };

    it("fetches payment details by payment ID", async () => {
      const mockPayment = {
        id: "pay_123",
        entity: "payment",
        amount: 129900,
        currency: "INR",
        status: "captured",
        order_id: "order_123",
        method: "upi",
        created_at: 1726000000,
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => mockPayment,
      } as Response);

      const payment = await fetchRazorpayPayment("pay_123", config);

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.razorpay.com/v1/payments/pay_123",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from("rzp_test_sample:sample_secret").toString("base64")}`,
          }),
        }),
      );

      expect(payment.id).toBe("pay_123");
      expect(payment.status).toBe("captured");
    });
  });
});
