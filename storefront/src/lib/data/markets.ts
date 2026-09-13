"use server";

import { cacheLife, cacheTag } from "next/cache";
import { COUNTRIES, MARKETS } from "@/lib/catalog/store-config";
import type { Country, Market } from "@/types/commerce";

async function cachedListMarkets(_options?: {
  locale?: string;
  country?: string;
}) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("markets");
  return { data: MARKETS as Market[] };
}

async function cachedResolveMarket(
  country: string,
  _options?: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("resolved-market");
  const found =
    MARKETS.find((m) => m.code === country.toLowerCase()) || MARKETS[0];
  return found as Market;
}

async function cachedListMarketCountries(
  _marketId: string,
  _options?: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("market-countries");
  return { data: COUNTRIES as Country[] };
}

export async function getMarkets(options?: {
  locale?: string;
  country?: string;
}): Promise<{ data: Market[] }> {
  return cachedListMarkets(options);
}

export async function resolveMarket(country: string) {
  return cachedResolveMarket(country);
}

export async function getMarketCountries(marketId: string) {
  return cachedListMarketCountries(marketId);
}

/**
 * Resolve the currency for a given country on the server side instantly.
 * Does not block critical visual rendering on commerce API market resolution.
 */
export async function resolveCurrency(
  country: string,
): Promise<string | undefined> {
  const iso = country?.toLowerCase();
  if (iso === "in") return "INR";
  if (iso === "us") return "USD";
  if (iso === "gb") return "GBP";
  if (iso === "eu" || iso === "de" || iso === "fr") return "EUR";
  return "USD";
}
