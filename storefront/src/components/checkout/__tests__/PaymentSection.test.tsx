import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentSection, type PaymentSectionHandle } from "../PaymentSection";
import type { Cart } from "@/types/commerce";
import {
  createRazorpayCheckoutOrder,
  verifyRazorpayPaymentAndCompleteOrder,
} from "@/lib/data/payment";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      paymentMethod: "Payment Method",
      secureTransactions: "All transactions are secure and encrypted",
      sameAsShipping: "Billing address same as shipping address",
      failedToSaveBilling: "Failed to save billing address",
      paymentError: "An error occurred during payment processing",
    };
    return translations[key] || key;
  },
}));

vi.mock("@/lib/data/payment", () => ({
  createRazorpayCheckoutOrder: vi.fn(),
  verifyRazorpayPaymentAndCompleteOrder: vi.fn(),
}));

const mockCreateRazorpayCheckoutOrder = vi.mocked(createRazorpayCheckoutOrder);
const mockVerifyRazorpayPaymentAndCompleteOrder = vi.mocked(
  verifyRazorpayPaymentAndCompleteOrder,
);

const mockCart: Cart = {
  id: "cart-test-1",
  number: "R-MRZ-1234",
  token: "cart_token_123",
  currency: "INR",
  item_count: 1,
  total_quantity: 1,
  total: "₹1,299.00",
  display_total: "₹1,299.00",
  total_amount: { amount_in_cents: 129900, display_amount: "₹1,299.00" },
  items: [],
  billing_address: {
    first_name: "Aarav",
    last_name: "Sharma",
    address1: "123 MG Road",
    city: "Bengaluru",
    country_iso: "IN",
    postal_code: "560001",
  },
} as unknown as Cart;

let lastOptions: any = null;
let lastInstance: any = null;

class MockRazorpay {
  open = vi.fn();
  handlers = new Map<string, (res: any) => void>();
  options: any;

  constructor(options: any) {
    this.options = options;
    lastOptions = options;
    lastInstance = this;
  }

  on(event: string, handler: (res: any) => void) {
    this.handlers.set(event, handler);
  }
}

