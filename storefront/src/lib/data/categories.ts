"use server";

import type { CategoryListParams, ProductListParams } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { getAccessToken, getClient, getLocaleOptions } from "@/lib/spree";

import {
  CATEGORIES,
  getCategoryByPermalinkOrId,
  queryProducts,
} from "@/lib/catalog/catalog-repository";

async function cachedListCategories(
  _params: CategoryListParams | undefined,
  _options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("categories");
  return {
    data: CATEGORIES,
    meta: { count: CATEGORIES.length, total_count: CATEGORIES.length },
  } as unknown as ReturnType<ReturnType<typeof getClient>["categories"]["list"]>;
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
  cacheTag("category");
  const local = getCategoryByPermalinkOrId(idOrPermalink);
  if (local) {
    return local as unknown as ReturnType<
      ReturnType<typeof getClient>["categories"]["get"]
    >;
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
async function cachedListCategoryProducts(
  categoryId: string,
  params: ProductListParams | undefined,
  _options: { locale?: string; country?: string },
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("products", `category-products:${categoryId}`);

  const raw = (params || {}) as Record<string, any>;
  const page = Number(raw.page) || 1;
  const limit = Number(raw.limit) || 12;
  const sort = typeof raw.sort === "string" ? raw.sort : undefined;

  const result = queryProducts({
    in_category: categoryId,
    page,
    limit,
    sort,
  });
  return result as unknown as ReturnType<
    ReturnType<typeof getClient>["products"]["list"]
  >;
}

export async function getCategoryProducts(
  categoryId: string,
  params?: ProductListParams,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListCategoryProducts(categoryId, params, options, userToken);
}
