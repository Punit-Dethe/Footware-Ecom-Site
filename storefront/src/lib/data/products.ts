"use server";

import type { ProductListParams } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import {
  cacheTagSuffix,
  DEFAULT_SURFACE,
  getAccessToken,
  getClientForSurface,
  getLocaleOptions,
  type Surface,
} from "@/lib/spree";

/**
 * Cached product list fetch. Cache key is derived from all function
 * arguments by Next.js "use cache":
 *
 * - locale/country: determines language and market-specific pricing
 * - surface: DTC vs wholesale — different catalog + channel pricing. Baked
 *   into both the cache tag and the arguments so the two never share entries.
 * - userToken: per-user cache segmentation (separate arg, NOT passed to
 *   SDK). Authenticated users may see different prices (B2B, loyalty).
 *   Each user's JWT is unique so the cache is segmented per user.
 *   Guest users pass undefined. On the wholesale surface the token is
 *   always present — the channel 401s guests.
 */
import {
  getCatalogFilters,
  getProductBySlugOrId,
  queryProducts,
} from "@/lib/catalog/catalog-repository";

export async function cachedListProducts(
  params: ProductListParams | undefined,
  _options: { locale?: string; country?: string },
  surface: Surface,
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag(`products${cacheTagSuffix(surface)}`);

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
      ? raw["filter[category_id]"]
      : typeof raw["q[in_category]"] === "string"
      ? raw["q[in_category]"]
      : typeof raw["q[category_id_eq]"] === "string"
      ? raw["q[category_id_eq]"]
      : undefined;

  const sort = typeof raw.sort === "string" ? raw.sort : undefined;

  const result = queryProducts({ page, limit, offset, q, in_category, sort });
  return result as unknown as ReturnType<
    ReturnType<typeof getClientForSurface>["products"]["list"]
  >;
}

export async function getProducts(
  params?: ProductListParams,
  surface: Surface = DEFAULT_SURFACE,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListProducts(params, options, surface, userToken);
}

/**
 * Persistent cached product detail fetch. Cache key is derived from:
 *
 * - slugOrId, expand: identify the product and response shape
 * - locale/country: determines language and market-specific pricing
 * - surface: DTC vs wholesale — see cachedListProducts
 * - userToken: per-user cache segmentation (separate arg, NOT passed to
 *   SDK). Authenticated users may see different prices (B2B, loyalty).
 *   Guest users pass undefined, so all guests share one entry.
 */
export async function cachedGetProduct(
  slugOrId: string,
  _expand: string[],
  _options: { locale?: string; country?: string },
  surface: Surface,
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag(
    `products${cacheTagSuffix(surface)}`,
    `product:${slugOrId}${cacheTagSuffix(surface)}`,
  );
  const local = getProductBySlugOrId(slugOrId);
  if (local) {
    return local as unknown as ReturnType<
      ReturnType<typeof getClientForSurface>["products"]["get"]
    >;
  }
  throw new Error(`Product not found: ${slugOrId}`);
}

export async function getProduct(
  slugOrId: string,
  params?: { expand?: string[] },
  surface: Surface = DEFAULT_SURFACE,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedGetProduct(
    slugOrId,
    params?.expand ?? [],
    options,
    surface,
    userToken,
  );
}

async function cachedGetProductFilters(
  params: Record<string, unknown> | undefined,
  _options: { locale?: string; country?: string },
  surface: Surface,
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag(`product-filters${cacheTagSuffix(surface)}`);

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

  return getCatalogFilters({ in_category }) as unknown as ReturnType<
    ReturnType<typeof getClientForSurface>["products"]["filters"]
  >;
}

export async function getProductFilters(
  params?: Record<string, unknown>,
  surface: Surface = DEFAULT_SURFACE,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedGetProductFilters(params, options, surface, userToken);
}
