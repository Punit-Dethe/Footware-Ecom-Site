import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CuratedProducts } from "@/components/home/CuratedProducts";

function SelectionSkeleton() {
  return (
    <div className="mirza-selection__grid" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div className="mirza-product-placeholder" key={i}>
          <div className="mirza-product-placeholder__image" />
          <div className="mirza-product-placeholder__name" />
          <div className="mirza-product-placeholder__price" />
        </div>
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
      className="mirza-selection mirza-frame"
      aria-labelledby="home-highlights-title"
    >
      <div className="mirza-section-heading">
        <h2 id="home-highlights-title" className="mirza-display">
          {t.rich("journal.selectionTitle", {
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h2>
        <Link className="mirza-link" href={`${basePath}/products`}>
          {t("journal.selectionCta")}
          <ArrowUpRight size={17} strokeWidth={1.4} aria-hidden="true" />
        </Link>
      </div>
      <Suspense fallback={<SelectionSkeleton />}>
        <CuratedProducts
          basePath={basePath}
          locale={locale}
          country={country}
          currency={currency}
        />
      </Suspense>
    </section>
  );
}
