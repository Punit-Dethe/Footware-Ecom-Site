import { cookies } from "next/headers";

const DEFAULT_COUNTRY_COOKIE = "spree_country";
const DEFAULT_LOCALE_COOKIE = "spree_locale";
const DEFAULT_COUNTRY = "us";
const DEFAULT_LOCALE = "en";

/**
 * Read locale/country from cookies (set by middleware).
 * Falls back to defaults.
 */
export async function getLocaleOptions(): Promise<{
  locale?: string;
  country?: string;
}> {
  try {
    const cookieStore = await cookies();

    const country = cookieStore.get(DEFAULT_COUNTRY_COOKIE)?.value;
    const locale = cookieStore.get(DEFAULT_LOCALE_COOKIE)?.value;

    return {
      locale: locale || DEFAULT_LOCALE,
      country: country || DEFAULT_COUNTRY,
    };
  } catch {
    // During prerendering, cookies() rejects — fall back to defaults
    return {
      locale: DEFAULT_LOCALE,
      country: DEFAULT_COUNTRY,
    };
  }
}
