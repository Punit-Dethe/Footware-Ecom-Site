"use client";

import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { QuantityPickerField } from "@/components/cart/QuantityPickerField";
import { HiddenPricePrompt } from "@/components/products/HiddenPricePrompt";
import { MediaGallery } from "@/components/products/MediaGallery";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCustomFields } from "@/components/products/ProductCustomFields";
import { ProductWearGallery } from "@/components/products/ProductWearGallery";
import { VariantPicker } from "@/components/products/VariantPicker";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useHiddenPricing } from "@/contexts/HiddenPricingContext";
import { useStore } from "@/contexts/StoreContext";
import { trackAddToCart, trackViewItem } from "@/lib/analytics/gtm";
import type { ProductMedia } from "@/lib/media/types";
import type { Media, Product, Variant } from "@/types/commerce";

interface ProductDetailsProps {
  product: Product;
  media?: ProductMedia;
  basePath: string;
  editorial?: boolean;
  relatedProducts?: Product[];
}

export function ProductDetails({
  product,
  media: mediaProp,
  basePath,
  editorial = false,
  relatedProducts = [],
}: ProductDetailsProps) {
  const { addItem } = useCart();
  const { currency } = useStore();
  const t = useTranslations("products");
  const th = useTranslations("home");
  const tc = useTranslations("common");
  const tp = useTranslations("policies");
  const tw = useTranslations("wholesale");
  const media: ProductMedia = mediaProp ||
    product.product_media || {
      mainUrl: product.thumbnail_url || "",
      dominantColor: "#fff",
    };
  const hiddenPricing = useHiddenPricing();
  const pricesHidden = hiddenPricing !== null;

  const variants = useMemo(
    () => (product.variants || []).filter(Boolean),
    [product.variants],
  );
  const hasVariants = variants.length > 0;
  const optionTypes = product.option_types || [];

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => {
    if (product.default_variant) return product.default_variant;
    if (hasVariants)
      return variants.find((variant) => variant.purchasable) || variants[0];
    return null;
  });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    trackViewItem(product, currency);
  }, [product, currency]);

  const galleryImages = useMemo((): Media[] => {
    if (product.media?.length) return product.media;
    if (!media.mainUrl) return [];
    return [
      {
        id: `img_${product.id}`,
        url: media.mainUrl,
        alt: product.name,
        position: 1,
      } as Media,
    ];
  }, [product.media, product.id, product.name, media.mainUrl]);

  const variantImageIndex = useMemo((): number | null => {
    if (!selectedVariant) return null;
    const index = galleryImages.findIndex((image) =>
      image.variant_ids?.includes(selectedVariant.id),
    );
    return index >= 0 ? index : null;
  }, [selectedVariant, galleryImages]);

  const price = selectedVariant?.price ?? product.price;
  const originalPrice =
    selectedVariant?.original_price ?? product.original_price;
  const displayPrice = price?.display_amount;
  const currentAmountCents = price?.amount_in_cents;
  const originalAmountCents = originalPrice?.amount_in_cents;
  const compareAtAmountCents = price?.compare_at_amount_in_cents;
  const onSale =
    (currentAmountCents != null &&
      originalAmountCents != null &&
      currentAmountCents < originalAmountCents) ||
    (compareAtAmountCents != null &&
      currentAmountCents != null &&
      currentAmountCents < compareAtAmountCents);
  const strikethroughPrice = onSale
    ? ((originalPrice?.display_amount &&
      originalPrice.display_amount !== displayPrice
        ? originalPrice.display_amount
        : price?.display_compare_at_amount) ?? null)
    : null;
  const sku =
    selectedVariant?.sku ?? product.default_variant?.sku ?? product.sku;
  const isPurchasable = hasVariants
    ? (selectedVariant?.purchasable ?? false)
    : (product.purchasable ?? false);
  const inStock = hasVariants
    ? (selectedVariant?.in_stock ?? false)
    : (product.in_stock ?? false);
  const category = product.categories?.[0];
  const policyBasePath = basePath.replace(/\/wholesale$/, "");

  const handleAddToCart = async () => {
    const variantId =
      selectedVariant?.id ||
      product.default_variant?.id ||
      product.default_variant_id;
    if (!variantId) return;

    setLoading(true);
    try {
      await addItem(variantId, quantity);
      trackAddToCart(product, selectedVariant, quantity, currency);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`pdp-product${editorial ? " pdp-product--editorial" : ""}`}
      data-hydrated={hydrated ? "true" : undefined}
    >
      <section className="pdp-overview" aria-label={product.name}>
        <MediaGallery
          images={galleryImages}
          productName={product.name}
          activeIndex={variantImageIndex}
          editorial={editorial}
        />

        <div className="pdp-summary">
          <p className="pdp-kicker">{category?.name || t("allProducts")}</p>
          <h1>{product.name}</h1>
          <div className="pdp-price-row">
            {displayPrice ? (
              <span className="pdp-price">{displayPrice}</span>
            ) : (
              <HiddenPricePrompt className="underline underline-offset-4" />
            )}
            {onSale && strikethroughPrice && (
              <>
                <span className="pdp-price--old">{strikethroughPrice}</span>
                <span className="pdp-sale">{t("sale")}</span>
              </>
            )}
          </div>
          {product.description && (
            <p className="pdp-summary__description">{product.description}</p>
          )}

          <div className="pdp-summary__selectors">
            {hasVariants && optionTypes.length > 0 && (
              <VariantPicker
                variants={variants}
                optionTypes={optionTypes}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
                className={editorial ? "pdp-variant-picker" : undefined}
                sizeGuideHref={editorial ? "#size-guide" : undefined}
                compactSizes={editorial}
              />
            )}

            {!pricesHidden && (
              <div className="pdp-quantity">
                <span className="pdp-field-label">{tc("quantity")}</span>
                <div className="pdp-quantity__control">
                  <QuantityPickerField
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    disabled={!isPurchasable}
                    size="lg"
                  />
                </div>
              </div>
            )}

            {pricesHidden ? (
              <Button asChild className="pdp-add-button" size="lg">
                <Link href={hiddenPricing.signInHref}>
                  {tw("hiddenPrice.signInToOrder")}
                </Link>
              </Button>
            ) : (
              <Button
                className="pdp-add-button"
                size="lg"
                onClick={handleAddToCart}
                disabled={loading || !isPurchasable}
              >
                {loading && (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                )}
                {loading
                  ? t("adding")
                  : isPurchasable
                    ? t("addToCart")
                    : t("outOfStock")}
              </Button>
            )}

            <p className="pdp-stock" aria-live="polite">
              <span
                className={`pdp-stock__dot${inStock ? "" : " pdp-stock__dot--empty"}`}
              />
              {inStock ? t("inStock") : t("outOfStock")}
            </p>
          </div>
        </div>
      </section>

      <section
        className={`pdp-information${editorial ? "" : " pdp-information--trade"}`}
      >
        {editorial && (
          <div className="pdp-story">
            <p className="pdp-kicker">{th("craftLabel")}</p>
            <h2>{t("productStoryTitle")}</h2>
            <p>{th("heritageDescription")}</p>
          </div>
        )}

        <div className="pdp-specifications">
          <h2 className="pdp-kicker">{t("details")}</h2>
          <dl className="pdp-specifications__list">
            {category && (
              <div>
                <dt>{t("categories")}</dt>
                <dd>{category.name}</dd>
              </div>
            )}
            {sku && (
              <div>
                <dt>{t("sku")}</dt>
                <dd>{sku}</dd>
              </div>
            )}
            {selectedVariant?.options_text && (
              <div>
                <dt>{t("options")}</dt>
                <dd>{selectedVariant.options_text}</dd>
              </div>
            )}
            <div>
              <dt>{t("availability")}</dt>
              <dd>{inStock ? t("inStock") : t("outOfStock")}</dd>
            </div>
          </dl>

          <ProductCustomFields customFields={product.custom_fields} />

          <div className="pdp-accordions">
            <details>
              <summary>
                {t("shippingReturns")}
                <Plus aria-hidden="true" />
              </summary>
              <div className="pdp-accordions__content">
                <Link href={`${policyBasePath}/policies/shipping-policy`}>
                  {tp("shippingPolicy")}
                </Link>
                <Link href={`${policyBasePath}/policies/return-policy`}>
                  {tp("returnsPolicy")}
                </Link>
              </div>
            </details>
            <details>
              <summary>
                {t("careGuide")}
                <Plus aria-hidden="true" />
              </summary>
              <p className="pdp-accordions__content">{t("careAdvice")}</p>
            </details>
            <details id="size-guide">
              <summary>
                {t("sizeGuide")}
                <Plus aria-hidden="true" />
              </summary>
              <p className="pdp-accordions__content">{t("sizeAdvice")}</p>
            </details>
          </div>
        </div>
      </section>

      {editorial && (
        <section className="pdp-worn" aria-labelledby="pdp-worn-title">
          <div className="pdp-worn__copy">
            <p className="pdp-kicker">{t("wornLabel")}</p>
            <h2 id="pdp-worn-title">{t("wornTitle")}</h2>
            <p>{t("wornDescription")}</p>
          </div>
          <ProductWearGallery />
        </section>
      )}

      {editorial && relatedProducts.length > 0 && (
        <section className="pdp-related" aria-labelledby="pdp-related-title">
          <div className="pdp-related__heading">
            <h2 id="pdp-related-title" className="pdp-kicker">
              {t("youMayAlsoLike")}
            </h2>
            <Link href={`${basePath}/products`}>
              {th("viewAll")} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="pdp-related__grid">
            {relatedProducts.map((related, index) => (
              <ProductCard
                key={related.id}
                product={related}
                basePath={basePath}
                categoryId={related.categories?.[0]?.id}
                index={index}
                listId="related-products"
                listName="Related Products"
                currency={currency}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
