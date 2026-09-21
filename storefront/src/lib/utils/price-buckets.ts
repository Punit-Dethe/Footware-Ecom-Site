export interface PriceBucket {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

const DEFAULT_THRESHOLDS = [50, 100, 200];
const INR_THRESHOLDS = [10000, 20000, 30000];

function formatCurrency(
  amount: number,
  currency: string,
  locale?: string,
): string {
  const normCurrency = (currency || "USD").toUpperCase();
  const targetLocale = locale || (normCurrency === "INR" ? "en-IN" : "en-US");
  try {
    return new Intl.NumberFormat(targetLocale, {
      style: "currency",
      currency: normCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${normCurrency} ${amount}`;
  }
}

/**
 * Optional translation helpers for bucket labels.
 * Pass `t` from `useTranslations("products")` and a locale string
 * to get labels like "Poniżej $50" instead of "Under $50".
 */
interface BucketLabelOptions {
  t?: (key: string, values?: Record<string, string>) => string;
  locale?: string;
}

export function generatePriceBuckets(
  filterMin: number,
  filterMax: number,
  currency: string,
  options?: BucketLabelOptions,
): PriceBucket[] {
  const { t, locale } = options || {};
  const normCurrency = (currency || "USD").toUpperCase();
  const thresholds = normCurrency === "INR" ? INR_THRESHOLDS : DEFAULT_THRESHOLDS;
  const buckets: PriceBucket[] = [];

  if (filterMin < thresholds[0]) {
    const price = formatCurrency(thresholds[0], normCurrency, locale);
    buckets.push({
      id: `under-${thresholds[0]}`,
      label: t ? t("priceUnder", { price }) : `Under ${price}`,
      max: thresholds[0],
    });
  }

  for (let i = 0; i < thresholds.length - 1; i++) {
    if (filterMax > thresholds[i] && filterMin < thresholds[i + 1]) {
      const min = formatCurrency(thresholds[i], normCurrency, locale);
      const max = formatCurrency(thresholds[i + 1], normCurrency, locale);
      buckets.push({
        id: `${thresholds[i]}-${thresholds[i + 1]}`,
        label: t ? t("priceRangeBucket", { min, max }) : `${min} - ${max}`,
        min: thresholds[i],
        max: thresholds[i + 1],
      });
    }
  }

  const lastThreshold = thresholds[thresholds.length - 1];
  if (filterMax > lastThreshold) {
    const price = formatCurrency(lastThreshold, normCurrency, locale);
    buckets.push({
      id: `${lastThreshold}-plus`,
      label: t ? t("priceAbove", { price }) : `${price}+`,
      min: lastThreshold,
    });
  }

  return buckets;
}

export function findMatchingBucket(
  buckets: PriceBucket[],
  priceMin?: number,
  priceMax?: number,
): PriceBucket | undefined {
  return buckets.find(
    (b) =>
      (b.min === undefined ? priceMin === undefined : b.min === priceMin) &&
      (b.max === undefined ? priceMax === undefined : b.max === priceMax),
  );
}
