import type { NextRequest, NextResponse } from "next/server";
import type { Surface } from "./surface";

/**
 * Isolated Legacy Cookie Migration Bridge
 *
 * This module is the SOLE authoritative location in the entire codebase
 * where legacy Spree cookie string literals are permitted to exist.
 *
 * It provides:
 * 1. Continuity for existing guest carts (reads new cookie first, falls back to legacy).
 * 2. Atomic migration: copies existing legacy token/id to new Mirza cookies without
 *    generating replacement tokens.
 * 3. Expiry of legacy cart and locale cookies after migration.
 * 4. Immediate expiry (never migration) of legacy auth tokens (_spree_jwt, _spree_refresh_token).
 *
 * This bridge can be safely retired after one full cart TTL (30 days) has elapsed
 * following production deployment.
 */

// --- New First-Party Cookie Names ---
export const MIRZA_CART_TOKEN_COOKIE = "_mirza_cart_token";
export const MIRZA_CART_ID_COOKIE = "_mirza_cart_id";
export const MIRZA_WHOLESALE_CART_TOKEN_COOKIE = "_mirza_wholesale_cart_token";
export const MIRZA_WHOLESALE_CART_ID_COOKIE = "_mirza_wholesale_cart_id";
export const MIRZA_COUNTRY_COOKIE = "mirza_country";
export const MIRZA_LOCALE_COOKIE = "mirza_locale";

// --- Isolated Legacy Cookie Names (Strictly Confined Here) ---
export const LEGACY_CART_TOKEN_COOKIE = "_spree_cart_token";
export const LEGACY_CART_ID_COOKIE = "_spree_cart_token_id";
export const LEGACY_WHOLESALE_CART_TOKEN_COOKIE = "_spree_wholesale_cart_token";
export const LEGACY_WHOLESALE_CART_ID_COOKIE = "_spree_wholesale_cart_token_id";
export const LEGACY_COUNTRY_COOKIE = "spree_country";
export const LEGACY_LOCALE_COOKIE = "spree_locale";
export const LEGACY_ACCESS_TOKEN_COOKIE = "_spree_jwt";
export const LEGACY_REFRESH_TOKEN_COOKIE = "_spree_refresh_token";

export const CART_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface CookieReader {
  get(name: string): { value: string } | undefined;
}

/**
 * Resolve cart token: checks new cookie name first, falls back to legacy.
 */
export function resolveCartToken(
  reader: CookieReader,
  surface: Surface,
): string | undefined {
  if (surface === "wholesale") {
    return (
      reader.get(MIRZA_WHOLESALE_CART_TOKEN_COOKIE)?.value ||
      reader.get(LEGACY_WHOLESALE_CART_TOKEN_COOKIE)?.value
    );
  }
  return (
    reader.get(MIRZA_CART_TOKEN_COOKIE)?.value ||
    reader.get(LEGACY_CART_TOKEN_COOKIE)?.value
  );
}

/**
 * Resolve cart ID: checks new cookie name first, falls back to legacy.
 */
export function resolveCartId(
  reader: CookieReader,
  surface: Surface,
): string | undefined {
  if (surface === "wholesale") {
    return (
      reader.get(MIRZA_WHOLESALE_CART_ID_COOKIE)?.value ||
      reader.get(LEGACY_WHOLESALE_CART_ID_COOKIE)?.value
    );
  }
  return (
    reader.get(MIRZA_CART_ID_COOKIE)?.value ||
    reader.get(LEGACY_CART_ID_COOKIE)?.value
  );
}

/**
 * Resolve country: checks new cookie name first, falls back to legacy.
 */
export function resolveCountry(reader: CookieReader): string | undefined {
  return (
    reader.get(MIRZA_COUNTRY_COOKIE)?.value ||
    reader.get(LEGACY_COUNTRY_COOKIE)?.value
  );
}

/**
 * Resolve locale: checks new cookie name first, falls back to legacy.
 */
export function resolveLocale(reader: CookieReader): string | undefined {
  return (
    reader.get(MIRZA_LOCALE_COOKIE)?.value ||
    reader.get(LEGACY_LOCALE_COOKIE)?.value
  );
}

/**
 * Migrates legacy cart cookies to new first-party cookies when present in request.
 * Copies token and id as an atomic pair with 30-day TTL, then expires the legacy cookies.
 * Does not set cookies if new ones are already present.
 */
