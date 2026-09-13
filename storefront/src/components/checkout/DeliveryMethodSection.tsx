"use client";

import { useTranslations } from "next-intl";

interface DeliveryMethodSectionProps {
  errors?: string[];
}

export function DeliveryMethodSection({ errors }: DeliveryMethodSectionProps = {}) {
  const t = useTranslations("checkout");

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-3">
        {t("shippingMethod")}
      </h2>

      {errors && errors.length > 0 && (
        <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 mb-3">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-700">
              {error}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-sm border bg-gray-50 px-4 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Complimentary Express Delivery
          </p>
          <p className="text-xs text-gray-500">
            Insured express courier delivery included with every order
          </p>
        </div>
        <span className="text-sm font-semibold text-gray-900">Free</span>
      </div>
    </div>
  );
}
