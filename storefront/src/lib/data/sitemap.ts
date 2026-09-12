"use server";

import type { Category, Media, Product } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { getClient } from "@/lib/spree";
import {
  listCatalogCategories,
  queryProducts,
} from "@/lib/catalog/catalog-repository";
import { MARKETS } from "@/lib/catalog/store-config";

interface LocaleOptions {
  locale: string;
  country: string;
}

export type SitemapProduct = Product & {
  media?: Media[];
  updated_at?: string;
};

export type SitemapCategory = Category & {
  updated_at?: string;
};

export type SitemapResource = "products" | "categories";

export async function getSitemapMarkets(options: LocaleOptions) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("markets", "sitemap");
  try {
    return (await getClient().markets.list(options)).data;
  } catch (_error) {
    return MARKETS as unknown as ReturnType<ReturnType<typeof getClient>["markets"]["list"]> extends Promise<{ data: infer D }> ? D : never;
  }
}

export async function getSitemapResourceCount(
  resource: SitemapResource,
  marketId: string,
  _options: LocaleOptions,
): Promise<number> {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("catalog-public", "sitemap", resource, `sitemap-market:${marketId}`);

  if (resource === "products") {
    const res = await queryProducts({ page: 1, limit: 1 });
    return res.meta.total_count;
  } else {
    const cats = await listCatalogCategories();
    return cats.length;
  }
}

export async function getSitemapProductPage(
  marketId: string,
  page: number,
  limit: number,
  _options: LocaleOptions,
): Promise<SitemapProduct[]> {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("catalog-public", "sitemap", "products", `sitemap-market:${marketId}`);

  const res = await queryProducts({ page, limit });
  return res.data as unknown as SitemapProduct[];
}

export async function getSitemapCategoryPage(
  marketId: string,
  page: number,
  limit: number,
  _options: LocaleOptions,
): Promise<SitemapCategory[]> {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("catalog-public", "sitemap", "categories", `sitemap-market:${marketId}`);

  const categories = await listCatalogCategories();
  const start = (page - 1) * limit;
  return categories.slice(start, start + limit) as unknown as SitemapCategory[];
}
