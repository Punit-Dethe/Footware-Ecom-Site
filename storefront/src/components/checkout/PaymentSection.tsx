"use client";

import { CreditCard, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { AddressFormFields } from "@/components/checkout/AddressFormFields";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type AddressFormData,
  addressToFormData,
  formDataToAddress,
  updateAddressField,
} from "@/lib/utils/address";
import type { AddressParams, Cart, Country, Order, State } from "@/types/commerce";
import {
  createRazorpayCheckoutOrder,
  verifyRazorpayPaymentAndCompleteOrder,
} from "@/lib/data/payment";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    backdropclose?: boolean;
    escape?: boolean;
  };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: {
      error: {
        code?: string;
        description?: string;
        source?: string;
        step?: string;
        reason?: string;
      };
    }) => void,
  ) => void;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface PaymentSectionHandle {
  submit: () => Promise<{ error?: string }>;
}

interface PaymentSectionProps {
  ref?: Ref<PaymentSectionHandle>;
  cart: Cart;
  countries: Country[];
  isAuthenticated: boolean;
  fetchStates: (countryIso: string) => Promise<State[]>;
  onUpdateBillingAddress: (data: {
    billing_address?: AddressParams;
    use_shipping?: boolean;
  }) => Promise<boolean>;
  onPaymentComplete: (order?: Order) => Promise<void>;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  errors?: string[];
  onError?: (error: string | null) => void;
}

export function PaymentSection({
  ref,
  cart,
  countries,
  fetchStates,
  onUpdateBillingAddress,
  onPaymentComplete,
  processing: _processing,
  setProcessing,
  errors,
  onError,
}: PaymentSectionProps) {
  const t = useTranslations("checkout");

  // Billing address state
  const [useShippingForBilling, setUseShippingForBilling] = useState(true);
  const [billAddress, setBillAddress] = useState<AddressFormData>(() =>
    addressToFormData(cart.billing_address),
  );
  const [billStates, setBillStates] = useState<State[]>([]);
  const [isPendingBill, setIsPendingBill] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const reportError = useCallback(
    (err: string | null) => {
      setLocalError(err);
      onError?.(err);
    },
    [onError],
  );

  // Fetch states when billing country changes
  useEffect(() => {
    if (!billAddress.country_iso) return;
    let cancelled = false;
    setIsPendingBill(true);

    fetchStates(billAddress.country_iso)
      .then((states) => {
        if (!cancelled) setBillStates(states);
      })
      .catch(() => {
        if (!cancelled) setBillStates([]);
      })
      .finally(() => {
        if (!cancelled) setIsPendingBill(false);
      });

    return () => {
      cancelled = true;
    };
  }, [billAddress.country_iso, fetchStates]);

  const updateBillAddress = useCallback(
    (field: keyof AddressFormData, value: string) => {
      setBillAddress((prev) => updateAddressField(prev, field, value));
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      submit: async () => {
        setProcessing(true);
        reportError(null);
        try {
          if (!useShippingForBilling) {
            // Validate required billing fields
            if (
              !billAddress.first_name.trim() ||
              !billAddress.last_name.trim() ||
              !billAddress.address1.trim() ||
              !billAddress.city.trim() ||
              !billAddress.country_iso.trim() ||
              !billAddress.postal_code.trim()
            ) {
              setProcessing(false);
              const err = t("failedToSaveBilling");
              reportError(err);
              return { error: err };
            }

            const saved = await onUpdateBillingAddress({
              billing_address: formDataToAddress(billAddress),
              use_shipping: false,
            });

            if (!saved) {
              setProcessing(false);
              const err = t("failedToSaveBilling");
              reportError(err);
              return { error: err };
            }
          }

          // 1. Initialize server-authoritative Razorpay Order
          const orderInit = await createRazorpayCheckoutOrder(cart.id);
          if (!orderInit.success) {
            setProcessing(false);
            reportError(orderInit.error);
            return { error: orderInit.error };
          }

          // 2. Lazily load checkout.js on demand
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded || !window.Razorpay) {
            setProcessing(false);
            const err =
              "Failed to load payment gateway. Please check your internet connection.";
            reportError(err);
            return { error: err };
          }

          // 3. Open Razorpay Standard Checkout overlay modal
          const rzp = new window.Razorpay({
            key: orderInit.keyId,
            amount: orderInit.amount,
            currency: orderInit.currency,
            name: "Mirza",
            description: "Luxury Footwear Order",
            order_id: orderInit.razorpayOrderId,
            prefill: {
              name: orderInit.customer.name,
              email: orderInit.customer.email,
              contact: orderInit.customer.contact,
            },
            theme: {
              color: "#18181b",
            },
            modal: {
              ondismiss: () => {
                setProcessing(false);
              },
            },
            handler: async (response) => {
              setProcessing(true);
              try {
                const verified =
                  await verifyRazorpayPaymentAndCompleteOrder({
                    cartId: cart.id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  });

                if (!verified.success) {
                  reportError(verified.error);
                  setProcessing(false);
                  return;
                }

                await onPaymentComplete(verified.order);
              } catch (err: unknown) {
                reportError(
                  err instanceof Error ? err.message : t("paymentError"),
                );
                setProcessing(false);
              }
            },
          });

          rzp.on("payment.failed", (res) => {
            reportError(
              res.error.description ||
                "Payment was declined or failed. Please try another payment method.",
            );
            setProcessing(false);
          });

          rzp.open();
          return {};
        } catch (err: unknown) {
          setProcessing(false);
          const errMessage =
            err instanceof Error ? err.message : t("paymentError");
          reportError(errMessage);
          return { error: errMessage };
        }
      },
    }),
    [
      billAddress,
      cart.id,
      onPaymentComplete,
      onUpdateBillingAddress,
      reportError,
      setProcessing,
      t,
      useShippingForBilling,
    ],
  );

  const displayedErrors = [
    ...(errors ?? []),
    ...(localError ? [localError] : []),
  ];

  return (
    <section className="checkout-payment">
      <div className="checkout-section-heading">
        <div>
          <h2>{t("paymentMethod")}</h2>
          <p>{t("secureTransactions")}</p>
        </div>
        <ShieldCheck className="h-5 w-5 text-gray-400" />
      </div>

      {displayedErrors.length > 0 && (
        <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 my-3">
          {displayedErrors.map((err, i) => (
            <p key={i} className="text-sm text-red-700">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Razorpay Standard Checkout Note Card */}
      <div className="checkout-payment__note">
        <CreditCard className="h-5 w-5 text-gray-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <p className="font-medium text-gray-900 m-0">
              Razorpay Standard Checkout
            </p>
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase bg-amber-100 text-amber-900 rounded border border-amber-200">
              Test Mode
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Cards (Visa, Mastercard, RuPay, Amex), UPI (Google Pay, PhonePe, Paytm), NetBanking &amp; Wallets.
          </p>
          <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
            Transactions are encrypted and processed through the Razorpay payment modal overlay.
          </p>
        </div>
      </div>

      {/* Billing Address Selection */}
      <div className="checkout-billing">
        <h3>Billing Address</h3>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox
            checked={useShippingForBilling}
            onCheckedChange={(checked) =>
              setUseShippingForBilling(checked === true)
            }
          />
          <span className="text-sm text-gray-900">{t("sameAsShipping")}</span>
        </label>

        {!useShippingForBilling && (
          <div className="mt-4">
            <AddressFormFields
              address={billAddress}
              countries={countries}
              states={billStates}
              loadingStates={isPendingBill}
              onChange={updateBillAddress}
              idPrefix="bill"
            />
          </div>
        )}
      </div>
    </section>
  );
}
