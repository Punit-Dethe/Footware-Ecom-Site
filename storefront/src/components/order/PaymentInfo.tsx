import type { CreditCard, Payment, StoreCredit } from "@/types/commerce";
import { CreditCard as CreditCardIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getCardLabel } from "@/lib/utils/credit-card";

interface PaymentInfoProps {
  payment: Payment;
  /** Label override for store credit payments (e.g. "Gift Card") */
  storeCreditLabel?: string;
}

export function PaymentInfo({ payment, storeCreditLabel }: PaymentInfoProps) {
  const t = useTranslations("orders");
  const source = payment.source;

  if (payment.source_type === "credit_card" && source) {
    const card = source as CreditCard;
    return (
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg flex items-center justify-center">
          <CreditCardIcon className="w-5 h-5 text-gray-700" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {t("cardEndingIn", {
              label: getCardLabel(card.brand),
              digits: card.last4,
            })}
          </p>
          <p className="text-xs text-gray-500">
            {t("cardExpires", {
              month: String(card.month).padStart(2, "0"),
              year: card.year,
            })}
          </p>
        </div>
      </div>
    );
  }

  if (payment.source_type === "store_credit" && source) {
    const credit = source as StoreCredit;
    const label = storeCreditLabel || t("storeCredit");
    return (
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">
          {t("storeCreditApplied", {
            amount: payment.display_amount ?? "",
            remaining: credit.display_amount_remaining ?? "",
          })}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-900">
        {payment.payment_method?.name}
      </p>
      <p className="text-xs text-gray-500">{payment.display_amount}</p>
    </div>
  );
}
