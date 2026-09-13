import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CatalogHero } from "@/components/products/CatalogHero";
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
          <h1>{t("searchResultsFor", { query })}</h1>
        </div>
      ) : (
        <CatalogHero
          title={t("allProducts")}
          eyebrow={t("catalogEyebrow")}
          intro={t("catalogIntro")}
          note={t("catalogNote")}
          signature={t("catalogSignature")}
        />
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
