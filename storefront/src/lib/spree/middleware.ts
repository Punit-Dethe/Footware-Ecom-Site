import { type NextRequest, NextResponse } from "next/server";
import {
  canonicalizeLocale,
  matchLocale,
  negotiateAcceptLanguage,
  negotiateLocale,
} from "@/i18n/normalize";
import { REQUEST_PATHNAME_HEADER, REQUEST_SEARCH_HEADER } from "@/i18n/routing";
import { CACHE_POLICIES, resolveRouteCachePolicy } from "@/lib/cache/cache-policy";
import { verifyProxySession } from "@/lib/supabase/proxy";
import { buildAccountLoginHref } from "@/lib/utils/account-redirect";

/**
 * Copies cookies set on the Supabase proxy response onto a target response (including redirects).
 * Ensures cookie rotation/clearing is preserved across redirects and locale context composition.
 */
function copySupabaseResponseCookies(
  source: NextResponse,
  target: NextResponse,
): void {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
}

const COUNTRY_COOKIE = "spree_country";
const LOCALE_COOKIE = "spree_locale";
const LEGACY_ACCESS_TOKEN_COOKIE = "_spree_jwt";
const LEGACY_REFRESH_TOKEN_COOKIE = "_spree_refresh_token";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

const HAS_COUNTRY_LOCALE =
  /^\/([a-z]{2})\/([a-z]{2,3}(?:-[a-z0-9]{2,8})*)(\/|$)/i;

export interface SpreeMiddlewareConfig {
  /** Default country ISO code (default: 'us') */
  defaultCountry?: string;
  /** Default locale code (default: 'en') */
  defaultLocale?: string;
  /** Locale codes for which the storefront has message bundles. */
  supportedLocales?: readonly string[];
  /** Routes to skip — prefixes matched with startsWith (default: ['/_next', '/api', '/favicon.ico']) */
  staticRoutes?: string[];
  /** JWT cookie used to identify a potentially authenticated account request. */
  accessTokenCookieName?: string;
  /** Refresh-token cookie used to preserve recoverable account sessions. */
  refreshTokenCookieName?: string;
}

const PUBLIC_ACCOUNT_PATHS = new Set([
  "/account",
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
]);

function isAuthConsumingRoute(pathname: string, localizedPrefix: string): boolean {
  const localizedPath = pathname.slice(localizedPrefix.length);
  const normalizedPath = localizedPath.replace(/\/+$/, "") || "/";

  return (
    normalizedPath === "/account" ||
    normalizedPath.startsWith("/account/") ||
    normalizedPath === "/checkout" ||
    normalizedPath.startsWith("/checkout/") ||
    normalizedPath === "/wholesale" ||
    normalizedPath.startsWith("/wholesale/")
  );
}

function isProtectedAccountPath(pathname: string, localizedPrefix: string) {
  const localizedPath = pathname.slice(localizedPrefix.length);
  const normalizedPath = localizedPath.replace(/\/+$/, "") || "/";

  return (
    normalizedPath.startsWith("/account/") &&
    !PUBLIC_ACCOUNT_PATHS.has(normalizedPath)
  );
}

/**
 * Set spree_country / spree_locale cookies on a response so that
 * `getLocaleOptions()` reads values matching the URL during SSR.
 */
