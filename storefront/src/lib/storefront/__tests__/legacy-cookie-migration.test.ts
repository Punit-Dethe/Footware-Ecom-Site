import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import {
  expireLegacyAuthCookies,
  expireLegacyLocaleCookies,
  LEGACY_ACCESS_TOKEN_COOKIE,
  LEGACY_CART_ID_COOKIE,
  LEGACY_CART_TOKEN_COOKIE,
  LEGACY_COUNTRY_COOKIE,
  LEGACY_LOCALE_COOKIE,
  LEGACY_REFRESH_TOKEN_COOKIE,
  LEGACY_WHOLESALE_CART_ID_COOKIE,
  LEGACY_WHOLESALE_CART_TOKEN_COOKIE,
  migrateLegacyCartCookies,
  MIRZA_CART_ID_COOKIE,
  MIRZA_CART_TOKEN_COOKIE,
  MIRZA_COUNTRY_COOKIE,
  MIRZA_LOCALE_COOKIE,
  MIRZA_WHOLESALE_CART_ID_COOKIE,
  MIRZA_WHOLESALE_CART_TOKEN_COOKIE,
  resolveCartId,
  resolveCartToken,
  resolveCountry,
  resolveLocale,
} from "../legacy-cookie-migration";

describe("Legacy Cookie Migration Bridge", () => {
  describe("1. Existing DTC guest cart continuity", () => {
    it("resolves legacy cart token and id when new cookies are absent", () => {
      const mockReader = {
        get: (name: string) => {
          if (name === LEGACY_CART_TOKEN_COOKIE) return { value: "legacy-cart-token-123" };
          if (name === LEGACY_CART_ID_COOKIE) return { value: "legacy-cart-id-456" };
          return undefined;
        },
      };

      expect(resolveCartToken(mockReader, "dtc")).toBe("legacy-cart-token-123");
      expect(resolveCartId(mockReader, "dtc")).toBe("legacy-cart-id-456");
    });

    it("migrates DTC legacy cookies to new cookies and expires legacy ones without generating new tokens", () => {
      const request = new NextRequest("https://store.example/us/en");
      request.cookies.set(LEGACY_CART_TOKEN_COOKIE, "legacy-cart-token-123");
      request.cookies.set(LEGACY_CART_ID_COOKIE, "legacy-cart-id-456");

      const response = NextResponse.next();
      const migrated = migrateLegacyCartCookies(request, response);

      expect(migrated).toBe(true);
      // New cookies written with exact same bearer token and ID
      expect(response.cookies.get(MIRZA_CART_TOKEN_COOKIE)?.value).toBe("legacy-cart-token-123");
      expect(response.cookies.get(MIRZA_CART_ID_COOKIE)?.value).toBe("legacy-cart-id-456");
      // Legacy cookies expired
      expect(response.cookies.get(LEGACY_CART_TOKEN_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_CART_ID_COOKIE)?.value).toBe("");
    });
  });

  describe("2. Existing Wholesale guest cart continuity", () => {
    it("resolves legacy wholesale cart token and id while preserving surface separation", () => {
      const mockReader = {
        get: (name: string) => {
          if (name === LEGACY_WHOLESALE_CART_TOKEN_COOKIE) return { value: "ws-token-abc" };
          if (name === LEGACY_WHOLESALE_CART_ID_COOKIE) return { value: "ws-id-xyz" };
          return undefined;
        },
      };

      expect(resolveCartToken(mockReader, "wholesale")).toBe("ws-token-abc");
      expect(resolveCartId(mockReader, "wholesale")).toBe("ws-id-xyz");
      // DTC stays undefined
      expect(resolveCartToken(mockReader, "dtc")).toBeUndefined();
    });

    it("migrates Wholesale legacy cookies to new wholesale cookies", () => {
      const request = new NextRequest("https://store.example/us/en/wholesale");
      request.cookies.set(LEGACY_WHOLESALE_CART_TOKEN_COOKIE, "ws-token-abc");
      request.cookies.set(LEGACY_WHOLESALE_CART_ID_COOKIE, "ws-id-xyz");

      const response = NextResponse.next();
      const migrated = migrateLegacyCartCookies(request, response);

      expect(migrated).toBe(true);
      expect(response.cookies.get(MIRZA_WHOLESALE_CART_TOKEN_COOKIE)?.value).toBe("ws-token-abc");
      expect(response.cookies.get(MIRZA_WHOLESALE_CART_ID_COOKIE)?.value).toBe("ws-id-xyz");
      expect(response.cookies.get(LEGACY_WHOLESALE_CART_TOKEN_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_WHOLESALE_CART_ID_COOKIE)?.value).toBe("");
    });
  });

  describe("3. Already migrated cart (idempotency)", () => {
    it("prefers new cookie and does not trigger migration churn when new cookies already exist", () => {
      const mockReader = {
        get: (name: string) => {
          if (name === MIRZA_CART_TOKEN_COOKIE) return { value: "new-token-111" };
          if (name === LEGACY_CART_TOKEN_COOKIE) return { value: "stale-legacy-token" };
          return undefined;
        },
      };

      expect(resolveCartToken(mockReader, "dtc")).toBe("new-token-111");

      const request = new NextRequest("https://store.example/us/en");
      request.cookies.set(MIRZA_CART_TOKEN_COOKIE, "new-token-111");
      request.cookies.set(MIRZA_CART_ID_COOKIE, "new-id-222");

      const response = NextResponse.next();
      const migrated = migrateLegacyCartCookies(request, response);

      expect(migrated).toBe(false);
      // No set-cookie headers added
      expect(response.cookies.get(MIRZA_CART_TOKEN_COOKIE)).toBeUndefined();
    });
  });

  describe("4. Locale migration", () => {
    it("resolves legacy country and locale fallback", () => {
      const mockReader = {
        get: (name: string) => {
          if (name === LEGACY_COUNTRY_COOKIE) return { value: "de" };
          if (name === LEGACY_LOCALE_COOKIE) return { value: "de" };
          return undefined;
        },
      };

      expect(resolveCountry(mockReader)).toBe("de");
      expect(resolveLocale(mockReader)).toBe("de");
    });

    it("prefers new mirza_country / mirza_locale when present", () => {
      const mockReader = {
        get: (name: string) => {
          if (name === MIRZA_COUNTRY_COOKIE) return { value: "fr" };
          if (name === LEGACY_COUNTRY_COOKIE) return { value: "de" };
          if (name === MIRZA_LOCALE_COOKIE) return { value: "fr" };
          return undefined;
        },
      };

      expect(resolveCountry(mockReader)).toBe("fr");
      expect(resolveLocale(mockReader)).toBe("fr");
    });

    it("expires legacy country and locale cookies when setting new ones", () => {
      const response = NextResponse.next();
      expireLegacyLocaleCookies(response);

      expect(response.cookies.get(LEGACY_COUNTRY_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_LOCALE_COOKIE)?.value).toBe("");
    });
  });

  describe("5. Legacy auth cookies", () => {
    it("expires legacy _spree_jwt and _spree_refresh_token immediately and never copies them to new auth cookies", () => {
      const request = new NextRequest("https://store.example/us/en");
      request.cookies.set(LEGACY_ACCESS_TOKEN_COOKIE, "legacy-jwt-token");
      request.cookies.set(LEGACY_REFRESH_TOKEN_COOKIE, "legacy-refresh-token");

      const response = NextResponse.next();
      expireLegacyAuthCookies(response, request);

      expect(response.cookies.get(LEGACY_ACCESS_TOKEN_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_REFRESH_TOKEN_COOKIE)?.value).toBe("");
      expect(request.cookies.has(LEGACY_ACCESS_TOKEN_COOKIE)).toBe(false);
      expect(request.cookies.has(LEGACY_REFRESH_TOKEN_COOKIE)).toBe(false);
    });
  });
});
