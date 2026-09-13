"use server";

import type { ProductListParams } from "@/types/commerce";
import { cacheLife, cacheTag } from "next/cache";
import {
  cacheTagSuffix,
  DEFAULT_SURFACE,
  getLocaleOptions,
  type Surface,
} from "@/lib/storefront";
import {
  getCatalogFilters,
  getProductBySlugOrId,
  queryProducts,
} from "@/lib/catalog/catalog-repository";

/**
 * Cached product list fetch. Cache key is derived from function arguments by Next.js "use cache":
 *
 * - params: pagination, search, and category filters
 * - options: locale/country for market formatting
 * - surface: DTC vs wholesale — distinct catalog segmentation via cache tag and arguments
 */
export async function cachedListProducts(
  params: ProductListParams | undefined,
  _options: { locale?: string; country?: string },
  surface: Surface,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("catalog-public", `products${cacheTagSuffix(surface)}`);

  const raw = (params || {}) as Record<string, any>;
  const rawFilter = (raw.filter || {}) as Record<string, any>;

  const page = Number(raw.page) || 1;
  const limit = Number(raw.limit) || 12;
  const offset = raw.offset != null ? Number(raw.offset) : undefined;
  const q =
    typeof raw.q === "string"
      ? raw.q
      : typeof raw.search === "string"
      ? raw.search
      : typeof rawFilter.name === "string"
      ? rawFilter.name
      : typeof raw["filter[name]"] === "string"
      ? raw["filter[name]"]
      : typeof raw["q[search]"] === "string"
      ? raw["q[search]"]
      : typeof raw["q[name_cont]"] === "string"
      ? raw["q[name_cont]"]
      : undefined;

  const in_category =
    typeof raw.in_category === "string"
      ? raw.in_category
      : typeof raw.category_id === "string"
      ? raw.category_id
      : typeof rawFilter.category_id === "string"
      ? rawFilter.category_id
      : typeof raw["filter[category_id]"] === "string"
      ? (raw["filter[category_id]"] as string)
      : typeof raw["q[in_category]"] === "string"
      ? (raw["q[in_category]"] as string)
      : typeof raw["q[category_id_eq]"] === "string"
      ? raw["q[category_id_eq]"]
      : undefined;

  const sort = typeof raw.sort === "string" ? raw.sort : undefined;

  const result = await queryProducts({
    page,
    limit,
    offset,
    q,
    in_category,
    sort,
  });
  return result;
}

export async function getProducts(
  params?: ProductListParams,
  surface: Surface = DEFAULT_SURFACE,
) {
  const options = await getLocaleOptions();
  return cachedListProducts(params, options, surface);
}

/**
 * Cached single product fetch by slug.
 */
export async function cachedGetProduct(
  slugOrId: string,
  _expand: string[],
  _options: { locale?: string; country?: string },
  surface: Surface,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag(
    "catalog-public",
    `products${cacheTagSuffix(surface)}`,
    `product:${slugOrId}${cacheTagSuffix(surface)}`,
  );
  const local = await getProductBySlugOrId(slugOrId);
  if (local) {
    return local;
  }
  throw new Error(`Product not found: ${slugOrId}`);
}

export async function getProduct(
  slugOrId: string,
  params?: { expand?: string[] },
  surface: Surface = DEFAULT_SURFACE,
) {
  const options = await getLocaleOptions();
  return cachedGetProduct(
    slugOrId,
    params?.expand ?? [],
    options,
    surface,
  );
}

export async function cachedGetProductFilters(
  params: Record<string, unknown> | undefined,
  _options: { locale?: string; country?: string },
  surface: Surface,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("catalog-public", `product-filters${cacheTagSuffix(surface)}`);

  const in_category =
    typeof params?.in_category === "string"
      ? params.in_category
      : typeof params?.category_id === "string"
      ? params.category_id
      : typeof params?.["filter[category_id]"] === "string"
      ? (params["filter[category_id]"] as string)
      : typeof params?.["q[in_category]"] === "string"
      ? (params["q[in_category]"] as string)
      : undefined;

  return await getCatalogFilters({ in_category });
}

export async function getProductFilters(
  params?: Record<string, unknown>,
  surface: Surface = DEFAULT_SURFACE,
) {
  const options = await getLocaleOptions();
  return cachedGetProductFilters(params, options, surface);
}
