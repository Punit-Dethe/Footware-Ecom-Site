"use server";

import type {
  Category,
  CategoryListParams,
  PaginatedResponse,
  Product,
  ProductListParams,
} from "@/types/commerce";

import {
  getCategoryByPermalinkOrId,
  listCatalogCategories,
  queryProducts,
} from "@/lib/catalog/catalog-repository";
import { resolveCountryCurrency } from "@/lib/data/pricing";

export async function cachedListCategories(
  _params?: CategoryListParams,
  options?: { locale?: string; country?: string; currency?: string },
) {
  const currency =
    options?.currency ||
    (options?.country ? resolveCountryCurrency(options.country) : "USD");
  const categories = await listCatalogCategories(currency);
  return {
    data: categories,
    meta: { count: categories.length, total_count: categories.length },
  };
}

export async function getCategories(
  params?: CategoryListParams,
  options?: { locale?: string; country?: string; currency?: string },
) {
  return cachedListCategories(params, options);
}

export async function cachedGetCategory(
  idOrPermalink: string,
  _params?: { expand?: string[] },
  options?: { locale?: string; country?: string; currency?: string },
) {
  const currency =
    options?.currency ||
    (options?.country ? resolveCountryCurrency(options.country) : "USD");
  const local = await getCategoryByPermalinkOrId(idOrPermalink, currency);
  if (local) {
    return local as Category;
  }
  throw new Error(`Category not found: ${idOrPermalink}`);
}

export async function getCategory(
  idOrPermalink: string,
  params?: { expand?: string[]; currency?: string; country?: string },
) {
  return cachedGetCategory(
    idOrPermalink,
    params,
    params?.currency || params?.country
      ? { currency: params.currency, country: params.country }
      : undefined,
  );
}

/**
 * Category products fetch. Resolves directly from authoritative snapshot in-process.
 */
export async function cachedListCategoryProducts(
  categoryId: string,
  params?: ProductListParams,
  options?: { locale?: string; country?: string; currency?: string },
) {
  const currency =
    options?.currency ||
    (typeof params?.currency === "string" ? params.currency : undefined) ||
    (options?.country ? resolveCountryCurrency(options.country) : "USD");

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
    currency,
  });
  return result as unknown as PaginatedResponse<Product>;
}

export async function getCategoryProducts(
  categoryId: string,
  params?: ProductListParams,
) {
  const currency = typeof params?.currency === "string" ? params.currency : undefined;
  return cachedListCategoryProducts(
    categoryId,
    params,
    currency ? { currency } : undefined,
  );
}

