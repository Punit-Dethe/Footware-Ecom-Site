"use server";

import { COUNTRIES, MARKETS } from "@/lib/catalog/store-config";
import type { Country, Market } from "@/types/commerce";

export async function getMarkets(_options?: {
  locale?: string;
  country?: string;
}): Promise<{ data: Market[] }> {
  return { data: MARKETS as Market[] };
}

export async function resolveMarket(country: string): Promise<Market> {
  const found =
    MARKETS.find((m) => m.code === country.toLowerCase()) || MARKETS[0];
  return found as Market;
}

export async function getMarketCountries(_marketId?: string): Promise<{ data: Country[] }> {
  return { data: COUNTRIES as Country[] };
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
