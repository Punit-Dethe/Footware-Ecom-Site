import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/products/ProductListing";
import { JsonLd } from "@/components/seo/JsonLd";
import { CATEGORY_PAGE_EXPAND, getCachedCategory } from "@/lib/data/cached";
import { getCategoryProducts } from "@/lib/data/categories";
import { resolveCurrency } from "@/lib/data/markets";
import { getProductFilters } from "@/lib/data/products";
import { generateCategoryMetadata } from "@/lib/metadata/category";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { getStoreUrl } from "@/lib/store";
import { parseListingSearchParams } from "@/lib/utils/listing-search-params";
import { CategoryBanner } from "./CategoryBanner";

interface CategoryPageProps {
  params: Promise<{
    country: string;
    locale: string;
    permalink: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

import { listCatalogCategories } from "@/lib/catalog/catalog-repository";
import { getDefaultCountry, getDefaultLocale } from "@/lib/store";

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

import { Suspense } from "react";

function CategoryPageSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-48 w-full bg-stone-100 rounded-2xl mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-stone-100 rounded-xl" />
        ))}
      </div>
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
  try {
    [category, currency] = await Promise.all([
      getCachedCategory(fullPermalink, CATEGORY_PAGE_EXPAND),
      resolveCurrency(country),
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
    <div>
      {storeUrl && (
        <JsonLd data={buildBreadcrumbJsonLd(category, basePath, storeUrl)} />
      )}

      <CategoryBanner category={category} basePath={basePath} locale={locale} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
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
        />
      </div>
    </div>
  );
}
