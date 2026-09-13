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
 * 2. Atomic namespace-level resolution: cart ID and token are resolved together from ONE
 *    namespace (Mirza if ANY new cookie exists, else legacy). Never mixes fields across namespaces.
 * 3. Atomic migration: copies existing legacy token/id to new Mirza cookies without
 *    generating replacement tokens.
 * 4. Expiry of legacy cart and locale cookies after migration or new writes.
 * 5. Immediate expiry (never migration) of legacy auth tokens (_spree_jwt, _spree_refresh_token).
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

export interface CookieWriter {
  set(name: string, value: string, options?: Record<string, unknown>): void;
}

export type CartCookieSource = "mirza" | "legacy" | "none";

export interface ResolvedCartCookieState {
  id?: string;
  token?: string;
  source: CartCookieSource;
}

/**
 * Resolves cart ID and token from a single authoritative namespace.
 *
 * Invariant:
 * If ANY new cart cookie exists on the surface (id or token), the Mirza namespace
 * is authoritative. ID and token are read solely from Mirza, and missing members
 * are never filled from legacy.
 *
 * If no new cart cookies exist, the legacy namespace is consulted.
 *
 * This guarantees a cart state never combines a new ID with a legacy token, or vice versa.
 */
export function resolveCartCookieState(
  reader: CookieReader,
  surface: Surface,
): ResolvedCartCookieState {
  const isWholesale = surface === "wholesale";
  const newIdName = isWholesale
    ? MIRZA_WHOLESALE_CART_ID_COOKIE
    : MIRZA_CART_ID_COOKIE;
  const newTokenName = isWholesale
    ? MIRZA_WHOLESALE_CART_TOKEN_COOKIE
    : MIRZA_CART_TOKEN_COOKIE;
  const legacyIdName = isWholesale
    ? LEGACY_WHOLESALE_CART_ID_COOKIE
    : LEGACY_CART_ID_COOKIE;
  const legacyTokenName = isWholesale
    ? LEGACY_WHOLESALE_CART_TOKEN_COOKIE
    : LEGACY_CART_TOKEN_COOKIE;

  const newId = reader.get(newIdName)?.value;
  const newToken = reader.get(newTokenName)?.value;

  if (newId !== undefined || newToken !== undefined) {
    return {
      id: newId,
      token: newToken,
      source: "mirza",
    };
  }

  const legacyId = reader.get(legacyIdName)?.value;
  const legacyToken = reader.get(legacyTokenName)?.value;

  if (legacyId !== undefined || legacyToken !== undefined) {
    return {
      id: legacyId,
      token: legacyToken,
      source: "legacy",
    };
  }

  return {
    id: undefined,
    token: undefined,
    source: "none",
  };
}

/**
 * Resolve cart token: reads from authoritative namespace via resolveCartCookieState.
 */
export function resolveCartToken(
  reader: CookieReader,
  surface: Surface,
): string | undefined {
  return resolveCartCookieState(reader, surface).token;
}

/**
 * Resolve cart ID: reads from authoritative namespace via resolveCartCookieState.
 */