describe("PaymentSection component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastOptions = null;
    lastInstance = null;
    // Remove any leftover checkout scripts
    document.querySelectorAll("script").forEach((s) => {
      s.remove();
    });
    // Attach default mock Razorpay to window
    (window as any).Razorpay = MockRazorpay;

    mockCreateRazorpayCheckoutOrder.mockResolvedValue({
      success: true,
      razorpayOrderId: "order_rzp_123",
      amount: 129900,
      currency: "INR",
      keyId: "rzp_test_key_id",
      customer: {
        name: "Aarav Sharma",
        email: "customer@example.com",
        contact: "+919876543210",
      },
    });
  });

  afterEach(() => {
    delete (window as any).Razorpay;
    vi.restoreAllMocks();
  });

  it("renders Razorpay Standard Checkout card with Test Mode badge and accepted methods", async () => {
    await act(async () => {
      render(
        <PaymentSection
          cart={mockCart}
          countries={[]}
          isAuthenticated={false}
          fetchStates={vi.fn().mockResolvedValue([])}
          onUpdateBillingAddress={vi.fn().mockResolvedValue(true)}
          onPaymentComplete={vi.fn().mockResolvedValue(undefined)}
          processing={false}
          setProcessing={vi.fn()}
        />,
      );
    });

    expect(screen.getByText("Razorpay Standard Checkout")).toBeDefined();
    expect(screen.getByText("Test Mode")).toBeDefined();
    expect(
      screen.getByText(/Cards \(Visa, Mastercard, RuPay, Amex\), UPI/i),
    ).toBeDefined();
    expect(screen.queryByText("Direct Order Placement")).toBeNull();
  });

  it("renders billing address same as shipping option", async () => {
    await act(async () => {
      render(
        <PaymentSection
          cart={mockCart}
          countries={[]}
          isAuthenticated={false}
          fetchStates={vi.fn().mockResolvedValue([])}
          onUpdateBillingAddress={vi.fn().mockResolvedValue(true)}
          onPaymentComplete={vi.fn().mockResolvedValue(undefined)}
          processing={false}
          setProcessing={vi.fn()}
        />,
      );
    });

    expect(
      screen.getByText("Billing address same as shipping address"),
    ).toBeDefined();
  });

  describe("Client Checkout behavior & lifecycle", () => {
    it("handles Checkout.js load failure: releases processing and does not verify", async () => {
      delete (window as any).Razorpay;

      // Intercept script injection and trigger onerror
      vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
        if (
          node instanceof HTMLScriptElement &&
          node.src.includes("checkout.razorpay.com")
        ) {
          setTimeout(() => {
            node.onerror?.(new Event("error") as any);
          }, 0);
        }
        return node;
      });

      const setProcessing = vi.fn();
      const onError = vi.fn();
      const onPaymentComplete = vi.fn();
      const ref = React.createRef<PaymentSectionHandle>();

      render(
        <PaymentSection
          ref={ref}
          cart={mockCart}
          countries={[]}
          isAuthenticated={false}
          fetchStates={vi.fn().mockResolvedValue([])}
          onUpdateBillingAddress={vi.fn().mockResolvedValue(true)}
          onPaymentComplete={onPaymentComplete}
          processing={false}
          setProcessing={setProcessing}
          onError={onError}
        />,
      );

      await act(async () => {
        const res = await ref.current?.submit();
        expect(res?.error).toContain("Failed to load payment gateway");
      });

      // Processing released
      expect(setProcessing).toHaveBeenCalledWith(true);
      expect(setProcessing).toHaveBeenCalledWith(false);
      expect(onError).toHaveBeenCalledWith(
        "Failed to load payment gateway. Please check your internet connection.",
      );
      expect(mockVerifyRazorpayPaymentAndCompleteOrder).not.toHaveBeenCalled();
      expect(onPaymentComplete).not.toHaveBeenCalled();
    });

    it("handles popup dismissal: releases processing without creating a local order", async () => {
      const setProcessing = vi.fn();
      const onPaymentComplete = vi.fn();
      const ref = React.createRef<PaymentSectionHandle>();

      render(
        <PaymentSection
          ref={ref}
          cart={mockCart}
          countries={[]}
          isAuthenticated={false}
          fetchStates={vi.fn().mockResolvedValue([])}
          onUpdateBillingAddress={vi.fn().mockResolvedValue(true)}
          onPaymentComplete={onPaymentComplete}
          processing={false}
          setProcessing={setProcessing}
        />,
      );

      await act(async () => {
        await ref.current?.submit();
      });

      expect(lastInstance.open).toHaveBeenCalled();

      // Trigger modal dismissal callback
      act(() => {
        lastOptions.modal.ondismiss();
      });

      // Processing released
      expect(setProcessing).toHaveBeenLastCalledWith(false);
      expect(mockVerifyRazorpayPaymentAndCompleteOrder).not.toHaveBeenCalled();
      expect(onPaymentComplete).not.toHaveBeenCalled();
    });

    it("handles payment.failed: releases processing and reports useful error", async () => {
      const setProcessing = vi.fn();
      const onError = vi.fn();
      const onPaymentComplete = vi.fn();
      const ref = React.createRef<PaymentSectionHandle>();

      render(
        <PaymentSection
          ref={ref}
          cart={mockCart}
          countries={[]}
          isAuthenticated={false}
          fetchStates={vi.fn().mockResolvedValue([])}
          onUpdateBillingAddress={vi.fn().mockResolvedValue(true)}
          onPaymentComplete={onPaymentComplete}
          processing={false}
          setProcessing={setProcessing}
          onError={onError}
        />,
      );

      await act(async () => {
        await ref.current?.submit();
      });

      const failedHandler = lastInstance.handlers.get("payment.failed");
      expect(failedHandler).toBeDefined();

      act(() => {
        failedHandler({
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "Card was declined by issuing bank",
          },
        });
      });

      expect(setProcessing).toHaveBeenLastCalledWith(false);
      expect(onError).toHaveBeenCalledWith("Card was declined by issuing bank");
      expect(onPaymentComplete).not.toHaveBeenCalled();
    });

    it("success handler: passes proof to server verification and calls onPaymentComplete on success", async () => {
      mockVerifyRazorpayPaymentAndCompleteOrder.mockResolvedValue({
        success: true,
        order: { id: "order_placed_123", number: "MRZ-12345" } as any,
      });

      const setProcessing = vi.fn();
      const onPaymentComplete = vi.fn();
      const ref = React.createRef<PaymentSectionHandle>();

      render(
        <PaymentSection
          ref={ref}
          cart={mockCart}
          countries={[]}
          isAuthenticated={false}
          fetchStates={vi.fn().mockResolvedValue([])}
          onUpdateBillingAddress={vi.fn().mockResolvedValue(true)}
          onPaymentComplete={onPaymentComplete}
          processing={false}
          setProcessing={setProcessing}
        />,
      );

      await act(async () => {
        await ref.current?.submit();
      });

      expect(lastOptions.handler).toBeDefined();

      await act(async () => {
        await lastOptions.handler({
          razorpay_order_id: "order_rzp_123",
          razorpay_payment_id: "pay_rzp_456",
          razorpay_signature: "valid_sig_xyz",
        });
      });

      expect(mockVerifyRazorpayPaymentAndCompleteOrder).toHaveBeenCalledWith({
        cartId: "cart-test-1",
        razorpayOrderId: "order_rzp_123",
        razorpayPaymentId: "pay_rzp_456",
        razorpaySignature: "valid_sig_xyz",
      });

      expect(onPaymentComplete).toHaveBeenCalledWith(
        expect.objectContaining({ id: "order_placed_123" }),
      );
    });

    it("server verification failure: does not call onPaymentComplete and releases processing", async () => {
      mockVerifyRazorpayPaymentAndCompleteOrder.mockResolvedValue({
        success: false,
        error: "We could not verify this payment. Please try again or contact support.",
      });

      const setProcessing = vi.fn();
      const onError = vi.fn();
      const onPaymentComplete = vi.fn();
      const ref = React.createRef<PaymentSectionHandle>();

      render(
        <PaymentSection
          ref={ref}
          cart={mockCart}
          countries={[]}
          isAuthenticated={false}
          fetchStates={vi.fn().mockResolvedValue([])}
          onUpdateBillingAddress={vi.fn().mockResolvedValue(true)}
          onPaymentComplete={onPaymentComplete}
          processing={false}
          setProcessing={setProcessing}
          onError={onError}
        />,
      );

      await act(async () => {
        await ref.current?.submit();
      });

      await act(async () => {
        await lastOptions.handler({
          razorpay_order_id: "order_rzp_123",
          razorpay_payment_id: "pay_rzp_456",
          razorpay_signature: "invalid_sig_abc",
        });
      });

      expect(onPaymentComplete).not.toHaveBeenCalled();
      expect(setProcessing).toHaveBeenLastCalledWith(false);
      expect(onError).toHaveBeenCalledWith(
        "We could not verify this payment. Please try again or contact support.",
      );
    });
  });
});
