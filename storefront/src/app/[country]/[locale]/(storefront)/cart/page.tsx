"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { QuantityPickerField } from "@/components/cart/QuantityPickerField";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { useCart } from "@/contexts/CartContext";
import { trackRemoveFromCart, trackViewCart } from "@/lib/analytics/gtm";
import { extractBasePath } from "@/lib/utils/path";
import type { LineItem } from "@/types/commerce";

export default function CartPage() {
  const { cart, loading, updating, updateItem, removeItem } = useCart();

  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const viewCartFiredRef = useRef(false);
  const t = useTranslations("cart");
  const tc = useTranslations("common");

  // Track view_cart when cart loads with items
  useEffect(() => {
    if (
      !loading &&
      cart &&
      cart.total_quantity > 0 &&
      !viewCartFiredRef.current
    ) {
      trackViewCart(cart);
      viewCartFiredRef.current = true;
    }
  }, [cart, loading]);

  const handleRemove = async (item: LineItem) => {
    await removeItem(item.id);
    if (cart) {
      trackRemoveFromCart(item, cart.currency);
    }
  };

  if (loading) {
    return (
      <main className="cart-page cart-page--loading">
        <div className="cart-page__frame animate-pulse">
          <div className="cart-page__loading-title" />
          <div className="cart-page__loading-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="cart-page__loading-row" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <main className="cart-page cart-page--empty">
        <div className="cart-empty">
          <ShoppingBag
            className="cart-empty__icon"
            strokeWidth={1}
            aria-hidden="true"
          />
          <h1>{t("emptyCart")}</h1>
          <p>{t("emptyCartDescription")}</p>
          <Button size="lg" asChild className="cart-page__primary-action">
            <Link href={`${basePath}/products`}>{tc("continueShopping")}</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-page__frame">
        <header className="cart-page__intro">
          <div>
            <h1>{t("shoppingCart")}</h1>
            <p>{t("itemCount", { count: cart.total_quantity })}</p>
          </div>
          <Link href={`${basePath}/products`} className="cart-page__continue">
            {tc("continueShopping")}
          </Link>
        </header>

        <div className="cart-page__layout">
          <section className="cart-page__items" aria-label={t("shoppingCart")}>
            <ul>
              {cart.items.map((item) => (
                <li key={item.id} className="cart-line">
                  <Link
                    href={`${basePath}/products/${item.slug}`}
                    className="cart-line__image"
                    aria-label={item.name}
                  >
                    <ProductImage
                      src={item.thumbnail_url}
                      alt={item.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 112px, 176px"
                    />
                  </Link>

                  <div className="cart-line__content">
                    <h3>
                      <Link href={`${basePath}/products/${item.slug}`}>
                        {item.name}
                      </Link>
                    </h3>
                    {item.options_text && (
                      <p className="cart-line__options">{item.options_text}</p>
                    )}
                    <p className="cart-line__price">{item.display_price}</p>
                    <div className="cart-line__actions">
                      <QuantityPickerField
                        quantity={item.quantity}
                        onQuantityChange={(quantity) =>
                          updateItem(item.id, quantity)
                        }
                        disabled={updating}
                      />
                      <Button
                        variant="link"
                        size="sm"
                        className="cart-line__remove"
                        aria-label={t("removeItemLabel", { name: item.name })}
                        onClick={() => handleRemove(item)}
                        disabled={updating}
                      >
                        {tc("remove")}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="cart-summary">
            <div className="cart-summary__inner">
              <h2>{tc("orderSummary")}</h2>

              <dl>
                <div>
                  <dt>{tc("subtotal")}</dt>
                  <dd>{cart.display_item_total}</dd>
                </div>
                {cart.discount_total && parseFloat(cart.discount_total) < 0 && (
                  <div className="cart-summary__saving">
                    <dt>{tc("discount")}</dt>
                    <dd>{cart.display_discount_total}</dd>
                  </div>
                )}
                {cart.delivery_total && parseFloat(cart.delivery_total) > 0 && (
                  <div>
                    <dt>{tc("shipping")}</dt>
                    <dd>{cart.display_delivery_total}</dd>
                  </div>
                )}
                {cart.tax_total && parseFloat(cart.tax_total) > 0 && (
                  <div>
                    <dt>{tc("tax")}</dt>
                    <dd>{cart.display_tax_total}</dd>
                  </div>
                )}
                <div className="cart-summary__total">
                  <dt>{tc("total")}</dt>
                  <dd>{cart.display_total}</dd>
                </div>

                {cart.gift_card &&
                parseFloat(cart.gift_card_total ?? "0") > 0 ? (
                  <div className="cart-summary__saving">
                    <dt>{t("giftCard")}</dt>
                    <dd>-{cart.display_gift_card_total}</dd>
                  </div>
                ) : cart.store_credit_total &&
                  parseFloat(cart.store_credit_total) > 0 ? (
                  <div className="cart-summary__saving">
                    <dt>{t("storeCredit")}</dt>
                    <dd>-{cart.display_store_credit_total}</dd>
                  </div>
                ) : null}

                {cart.amount_due &&
                  cart.amount_due !== cart.total &&
                  parseFloat(cart.amount_due) > 0 && (
                    <div className="cart-summary__total">
                      <dt>{t("amountDue")}</dt>
                      <dd>{cart.display_amount_due}</dd>
                    </div>
                  )}
              </dl>

              <div className="cart-summary__actions">
                <Button size="lg" asChild className="cart-page__primary-action">
                  <Link href={`${basePath}/checkout/${cart.id}`}>
                    {t("proceedToCheckout")}
                  </Link>
                </Button>
                <Link
                  href={`${basePath}/products`}
                  className="cart-summary__secondary-action"
                >
                  {tc("continueShopping")}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
