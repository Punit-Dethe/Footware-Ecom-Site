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
  options: LocaleOptions,
): Promise<number> {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("sitemap", resource, `sitemap-market:${marketId}`);

  try {
    const response =
      resource === "products"
        ? await getClient().products.list({ page: 1, limit: 1 }, options)
        : await getClient().categories.list(
            { page: 1, limit: 1, parent_id_not_null: true },
            options,
          );

    return Math.max(0, response.meta.count);
  } catch (_error) {
    if (resource === "products") {
      const res = await queryProducts({ limit: 1 });
      return res.meta.total_count;
    } else {
      const cats = await listCatalogCategories();
      return cats.length;
    }
  }
}

export async function getSitemapProductPage(
  marketId: string,
  page: number,
  limit: number,
  options: LocaleOptions,
): Promise<SitemapProduct[]> {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("sitemap", "products", `sitemap-market:${marketId}`);
  try {
    const response = await getClient().products.list(
      { page, limit, expand: ["media"] },
      options,
    );
    return response.data as SitemapProduct[];
  } catch (_error) {
    const res = await queryProducts({ page, limit });
    return res.data as unknown as SitemapProduct[];
  }
}

export async function getSitemapCategoryPage(
  marketId: string,
  page: number,
  limit: number,
  options: LocaleOptions,
): Promise<SitemapCategory[]> {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("sitemap", "categories", `sitemap-market:${marketId}`);
  try {
    const response = await getClient().categories.list(
      { page, limit, parent_id_not_null: true },
      options,
    );
    return response.data;
  } catch (_error) {
    const cats = await listCatalogCategories();
    return cats as unknown as SitemapCategory[];
  }
}
