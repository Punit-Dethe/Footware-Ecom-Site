"use server";

import type { Country, Market } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { COUNTRIES, MARKETS } from "@/lib/catalog/catalog-repository";
import { getClient, getLocaleOptions } from "@/lib/spree";

async function cachedListMarkets(options: {
  locale?: string;
  country?: string;
}) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("markets");
  try {
    return await getClient().markets.list(options);
  } catch (_error) {
    return { data: MARKETS as unknown as Market[] };
  }
}

async function cachedResolveMarket(
  country: string,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("resolved-market");
  try {
    return await getClient().markets.resolve(country, options);
  } catch (_error) {
    const found =
      MARKETS.find((m) => m.code === country.toLowerCase()) || MARKETS[0];
    return found as unknown as Market;
  }
}

async function cachedListMarketCountries(
  marketId: string,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("market-countries");
  try {
    return await getClient().markets.countries.list(marketId, options);
  } catch (_error) {
    return { data: COUNTRIES as unknown as Country[] };
  }
}

export async function getMarkets(options?: {
  locale?: string;
  country?: string;
}): Promise<{ data: Market[] }> {
  const resolvedOptions = options ?? (await getLocaleOptions());
  return cachedListMarkets(resolvedOptions);
}

export async function resolveMarket(country: string) {
  const options = await getLocaleOptions();
  return cachedResolveMarket(country, options);
}

export async function getMarketCountries(marketId: string) {
  const options = await getLocaleOptions();
  return cachedListMarketCountries(marketId, options);
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
