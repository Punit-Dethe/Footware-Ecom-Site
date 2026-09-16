import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CatalogHero } from "@/components/products/CatalogHero";
import { ProductListing } from "@/components/products/ProductListing";
import { ProductListingSkeleton } from "@/components/products/ProductListingSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { listCatalogCategories } from "@/lib/catalog/catalog-repository";
import { CATEGORY_PAGE_EXPAND, getCachedCategory } from "@/lib/data/cached";
import { getCategoryProducts } from "@/lib/data/categories";
import { resolveCurrency } from "@/lib/data/markets";
import { getProductFilters } from "@/lib/data/products";
import { generateCategoryMetadata } from "@/lib/metadata/category";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { getDefaultCountry, getDefaultLocale, getStoreUrl } from "@/lib/store";
import { parseListingSearchParams } from "@/lib/utils/listing-search-params";

interface CategoryPageProps {
  params: Promise<{
    country: string;
    locale: string;
    permalink: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  const country = getDefaultCountry();
  const locale = getDefaultLocale();
  const categories = await listCatalogCategories();

  return categories.map((c) => ({
    country,
    locale,
    permalink: c.permalink.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { country, locale, permalink } = await params;
  return generateCategoryMetadata({ country, locale, permalink });
}

function CategoryPageSkeleton() {
  return (
    <div className="catalog-page catalog-page--loading" aria-busy="true">
      <div className="catalog-hero" aria-hidden="true" />
      <ProductListingSkeleton />
    </div>
  );
}

export default function CategoryPage(props: CategoryPageProps) {
  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <CategoryPageContent {...props} />
    </Suspense>
  );
}

async function CategoryPageContent({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ country, locale, permalink }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const fullPermalink = permalink.join("/");
  const basePath = `/${country}/${locale}`;

  let category;
  let currency;
  let t;
  try {
    [category, currency, t] = await Promise.all([
      getCachedCategory(fullPermalink, CATEGORY_PAGE_EXPAND),
      resolveCurrency(country),
      getTranslations({ locale: locale as Locale, namespace: "products" }),
    ]);
  } catch (error) {
    console.error("Failed to fetch category:", error);
    notFound();
  }

  if (!category) {
    notFound();
  }

  const storeUrl = getStoreUrl();
  const listingState = parseListingSearchParams(rawSearchParams);

  // Pre-bind categoryId onto the server action so the client-side
  // InfiniteProductList island gets a single-arg (params) fetcher it can
  // call directly. Inline arrow closures don't serialize across the
  // server→client boundary; `.bind()` on a server action reference does.
  const fetchCategoryProducts = getCategoryProducts.bind(null, category.id);

  return (
    <div className="catalog-page">
      {storeUrl && (
        <JsonLd data={buildBreadcrumbJsonLd(category, basePath, storeUrl)} />
      )}

      <CatalogHero
        title={category.name}
        eyebrow={t("catalogEyebrow")}
        intro={t("catalogIntro")}
        note={t("catalogNote")}
      />

      <ProductListing
        state={listingState}
        basePath={basePath}
        currency={currency}
        locale={locale as Locale}
        listId={`category-${category.id}`}
        listName={`Category: ${category.name}`}
        categoryId={category.id}
        baseParams={{ in_category: category.id }}
        fetchProducts={fetchCategoryProducts}
        fetchFilters={getProductFilters}
        editorialBreak
        editorialHref={`${basePath}/#craft`}
        editorialCopy={{
          label: t("editorialLabel"),
          title: t("editorialTitle"),
          action: t("editorialAction"),
        }}
        editorialGridFeature
        editorialGridCopy={{
          title: t("productStoryTitle"),
          description: t("editorialTitle"),
        }}
      />
    </div>
  );
}
