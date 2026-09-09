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
  params: CategoryListParams | undefined,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("categories");
  try {
    return await getClient().categories.list(params, options);
  } catch (_error) {
    return {
      data: CATEGORIES,
      meta: { count: CATEGORIES.length, total_count: CATEGORIES.length },
    } as unknown as ReturnType<ReturnType<typeof getClient>["categories"]["list"]>;
  }
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
  params: { expand?: string[] } | undefined,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("category");
  try {
    const res = await getClient().categories.get(idOrPermalink, params, options);
    const category = ((res as any)?.data || res) as unknown as ReturnType<
      ReturnType<typeof getClient>["categories"]["get"]
    >;
    if (category && ((category as any).permalink || (category as any).name)) {
      return category;
    }
    const local = getCategoryByPermalinkOrId(idOrPermalink);
    return (local || category) as unknown as ReturnType<
      ReturnType<typeof getClient>["categories"]["get"]
    >;
  } catch (_error) {
    const local = getCategoryByPermalinkOrId(idOrPermalink);
    if (local) {
      return local as unknown as ReturnType<
        ReturnType<typeof getClient>["categories"]["get"]
      >;
    }
    throw _error;
  }
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
  options: { locale?: string; country?: string },
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("products", `category-products:${categoryId}`);
  try {
    return await getClient().products.list(
      { ...params, in_category: categoryId },
      options,
    );
  } catch (_error) {
    return queryProducts({
      in_category: categoryId,
      page: params?.page,
      limit: params?.limit,
      sort: typeof params?.sort === "string" ? params.sort : undefined,
    }) as unknown as ReturnType<ReturnType<typeof getClient>["products"]["list"]>;
  }
}

export async function getCategoryProducts(
  categoryId: string,
  params?: ProductListParams,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListCategoryProducts(categoryId, params, options, userToken);
}