export function resolveCartId(
  reader: CookieReader,
  surface: Surface,
): string | undefined {
  return resolveCartCookieState(reader, surface).id;
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
 *
 * Rules:
 * 1. When no new cart cookies exist:
 *    - copy legacy ID if present
 *    - copy legacy token if present
 *    - use exact values, generate nothing
 *    - expire the legacy namespace
 * 2. When ANY new cart cookie exists:
 *    - do NOT copy individual legacy values into the new namespace
 *    - new namespace wins
 *    - legacy cookies are expired to eliminate ambiguity
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
  const hasAnyNewDtc =
    request.cookies.has(MIRZA_CART_ID_COOKIE) ||
    request.cookies.has(MIRZA_CART_TOKEN_COOKIE);
  const legacyDtcId = request.cookies.get(LEGACY_CART_ID_COOKIE)?.value;
  const legacyDtcToken = request.cookies.get(LEGACY_CART_TOKEN_COOKIE)?.value;
  const hasAnyLegacyDtc =
    legacyDtcId !== undefined || legacyDtcToken !== undefined;

  if (!hasAnyNewDtc && hasAnyLegacyDtc) {
    if (legacyDtcId) {
      response.cookies.set(MIRZA_CART_ID_COOKIE, legacyDtcId, cookieOpts);
    }
    if (legacyDtcToken) {
      response.cookies.set(MIRZA_CART_TOKEN_COOKIE, legacyDtcToken, cookieOpts);
    }
    response.cookies.set(LEGACY_CART_TOKEN_COOKIE, "", expireOpts);
    response.cookies.set(LEGACY_CART_ID_COOKIE, "", expireOpts);
    migrated = true;
  } else if (hasAnyNewDtc && hasAnyLegacyDtc) {
    response.cookies.set(LEGACY_CART_TOKEN_COOKIE, "", expireOpts);
    response.cookies.set(LEGACY_CART_ID_COOKIE, "", expireOpts);
    migrated = true;
  }

  // 2. Wholesale surface migration
  const hasAnyNewWholesale =
    request.cookies.has(MIRZA_WHOLESALE_CART_ID_COOKIE) ||
    request.cookies.has(MIRZA_WHOLESALE_CART_TOKEN_COOKIE);
  const legacyWholesaleId = request.cookies.get(
    LEGACY_WHOLESALE_CART_ID_COOKIE,
  )?.value;
  const legacyWholesaleToken = request.cookies.get(
    LEGACY_WHOLESALE_CART_TOKEN_COOKIE,
  )?.value;
  const hasAnyLegacyWholesale =
    legacyWholesaleId !== undefined || legacyWholesaleToken !== undefined;

  if (!hasAnyNewWholesale && hasAnyLegacyWholesale) {
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
  } else if (hasAnyNewWholesale && hasAnyLegacyWholesale) {
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

/**
 * Returns true if incoming request holds any legacy auth cookies.
 */
export function hasLegacyAuthCookies(
  reader: CookieReader | { cookies: { has(name: string): boolean } },
): boolean {
  if ("cookies" in reader && typeof reader.cookies?.has === "function") {
    return (
      reader.cookies.has(LEGACY_ACCESS_TOKEN_COOKIE) ||
      reader.cookies.has(LEGACY_REFRESH_TOKEN_COOKIE)
    );
  }
  const r = reader as CookieReader;
  return !!(
    r.get(LEGACY_ACCESS_TOKEN_COOKIE)?.value ||
    r.get(LEGACY_REFRESH_TOKEN_COOKIE)?.value
  );
}

/**
 * Returns true if incoming request holds any legacy country/locale cookies.
 */
export function hasLegacyLocaleCookies(
  reader: CookieReader | { cookies: { has(name: string): boolean } },
): boolean {
  if ("cookies" in reader && typeof reader.cookies?.has === "function") {
    return (
      reader.cookies.has(LEGACY_COUNTRY_COOKIE) ||
      reader.cookies.has(LEGACY_LOCALE_COOKIE)
    );
  }
  const r = reader as CookieReader;
  return !!(
    r.get(LEGACY_COUNTRY_COOKIE)?.value ||
    r.get(LEGACY_LOCALE_COOKIE)?.value
  );
}

/**
 * Returns true if incoming request holds any legacy cart cookies for the surface.
 */
export function hasLegacyCartCookies(
  reader: CookieReader | { cookies: { has(name: string): boolean } },
  surface: Surface,
): boolean {
  const isWholesale = surface === "wholesale";
  const idName = isWholesale
    ? LEGACY_WHOLESALE_CART_ID_COOKIE
    : LEGACY_CART_ID_COOKIE;
  const tokenName = isWholesale
    ? LEGACY_WHOLESALE_CART_TOKEN_COOKIE
    : LEGACY_CART_TOKEN_COOKIE;

  if ("cookies" in reader && typeof reader.cookies?.has === "function") {
    return reader.cookies.has(idName) || reader.cookies.has(tokenName);
  }
  const r = reader as CookieReader;
  return !!(r.get(idName)?.value || r.get(tokenName)?.value);
}

/**
 * Idempotently and unconditionally expires the legacy cart cookie pair (ID + token)
 * for a surface on a writable cookie store.
 */
export function clearLegacyCartCookies(
  writer: CookieWriter,
  surface: Surface,
): void {
  const isWholesale = surface === "wholesale";
  const idName = isWholesale
    ? LEGACY_WHOLESALE_CART_ID_COOKIE
    : LEGACY_CART_ID_COOKIE;
  const tokenName = isWholesale
    ? LEGACY_WHOLESALE_CART_TOKEN_COOKIE
    : LEGACY_CART_TOKEN_COOKIE;
  const expireOpts = { maxAge: -1, path: "/" };
  writer.set(idName, "", expireOpts);
  writer.set(tokenName, "", expireOpts);
}

/**
 * Idempotently expires only the legacy cart token for a surface on a writable cookie store.
 */
export function clearLegacyCartToken(
  writer: CookieWriter,
  surface: Surface,
): void {
  const isWholesale = surface === "wholesale";
  const tokenName = isWholesale
    ? LEGACY_WHOLESALE_CART_TOKEN_COOKIE
    : LEGACY_CART_TOKEN_COOKIE;
  const expireOpts = { maxAge: -1, path: "/" };
  writer.set(tokenName, "", expireOpts);
}
