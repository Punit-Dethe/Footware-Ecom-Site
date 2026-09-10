import { ProductCarousel } from "@/components/products/ProductCarousel";
import { PRODUCT_CARD_FIELDS } from "@/lib/data/cached";
import { cachedListProducts } from "@/lib/data/products";

interface FeaturedProductsProps {
  basePath: string;
  locale: string;
  country: string;
  currency?: string;
}

export async function FeaturedProducts({
  basePath,
  locale,
  country,
  currency,
}: FeaturedProductsProps) {
  const productsResponse = await cachedListProducts(
    { limit: 8, fields: PRODUCT_CARD_FIELDS },
    { locale, country },
    "dtc",
  );

  return (
    <ProductCarousel
      products={productsResponse.data ?? []}
      basePath={basePath}
      currency={currency}
    />
  );
}
