import type { DbVariantPriceRow } from "@/lib/db/catalog";

export const SUPPORTED_CURRENCIES = ["USD", "INR"] as const;
export type StoreCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Resolves the authoritative storefront currency for a given country ISO code.
 * - 'in' -> 'INR'
 * - 'us' -> 'USD'
 * - Default -> 'USD'
 */
export function resolveCountryCurrency(country?: string): StoreCurrency {
  const code = country?.toLowerCase();
  if (code === "in") return "INR";
  return "USD";
}

export class PriceResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PriceResolutionError";
  }
}

/**
 * Validates if a currency string is a configured, supported storefront currency.
 */
export function isSupportedCurrency(currency: string): currency is StoreCurrency {
  return SUPPORTED_CURRENCIES.includes(currency?.toUpperCase() as StoreCurrency);
}

/**
 * Authoritative variant price resolution.
 * - Requires uppercase ISO currency
 * - Only configured storefront currencies (USD, INR)
 * - Missing price => FAIL CLOSED (never falls back to another currency, never relabels, never returns 0)
 */
export function resolveVariantPrice(
  prices: DbVariantPriceRow[] | undefined,
  currency: string,
): DbVariantPriceRow | null {
  if (!currency) {
    throw new PriceResolutionError("Cannot resolve price without currency");
  }

  const targetCurrency = currency.toUpperCase();
  if (!isSupportedCurrency(targetCurrency)) {
    throw new PriceResolutionError(
      `Unsupported market currency '${currency}'. Supported: ${SUPPORTED_CURRENCIES.join(", ")}`,
    );
  }

  if (!prices || prices.length === 0) {
    return null;
  }

  const match = prices.find((p) => p.currency.toUpperCase() === targetCurrency);
  if (!match) {
    return null;
  }

  if (typeof match.price_in_cents !== "number" || match.price_in_cents < 0) {
    throw new PriceResolutionError(
      `Invalid price amount ${match.price_in_cents} for currency '${targetCurrency}'`,
    );
  }

  return match;
}

/**
 * Currency-aware money formatting using Intl.NumberFormat.
 * Uses locale-sensitive formatting:
 * - USD -> 'en-US' ($285.00)
 * - INR -> 'en-IN' (₹24,999.00)
 */
export function formatMoney(
  cents: number,
  currency = "USD",
  locale?: string,
): string {
  const targetCurrency = (currency || "USD").toUpperCase();
  const targetLocale =
    locale || (targetCurrency === "INR" ? "en-IN" : "en-US");
  const amount = (cents || 0) / 100;

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: "currency",
      currency: targetCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${targetCurrency} ${amount.toFixed(2)}`;
  }
}

/**
 * Formats a zero-cent amount for taxes, shipping, or discounts in a currency-aware format.
 */
export function formatZeroMoney(currency = "USD", locale?: string): string {
  return formatMoney(0, currency, locale);
}
