import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";

function CarouselSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

interface FeaturedProductsSectionProps {
  basePath: string;
  locale: string;
  country: string;
  currency?: string;
}

export async function FeaturedProductsSection({
  basePath,
  locale,
  country,
  currency,
}: FeaturedProductsSectionProps) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });

  return (
    <section
      className="home-highlights featured-products"
      aria-labelledby="home-highlights-title"
    >
      <div className="home-section-heading">
        <h2 id="home-highlights-title" className="home-section-label">
          {t("featuredProducts")}
        </h2>
        <Link className="home-text-link" href={`${basePath}/products`}>
          {t("viewAll")} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <Suspense fallback={<CarouselSkeleton />}>
        <FeaturedProducts
          basePath={basePath}
          locale={locale}
          country={country}
          currency={currency}
        />
      </Suspense>
    </section>
  );
}
