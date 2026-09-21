"use server";

import type { ProductListParams } from "@/types/commerce";
import {
  DEFAULT_SURFACE,
  type Surface,
} from "@/lib/storefront";
import {
  getCatalogFilters,
  getProductBySlugOrId,
  queryProducts,
} from "@/lib/catalog/catalog-repository";
import { resolveCountryCurrency } from "@/lib/data/pricing";

/**
 * Cached product list fetch. Cache key is derived from function arguments by Next.js "use cache":
 *
 * - params: pagination, search, and category filters
 * - options: locale/country for market formatting and currency resolution
 * - surface: DTC vs wholesale — distinct catalog segmentation via cache tag and arguments
 */
export async function cachedListProducts(
  params?: ProductListParams,
  options?: { locale?: string; country?: string; currency?: string },
  _surface: Surface = DEFAULT_SURFACE,
) {
  const currency =
    options?.currency ||
    (typeof params?.currency === "string" ? params.currency : undefined) ||
    (options?.country ? resolveCountryCurrency(options.country) : "USD");

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

  return await queryProducts({
    page,
    limit,
    offset,
    q,
    in_category,
    sort,
    currency,
  });
}

export async function getProducts(
  params?: ProductListParams,
  surface: Surface = DEFAULT_SURFACE,
) {
  const currency = typeof params?.currency === "string" ? params.currency : undefined;
  return cachedListProducts(params, currency ? { currency } : undefined, surface);
}

/**
 * Single product fetch by slug or ID. Resolves in-process from authoritative snapshot.
 */
export async function cachedGetProduct(
  slugOrId: string,
  _expand?: string[],
  options?: { locale?: string; country?: string; currency?: string },
  _surface?: Surface,
) {
  const currency =
    options?.currency ||
    (options?.country ? resolveCountryCurrency(options.country) : "USD");
  const local = await getProductBySlugOrId(slugOrId, currency);
  if (local) {
    return local;
  }
  throw new Error(`Product not found: ${slugOrId}`);
}

export async function getProduct(
  slugOrId: string,
  params?: { expand?: string[]; currency?: string; country?: string },
  surface: Surface = DEFAULT_SURFACE,
) {
  return cachedGetProduct(
    slugOrId,
    params?.expand ?? [],
    params?.currency || params?.country
      ? { currency: params.currency, country: params.country }
      : undefined,
    surface,
  );
}

export async function cachedGetProductFilters(
  params?: Record<string, unknown>,
  options?: { locale?: string; country?: string; currency?: string },
  _surface?: Surface,
) {
  const currency =
    options?.currency ||
    (typeof params?.currency === "string" ? params.currency : undefined) ||
    (options?.country ? resolveCountryCurrency(options.country) : "USD");

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

  return await getCatalogFilters({ in_category, currency });
}

export async function getProductFilters(
  params?: Record<string, unknown>,
  surface: Surface = DEFAULT_SURFACE,
) {
  const currency = typeof params?.currency === "string" ? params.currency : undefined;
  return cachedGetProductFilters(params, currency ? { currency } : undefined, surface);
}

