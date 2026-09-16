"use client";

import { useTranslations } from "next-intl";
import { ProductImage } from "@/components/ui/product-image";
import type { Cart } from "@/types/commerce";

interface SummaryProps {
  cart: Cart;
}

export function Summary({ cart }: SummaryProps) {
  const tc = useTranslations("common");
  const t = useTranslations("checkout");
  const items = cart.items || [];
  const hasShipping =
    Boolean(cart.display_delivery_total) ||
    (cart.fulfillments?.length ?? 0) > 0;

  return (
    <div className="checkout-summary">
      {/* Line items */}
      <div className="checkout-summary__items">
        {items.map((item) => (
          <div key={item.id} className="checkout-summary__item">
            <div className="checkout-summary__media">
              <div className="checkout-summary__image">
                <ProductImage
                  src={item.thumbnail_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  iconClassName="w-6 h-6"
                  sizes="72px"
                />
              </div>
              {/* Quantity badge — Shopify style: top-right, dark bg */}
              <div className="checkout-summary__quantity">{item.quantity}</div>
            </div>
            <div className="checkout-summary__details">
              <p className="checkout-summary__name">{item.name}</p>
              {item.options_text && (
                <p className="checkout-summary__muted mt-0.5">
                  {item.options_text}
                </p>
              )}
            </div>
            <div className="checkout-summary__item-total">
              {item.display_total ??
                item.total?.display_amount ??
                item.display_price}
            </div>
          </div>
        ))}
      </div>

      {/* Totals — Shopify style */}
      <div className="checkout-summary__totals">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">{tc("subtotal")}</span>
          <span className="text-gray-900">{cart.display_item_total}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-700">{tc("shipping")}</span>
          {hasShipping ? (
            <span className="text-gray-900">{cart.display_delivery_total}</span>
          ) : (
            <span className="checkout-summary__muted">
              {t("enterShippingAddress")}
            </span>
          )}
        </div>

        {cart.discount_total && parseFloat(cart.discount_total) !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">{tc("discount")}</span>
            <span className="text-green-700">
              {cart.display_discount_total}
            </span>
          </div>
        )}

        {parseFloat(cart.tax_total ?? "0") > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">{tc("tax")}</span>
            <span className="text-gray-900">{cart.display_tax_total}</span>
          </div>
        )}

        {/* Total row */}
        <div className="checkout-summary__grand-total">
          <span className="text-base font-bold text-gray-900">
            {tc("total")}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="checkout-summary__muted uppercase">
              {cart.currency}
            </span>
            <span className="checkout-summary__amount">
              {cart.display_total}
            </span>
          </div>
        </div>

        {/* Gift card or store credit — shown below total, reduces amount due.
            Gift cards use store credits under the hood, so only show one. */}
        {cart.gift_card && parseFloat(cart.gift_card_total ?? "0") > 0 ? (
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">{tc("giftCard")}</span>
            <span className="text-green-700">
              -{cart.display_gift_card_total}
            </span>
          </div>
        ) : cart.store_credit_total &&
          parseFloat(cart.store_credit_total) > 0 ? (
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">{tc("storeCredit")}</span>
            <span className="text-green-700">
              -{cart.display_store_credit_total}
            </span>
          </div>
        ) : null}

        {/* Amount due — only shown when gift card or store credit is applied */}
        {cart.amount_due &&
          cart.amount_due !== cart.total &&
          parseFloat(cart.amount_due) > 0 && (
            <div className="checkout-summary__grand-total checkout-summary__grand-total--due">
              <span className="text-base font-bold text-gray-900">
                {tc("amountDue")}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="checkout-summary__muted uppercase">
                  {cart.currency}
                </span>
                <span className="checkout-summary__amount">
                  {cart.display_amount_due}
                </span>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
