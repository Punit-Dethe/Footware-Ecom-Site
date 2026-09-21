import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaymentSection } from "../PaymentSection";
import type { Cart } from "@/types/commerce";

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
} as unknown as Cart;

describe("PaymentSection component", () => {
  it("renders Razorpay Standard Checkout card with Test Mode badge and accepted methods", () => {
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

    expect(screen.getByText("Razorpay Standard Checkout")).toBeDefined();
    expect(screen.getByText("Test Mode")).toBeDefined();
    expect(
      screen.getByText(/Cards \(Visa, Mastercard, RuPay, Amex\), UPI/i),
    ).toBeDefined();
    expect(screen.queryByText("Direct Order Placement")).toBeNull();
  });

  it("renders billing address same as shipping option", () => {
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

    expect(
      screen.getByText("Billing address same as shipping address"),
    ).toBeDefined();
  });
});