function setLocaleCookies(
  response: NextResponse,
  country: string,
  locale: string,
): void {
  response.cookies.set(COUNTRY_COOKIE, country, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

function clearLegacySpreeCookies(
  response: NextResponse,
  request?: NextRequest,
): void {
  response.cookies.set(LEGACY_ACCESS_TOKEN_COOKIE, "", {
    maxAge: -1,
    path: "/",
  });
  response.cookies.set(LEGACY_REFRESH_TOKEN_COOKIE, "", {
    maxAge: -1,
    path: "/",
  });
  if (request) {
    request.cookies.delete(LEGACY_ACCESS_TOKEN_COOKIE);
    request.cookies.delete(LEGACY_REFRESH_TOKEN_COOKIE);
  }
}

function nextWithLocaleContext(
  request: NextRequest,
  country: string,
  locale: string,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_PATHNAME_HEADER, request.nextUrl.pathname);
  requestHeaders.set(REQUEST_SEARCH_HEADER, request.nextUrl.search);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Apply explicit canonical Data Freshness Class Cache-Control headers
  response.headers.set(
    "Cache-Control",
    resolveRouteCachePolicy(request.nextUrl.pathname),
  );

  // Only set cookies when the incoming request does not already match.
  // This avoids emitting redundant Set-Cookie headers on every page view,
  // allowing upstream CDNs (Vercel, Cloudflare) to cache catalog responses cleanly.
  const currentCountry = request.cookies.get(COUNTRY_COOKIE)?.value;
  const currentLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (currentCountry !== country || currentLocale !== locale) {
    setLocaleCookies(response, country, locale);
  }
  return response;
}

/**
 * Creates a Next.js middleware that handles:
 * - Redirecting bare paths to /{country}/{locale}/...
 * - Detecting country from cookies → geo headers → default
 * - Detecting locale from cookies → accept-language → default
 * - Syncing spree_country / spree_locale cookies with URL segments so
 *   server-side data fetching (via `getLocaleOptions()`) uses the correct market
 * - Guarding protected account routes via Supabase verified claims
 * - Ensuring token refresh responses are not publicly cached
 */
export function createSpreeMiddleware(
  config: SpreeMiddlewareConfig = {},
): (request: NextRequest) => Promise<NextResponse> {
  const defaultCountry = config.defaultCountry ?? "us";
  const supportedLocales = config.supportedLocales ?? [];
  const configuredDefaultLocale = config.defaultLocale ?? "en";
  const defaultLocale =
    (supportedLocales.length > 0
      ? (matchLocale(configuredDefaultLocale, supportedLocales) ??
        matchLocale("en", supportedLocales) ??
        supportedLocales[0])
      : canonicalizeLocale(configuredDefaultLocale)) ?? "en";
  const staticRoutes = config.staticRoutes ?? [
    "/_next",
    "/api",
    "/auth",
    "/dev",
    "/favicon.ico",
  ];

  return async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    // Skip static routes (including global auth callbacks /auth/...)
    if (staticRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Skip if pathname contains a file extension (static assets)
    if (/\.\w+$/.test(pathname)) {
      return NextResponse.next();
    }

    // Already has /{country}/{locale} prefix — sync cookies with URL segments
    const match = pathname.match(HAS_COUNTRY_LOCALE);
    if (match) {
      const country = match[1].toLowerCase();
      const originalPrefix = `/${match[1]}/${match[2]}`;
      const locale =
        supportedLocales.length > 0
          ? negotiateLocale(match[2], supportedLocales)
          : canonicalizeLocale(match[2]);

      // An unknown locale cannot safely retain the requested country: the
      // global default locale may not be enabled by that country's Market.
      // Use the configured default route while preserving the remaining path.
      if (!locale) {
        const url = request.nextUrl.clone();
        url.pathname = `/${defaultCountry}/${defaultLocale}${pathname.slice(originalPrefix.length)}`;
        const response = NextResponse.redirect(url);
        setLocaleCookies(response, defaultCountry, defaultLocale);
        return response;
      }

      const canonicalPrefix = `/${country}/${locale}`;

      if (originalPrefix !== canonicalPrefix) {
        const url = request.nextUrl.clone();
        url.pathname = `${canonicalPrefix}${pathname.slice(originalPrefix.length)}`;
        const response = NextResponse.redirect(url);
        setLocaleCookies(response, country, locale);
        return response;
      }

      if (isAuthConsumingRoute(pathname, canonicalPrefix)) {
        // 1. Run session verification/refresh FIRST so request.cookies are mutated before downstream response construction
        const authResult = await verifyProxySession(request);

        // Fail closed on transient auth service failure for protected account routes
        if (
          authResult.transientFailure &&
          isProtectedAccountPath(pathname, canonicalPrefix)
        ) {
          return new NextResponse("Authentication service temporarily unavailable", {
            status: 503,
            headers: {
              "Cache-Control": CACHE_POLICIES.PRIVATE_SESSION,
            },
          });
        }

        // 2. Protected account children strictly require a verified user
        if (
          isProtectedAccountPath(pathname, canonicalPrefix) &&
          !authResult.userId
        ) {
          const loginHref = buildAccountLoginHref(
            canonicalPrefix,
            `${pathname}${request.nextUrl.search}`,
          );
          const redirectResponse = NextResponse.redirect(
            new URL(loginHref, request.nextUrl),
          );
          setLocaleCookies(redirectResponse, country, locale);
          clearLegacySpreeCookies(redirectResponse);
          // Preserve any Supabase cookie rotation/clearing on redirect
          copySupabaseResponseCookies(authResult.response, redirectResponse);
          return redirectResponse;
        }

        // 3. Request cookies are now current. Construct final localized response from updated request
        const response = nextWithLocaleContext(request, country, locale);
        copySupabaseResponseCookies(authResult.response, response);

        if (
          request.cookies.has(LEGACY_ACCESS_TOKEN_COOKIE) ||
          request.cookies.has(LEGACY_REFRESH_TOKEN_COOKIE)
        ) {
          clearLegacySpreeCookies(response, request);
        }

        // Cache-Control invariants:
        // - Any response where Supabase wrote/rotated cookies: PRIVATE_SESSION
        // - Account routes: PRIVATE_SESSION
        // - Checkout routes: PRIVATE_SESSION
        // - Authenticated wholesale: PRIVATE_SESSION
        // - Anonymous wholesale with no cookie rotation: public catalog policy preserved
        const isAccount = pathname.startsWith(`${canonicalPrefix}/account`);
        const isCheckout = pathname.startsWith(`${canonicalPrefix}/checkout`);
        const isAuthWholesale =
          pathname.startsWith(`${canonicalPrefix}/wholesale`) &&
          Boolean(authResult.userId);

        if (
          authResult.cookiesRefreshed ||
          isAccount ||
          isCheckout ||
          isAuthWholesale
        ) {
          response.headers.set("Cache-Control", CACHE_POLICIES.PRIVATE_SESSION);
        }

        return response;
      }

      // Public catalog routes: bypass auth verification completely (0 auth overhead)
      const response = nextWithLocaleContext(request, country, locale);
      if (
        request.cookies.has(LEGACY_ACCESS_TOKEN_COOKIE) ||
        request.cookies.has(LEGACY_REFRESH_TOKEN_COOKIE)
      ) {
        clearLegacySpreeCookies(response, request);
      }
      return response;
    }

    // Detect country: cookie → geo headers → default
    const country =
      request.cookies.get(COUNTRY_COOKIE)?.value ??
      request.headers.get("x-vercel-ip-country")?.toLowerCase() ??
      request.headers.get("cf-ipcountry")?.toLowerCase() ??
      defaultCountry;

    // Detect locale: cookie → accept-language → default
    const cookieValue = request.cookies.get(LOCALE_COOKIE)?.value;
    const cookieLocale =
      supportedLocales.length > 0
        ? negotiateLocale(cookieValue, supportedLocales)
        : canonicalizeLocale(cookieValue);
    const acceptLanguage = request.headers.get("accept-language");
    const acceptedLocale =
      supportedLocales.length > 0
        ? negotiateAcceptLanguage(acceptLanguage, supportedLocales)
        : canonicalizeLocale(acceptLanguage?.split(",")[0]?.split(";")[0]);
    const locale = cookieLocale ?? acceptedLocale ?? defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${country}/${locale}${pathname === "/" ? "" : pathname}`;

    const response = NextResponse.redirect(url);
    setLocaleCookies(response, country, locale);
    return response;
  };
}
