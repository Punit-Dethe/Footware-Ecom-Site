"use client";

import type { AddressParams, Cart, Country, State } from "@/types/commerce";
import { CheckCircle2, ShieldCheck } from "lucide-react";
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

export type PaymentCompleteResult =
  | { type: "session"; sessionId: string; sessionResult?: string }
  | { type: "direct" };

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
  onPaymentComplete: (result: PaymentCompleteResult) => Promise<void>;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  onSessionMethodChange?: (isSessionBased: boolean) => void;
  errors?: string[];
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
  onSessionMethodChange,
  errors,
}: PaymentSectionProps) {
  const t = useTranslations("checkout");

  useEffect(() => {
    onSessionMethodChange?.(false);
  }, [onSessionMethodChange]);

  // Billing address state
  const [useShippingForBilling, setUseShippingForBilling] = useState(true);
  const [billAddress, setBillAddress] = useState<AddressFormData>(() =>
    addressToFormData(cart.billing_address),
  );
  const [billStates, setBillStates] = useState<State[]>([]);
  const [isPendingBill, setIsPendingBill] = useState(false);

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
              return { error: t("failedToSaveBilling") };
            }

            const saved = await onUpdateBillingAddress({
              billing_address: formDataToAddress(billAddress),
              use_shipping: false,
            });

            if (!saved) {
              setProcessing(false);
              return { error: t("failedToSaveBilling") };
            }
          } else {
            await onUpdateBillingAddress({
              use_shipping: true,
            });
          }

          await onPaymentComplete({ type: "direct" });
          return {};
        } catch {
          setProcessing(false);
          return { error: t("paymentError") };
        }
      },
    }),
    [
      billAddress,
      onPaymentComplete,
      onUpdateBillingAddress,
      setProcessing,
      t,
      useShippingForBilling,
    ],
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t("paymentMethod")}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t("secureTransactions")}</p>
        </div>
        <ShieldCheck className="h-5 w-5 text-gray-400" />
      </div>

      {errors && errors.length > 0 && (
        <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 my-3">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-700">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Direct Order Confirmation Card */}
      <div className="mt-3 rounded-sm border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Direct Order Placement
            </p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Your order is placed directly with Mirza. Fulfillment and payment details
              will be confirmed upon order processing with complimentary insured express courier delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Billing Address Selection */}
      <div className="mt-6 border-t pt-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Billing Address</h3>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox
            checked={useShippingForBilling}
            onCheckedChange={(checked) => setUseShippingForBilling(checked === true)}
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
    </div>
  );
}
