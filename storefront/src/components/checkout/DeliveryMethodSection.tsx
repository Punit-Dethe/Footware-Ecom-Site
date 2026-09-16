"use client";

import { useTranslations } from "next-intl";

interface DeliveryMethodSectionProps {
  errors?: string[];
}

export function DeliveryMethodSection({
  errors,
}: DeliveryMethodSectionProps = {}) {
  const t = useTranslations("checkout");

  return (
    <section className="checkout-delivery">
      <div className="checkout-section-heading">
        <h2>{t("shippingMethod")}</h2>
      </div>

      {errors && errors.length > 0 && (
        <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 mb-3">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-700">
              {error}
            </p>
          ))}
        </div>
      )}

      <div className="checkout-method">
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
    </section>
  );
}
