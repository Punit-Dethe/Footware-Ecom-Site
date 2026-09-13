import { cookies } from "next/headers";
import {
  resolveCountry,
  resolveLocale,
} from "./legacy-cookie-migration";

const DEFAULT_COUNTRY = "us";
const DEFAULT_LOCALE = "en";

/**
 * Read locale/country from cookies (set by middleware).
 * Checks new mirza_* cookies first with fallback to legacy bridge.
 * Falls back to store defaults during prerendering.
 */
export async function getLocaleOptions(): Promise<{
  locale?: string;
  country?: string;
}> {
  try {
    const cookieStore = await cookies();

    const country = resolveCountry(cookieStore);
    const locale = resolveLocale(cookieStore);

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
