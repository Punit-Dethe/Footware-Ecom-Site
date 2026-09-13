"use server";

import type {
  Category,
  CategoryListParams,
  PaginatedResponse,
  Product,
  ProductListParams,
} from "@/types/commerce";
import { cacheLife, cacheTag } from "next/cache";
import { getAccessToken, getLocaleOptions } from "@/lib/spree";

import {
  getCategoryByPermalinkOrId,
  listCatalogCategories,
  queryProducts,
} from "@/lib/catalog/catalog-repository";

export async function cachedListCategories(
  _params: CategoryListParams | undefined,
  _options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("categories", "catalog-public");
  const categories = await listCatalogCategories();
  return {
    data: categories,
    meta: { count: categories.length, total_count: categories.length },
  };
}

export async function getCategories(
  params?: CategoryListParams,
  options?: { locale?: string; country?: string },
) {
  const localeOptions = options ?? (await getLocaleOptions());
  return cachedListCategories(params, localeOptions);
}

export async function cachedGetCategory(
  idOrPermalink: string,
  _params: { expand?: string[] } | undefined,
  _options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("catalog-public", "category");
  const local = await getCategoryByPermalinkOrId(idOrPermalink);
  if (local) {
    return local as Category;
  }
  throw new Error(`Category not found: ${idOrPermalink}`);
}

export async function getCategory(
  idOrPermalink: string,
  params?: { expand?: string[] },
) {
  const options = await getLocaleOptions();
  return cachedGetCategory(idOrPermalink, params, options);
}

/**
 * Persistent cached category products fetch. Cache key is derived from
 * all function arguments (categoryId, params, locale, country, userToken).
 * Guest users pass undefined so the cache entry is shared.
 */
export async function cachedListCategoryProducts(
  categoryId: string,
  params: ProductListParams | undefined,
  _options: { locale?: string; country?: string },
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("catalog-public", "products", `category-products:${categoryId}`);

  const raw = (params || {}) as Record<string, any>;
  const page = Number(raw.page) || 1;
  const limit = Number(raw.limit) || 12;
  const offset = raw.offset != null ? Number(raw.offset) : undefined;
  const q =
    typeof raw.q === "string"
      ? raw.q
      : typeof raw["filter[name]"] === "string"
      ? raw["filter[name]"]
      : typeof raw["q[name_cont]"] === "string"
      ? raw["q[name_cont]"]
      : undefined;
  const sort = typeof raw.sort === "string" ? raw.sort : undefined;

  const result = await queryProducts({
    in_category: categoryId,
    page,
    limit,
    offset,
    q,
    sort,
  });
  return result as unknown as PaginatedResponse<Product>;
}

export async function getCategoryProducts(
  categoryId: string,
  params?: ProductListParams,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListCategoryProducts(categoryId, params, options, userToken);
}
