import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ProductListing } from "@/components/products/ProductListing";
import { ProductListingSkeleton } from "@/components/products/ProductListingSkeleton";
import { resolveCurrency } from "@/lib/data/markets";
import { getProductFilters, getProducts } from "@/lib/data/products";
import { generateProductsMetadata } from "@/lib/metadata/products";
import { parseListingSearchParams } from "@/lib/utils/listing-search-params";

interface ProductsPageProps {
  params: Promise<{
    country: string;
    locale: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: ProductsPageProps): Promise<Metadata> {
  const { country, locale } = await params;
  return generateProductsMetadata({ country, locale });
}

export default function ProductsPage(props: ProductsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="catalog-page catalog-page--loading" aria-busy="true">
          <div className="catalog-hero" aria-hidden="true" />
          <ProductListingSkeleton />
        </div>
      }
    >
      <ProductsPageContent {...props} />
    </Suspense>
  );
}

async function ProductsPageContent({
  params,
  searchParams,
}: ProductsPageProps) {
  const [{ country, locale }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const basePath = `/${country}/${locale}`;

  const [currency, t] = await Promise.all([
    resolveCurrency(country),
    getTranslations({
      locale: locale as Locale,
      namespace: "products",
    }),
  ]);

  const listingState = parseListingSearchParams(rawSearchParams);
  const query = listingState.query;

  const listId = query ? "search-results" : "all-products";
  const listName = query ? "Search Results" : "All Products";

  return (
    <div className="catalog-page">
      {query ? (
        <div className="catalog-search-heading">
          <h1>
            {t("searchResultsFor", { query })}
          </h1>
        </div>
      ) : (
        <section className="catalog-hero" aria-labelledby="catalog-title">
          <div className="catalog-hero__copy">
            <p className="catalog-eyebrow">{t("catalogEyebrow")}</p>
            <h1 id="catalog-title">{t("allProducts")}</h1>
            <p className="catalog-hero__intro">{t("catalogIntro")}</p>
            <p className="catalog-hero__note">{t("catalogNote")}</p>
          </div>
          <div className="catalog-hero__visual">
            <Image
              src="/editorial/campaign-hero.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 760px) 100vw, 50vw"
              className="object-cover"
            />
            <span>{t("catalogSignature")}</span>
          </div>
        </section>
      )}

      <ProductListing
        state={listingState}
        basePath={basePath}
        currency={currency}
        locale={locale as Locale}
        listId={listId}
        listName={listName}
        fetchProducts={getProducts}
        fetchFilters={getProductFilters}
        emptyMessage={
          query ? t("noMatchingProducts", { query }) : t("tryAdjustingFilters")
        }
        editorialBreak={!query}
        editorialHref={`${basePath}/#craft`}
        editorialCopy={{
          label: t("editorialLabel"),
          title: t("editorialTitle"),
          action: t("editorialAction"),
        }}
      />
    </div>
  );
}
