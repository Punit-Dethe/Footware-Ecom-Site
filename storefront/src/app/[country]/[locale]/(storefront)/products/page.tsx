import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CatalogHero } from "@/components/products/CatalogHero";
import { ProductListing } from "@/components/products/ProductListing";
import { ProductListingSkeleton } from "@/components/products/ProductListingSkeleton";
import { CATEGORY_PAGE_EXPAND, getCachedCategory } from "@/lib/data/cached";
import { getCategoryProducts } from "@/lib/data/categories";
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

  const listingState = parseListingSearchParams(rawSearchParams);
  const query = listingState.query;
  const categoryParam = Array.isArray(rawSearchParams.category)
    ? rawSearchParams.category[0]
    : rawSearchParams.category;

  const [currency, t, category] = await Promise.all([
    resolveCurrency(country),
    getTranslations({
      locale: locale as Locale,
      namespace: "products",
    }),
    categoryParam
      ? getCachedCategory(categoryParam, CATEGORY_PAGE_EXPAND).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (categoryParam && !category) notFound();

  const fetchProducts = category
    ? getCategoryProducts.bind(null, category.id)
    : getProducts;
  const baseParams = category ? { in_category: category.id } : undefined;

  const listId = query
    ? "search-results"
    : category
      ? `category-${category.id}`
      : "all-products";
  const listName = query
    ? "Search Results"
    : category
      ? `Category: ${category.name}`
      : "All Products";

  return (
    <div className="catalog-page">
      {query ? (
        <div className="catalog-search-heading">
          <h1>{t("searchResultsFor", { query })}</h1>
        </div>
      ) : (
        <CatalogHero
          title={category?.name ?? t("allProducts")}
          eyebrow={t("catalogEyebrow")}
          intro={t("catalogIntro")}
          note={t("catalogNote")}
        />
      )}

      <ProductListing
        state={listingState}
        basePath={basePath}
        currency={currency}
        locale={locale as Locale}
        listId={listId}
        listName={listName}
        categoryId={category?.id}
        baseParams={baseParams}
        fetchProducts={fetchProducts}
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
        editorialGridFeature={!query}
        editorialGridCopy={{
          title: t("productStoryTitle"),
          description: t("editorialTitle"),
        }}
      />
    </div>
  );
}
