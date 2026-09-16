import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProductCarousel } from "@/components/products/ProductCarousel";
import { PRODUCT_CARD_FIELDS } from "@/lib/data/cached";
import { cachedListProducts } from "@/lib/data/products";

interface HomeProductScrollerProps {
  basePath: string;
  locale: string;
  country: string;
  currency?: string;
}

export async function HomeProductScroller({
  basePath,
  locale,
  country,
  currency,
}: HomeProductScrollerProps) {
  const [t, response] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "home" }),
    cachedListProducts(
      { limit: 100, fields: PRODUCT_CARD_FIELDS },
      { locale, country },
      "dtc",
    ).catch((error: unknown) => {
      console.error(
        "Homepage: could not load the secondary product edit",
        error,
      );
      return null;
    }),
  ]);

  if (!response?.data.length) return null;

  const products =
    response.data.length > 6 ? response.data.slice(4, 10) : response.data;

  return (
    <section
      className="mirza-product-scroll"
      aria-labelledby="mirza-product-scroll-title"
    >
      <div className="mirza-product-scroll__heading mirza-frame">
        <h2 id="mirza-product-scroll-title" className="mirza-display">
          {t("moreToDiscover")}
        </h2>
        <Link className="mirza-link" href={`${basePath}/products`}>
          {t("viewAll")}
          <ArrowUpRight size={17} strokeWidth={1.4} aria-hidden="true" />
        </Link>
      </div>
      <ProductCarousel
        products={products}
        basePath={basePath}
        currency={currency}
        ariaLabel={t("moreToDiscover")}
        listId="homepage-secondary-edit"
        listName="More to Discover"
        priorityFirst={false}
        ambientMotion
      />
    </section>
  );
}