export function migrateLegacyCartCookies(
  request: NextRequest,
  response: NextResponse,
): boolean {
  let migrated = false;
  const isProd = process.env.NODE_ENV === "production";
  const cookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: CART_TOKEN_MAX_AGE,
  };
  const expireOpts = { maxAge: -1, path: "/" };

  // 1. DTC surface migration
  const hasNewDtcToken = request.cookies.has(MIRZA_CART_TOKEN_COOKIE);
  const hasNewDtcId = request.cookies.has(MIRZA_CART_ID_COOKIE);
  const legacyDtcToken = request.cookies.get(LEGACY_CART_TOKEN_COOKIE)?.value;
  const legacyDtcId = request.cookies.get(LEGACY_CART_ID_COOKIE)?.value;

  if ((!hasNewDtcToken || !hasNewDtcId) && (legacyDtcToken || legacyDtcId)) {
    if (legacyDtcId) {
      response.cookies.set(MIRZA_CART_ID_COOKIE, legacyDtcId, cookieOpts);
    }
    if (legacyDtcToken) {
      response.cookies.set(MIRZA_CART_TOKEN_COOKIE, legacyDtcToken, cookieOpts);
    }
    response.cookies.set(LEGACY_CART_TOKEN_COOKIE, "", expireOpts);
    response.cookies.set(LEGACY_CART_ID_COOKIE, "", expireOpts);
    migrated = true;
  }

  // 2. Wholesale surface migration
  const hasNewWholesaleToken = request.cookies.has(
    MIRZA_WHOLESALE_CART_TOKEN_COOKIE,
  );
  const hasNewWholesaleId = request.cookies.has(MIRZA_WHOLESALE_CART_ID_COOKIE);
  const legacyWholesaleToken = request.cookies.get(
    LEGACY_WHOLESALE_CART_TOKEN_COOKIE,
  )?.value;
  const legacyWholesaleId = request.cookies.get(
    LEGACY_WHOLESALE_CART_ID_COOKIE,
  )?.value;

  if (
    (!hasNewWholesaleToken || !hasNewWholesaleId) &&
    (legacyWholesaleToken || legacyWholesaleId)
  ) {
    if (legacyWholesaleId) {
      response.cookies.set(
        MIRZA_WHOLESALE_CART_ID_COOKIE,
        legacyWholesaleId,
        cookieOpts,
      );
    }
    if (legacyWholesaleToken) {
      response.cookies.set(
        MIRZA_WHOLESALE_CART_TOKEN_COOKIE,
        legacyWholesaleToken,
        cookieOpts,
      );
    }
    response.cookies.set(LEGACY_WHOLESALE_CART_TOKEN_COOKIE, "", expireOpts);
    response.cookies.set(LEGACY_WHOLESALE_CART_ID_COOKIE, "", expireOpts);
    migrated = true;
  }

  return migrated;
}

/**
 * Expire legacy auth cookies immediately.
 * Supabase Auth is authoritative; legacy tokens must never be migrated or trusted.
 */
export function expireLegacyAuthCookies(
  response: NextResponse,
  request?: NextRequest,
): void {
  const expireOpts = { maxAge: -1, path: "/" };
  response.cookies.set(LEGACY_ACCESS_TOKEN_COOKIE, "", expireOpts);
  response.cookies.set(LEGACY_REFRESH_TOKEN_COOKIE, "", expireOpts);

  if (request) {
    request.cookies.delete(LEGACY_ACCESS_TOKEN_COOKIE);
    request.cookies.delete(LEGACY_REFRESH_TOKEN_COOKIE);
  }
}

/**
 * Expire legacy country/locale cookies when new neutral cookies are set.
 */
export function expireLegacyLocaleCookies(
  response: NextResponse,
  request?: NextRequest,
): void {
  const expireOpts = { maxAge: -1, path: "/" };
  response.cookies.set(LEGACY_COUNTRY_COOKIE, "", expireOpts);
  response.cookies.set(LEGACY_LOCALE_COOKIE, "", expireOpts);

  if (request) {
    request.cookies.delete(LEGACY_COUNTRY_COOKIE);
    request.cookies.delete(LEGACY_LOCALE_COOKIE);
  }
}
