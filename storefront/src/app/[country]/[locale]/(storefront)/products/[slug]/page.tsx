import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicCatalogSnapshot } from "@/lib/catalog/catalog-repository";
import { resolveCountryCurrency } from "@/lib/data/pricing";
import { getProductMedia } from "@/lib/media/catalog-images";
import { generateProductMetadata } from "@/lib/metadata/product";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildProductJsonLd,
} from "@/lib/seo";
import { getDefaultCountry, getDefaultLocale, getStoreUrl } from "@/lib/store";
import type { Category } from "@/types/commerce";
import { ProductDetails } from "./ProductDetails";

interface ProductPageProps {
  params: Promise<{
    country: string;
    locale: string;
    slug: string;
  }>;
  searchParams: Promise<{
    category_id?: string;
  }>;
}

export async function generateStaticParams() {
  const country = getDefaultCountry();
  const locale = getDefaultLocale();
  const { products } = await getPublicCatalogSnapshot();

  return products.map((p) => ({
    country,
    locale,
    slug: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { country, locale, slug } = await params;
  return generateProductMetadata({ country, locale, slug });
}

function findBreadcrumbCategory(
  categories: Category[],
  categoryId?: string,
): Category | undefined {
  if (categories.length === 0) return undefined;
  if (categoryId) {
    const match = categories.find((c) => c.id === categoryId);
    if (match) return match;
  }
  return categories[0];
}

function ProductPageSkeleton() {
  return (
    <div className="pdp-page animate-pulse" aria-busy="true">
      <div className="pdp-breadcrumbs h-4 bg-stone-100" />
      <div className="pdp-overview">
        <div className="aspect-square bg-stone-100" />
        <div className="space-y-4 p-8">
          <div className="h-8 w-3/4 bg-stone-100" />
          <div className="h-6 w-1/4 bg-stone-100" />
          <div className="h-24 w-full bg-stone-100" />
        </div>
      </div>
    </div>
  );
}

export default function ProductPage(props: ProductPageProps) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPageContent {...props} />
    </Suspense>
  );
}

async function ProductPageContent({ params, searchParams }: ProductPageProps) {
  const [{ country, locale, slug }, { category_id }] = await Promise.all([
    params,
    searchParams,
  ]);
  const basePath = `/${country}/${locale}`;
  const currency = resolveCountryCurrency(country);

  const snapshot = await getPublicCatalogSnapshot(currency);
  const clean = slug.toLowerCase().trim();
  const product =
    snapshot.products.find(
      (p) =>
        p.slug.toLowerCase() === clean ||
        p.id.toLowerCase() === clean ||
        p.sku?.toLowerCase() === clean ||
        p.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") === clean ||
        p.variants?.some(
          (v) =>
            v.sku.toLowerCase() === clean ||
            v.id.toLowerCase() === clean ||
            v.sku.toLowerCase().endsWith(`-${clean}`),
        ),
    ) || null;

  if (!product) {
    notFound();
  }

  const storeUrl = getStoreUrl();
  const canonicalUrl = storeUrl
    ? buildCanonicalUrl(
        storeUrl,
        `/${country}/${locale}/products/${product.slug}`,
      )
    : undefined;

  const breadcrumbCategory = findBreadcrumbCategory(
    product.categories || [],
    category_id,
  );
  const catalogProducts = snapshot.products;
  const categoryProducts = breadcrumbCategory
    ? catalogProducts.filter((candidate) =>
        candidate.categories.some(
          (category) => category.id === breadcrumbCategory.id,
        ),
      )
    : catalogProducts;
  const currentIndex = categoryProducts.findIndex(
    (candidate) => candidate.id === product.id,
  );
  const previousProduct =
    currentIndex >= 0 && categoryProducts.length > 1
      ? categoryProducts[
          (currentIndex - 1 + categoryProducts.length) % categoryProducts.length
        ]
      : null;
  const nextProduct =
    currentIndex >= 0 && categoryProducts.length > 1
      ? categoryProducts[(currentIndex + 1) % categoryProducts.length]
      : null;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "products",
  });
  const relatedProducts = catalogProducts
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.categories.some((category) =>
          product.categories.some(
            (ownCategory) => ownCategory.id === category.id,
          ),
        ),
    )
    .slice(0, 4);

  return (
    <>
      {canonicalUrl && (
        <JsonLd data={buildProductJsonLd(product, canonicalUrl)} />
      )}
      {breadcrumbCategory && storeUrl && (
        <JsonLd
          data={buildBreadcrumbJsonLd(breadcrumbCategory, basePath, storeUrl, {
            name: product.name,
            slug: product.slug,
          })}
        />
      )}
      <div className="pdp-page">
        <div className="pdp-breadcrumbs">
          <div className="pdp-breadcrumbs__trail">
            {breadcrumbCategory && (
              <Breadcrumbs
                category={breadcrumbCategory}
                basePath={basePath}
                productName={product.name}
                locale={locale}
              />
            )}
          </div>
          {previousProduct && nextProduct && (
            <nav
              className="pdp-product-navigation"
              aria-label={t("productNavigation")}
            >
              <Link href={`${basePath}/products/${previousProduct.slug}`}>
                <ChevronLeft aria-hidden="true" /> {t("previousProduct")}
              </Link>
              <Link href={`${basePath}/products/${nextProduct.slug}`}>
                {t("nextProduct")} <ChevronRight aria-hidden="true" />
              </Link>
            </nav>
          )}
        </div>
        <ProductDetails
          product={product}
          media={
            product.product_media ||
            getProductMedia(product.slug, product.thumbnail_url)
          }
          basePath={basePath}
          editorial
          relatedProducts={relatedProducts}
        />
      </div>
    </>
  );
}
