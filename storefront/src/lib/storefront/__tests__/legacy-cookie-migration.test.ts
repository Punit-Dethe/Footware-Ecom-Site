import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = {
  get: vi.fn(),
  getAll: vi.fn().mockReturnValue([]),
  has: vi.fn().mockReturnValue(false),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => mockCookieStore),
  headers: vi.fn().mockReturnValue(new Map()),
}));

import { setCartCookies } from "../cookies";
import {
  clearLegacyCartCookies,
  clearLegacyCartToken,
  expireLegacyAuthCookies,
  expireLegacyLocaleCookies,
  hasLegacyAuthCookies,
  hasLegacyCartCookies,
  hasLegacyLocaleCookies,
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
  resolveCartCookieState,
  resolveCartId,
  resolveCartToken,
  resolveCountry,
  resolveLocale,
} from "../legacy-cookie-migration";

describe("Legacy Cookie Migration Bridge & Resolution Semantics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Atomic Namespace Resolution (Section 4 Edge Cases A - E)", () => {
    it("Case A: Complete new + complete legacy -> prefers new namespace exclusively (N1 / NT)", () => {
      const mockReader = {
        get: (name: string) => {
          if (name === MIRZA_CART_ID_COOKIE) return { value: "N1" };
          if (name === MIRZA_CART_TOKEN_COOKIE) return { value: "NT" };
          if (name === LEGACY_CART_ID_COOKIE) return { value: "L1" };
          if (name === LEGACY_CART_TOKEN_COOKIE) return { value: "LT" };
          return undefined;
        },
      };

      const resolved = resolveCartCookieState(mockReader, "dtc");
      expect(resolved).toEqual({
        id: "N1",
        token: "NT",
        source: "mirza",
      });

      // Convenience helpers match
      expect(resolveCartId(mockReader, "dtc")).toBe("N1");
      expect(resolveCartToken(mockReader, "dtc")).toBe("NT");
    });

    it("Case B: New ID only + complete legacy -> ID=N1, token=undefined (NEVER N1 / LT)", () => {
      // Authenticated user with new cart ID and stale legacy guest bearer token
      const mockReader = {
        get: (name: string) => {
          if (name === MIRZA_CART_ID_COOKIE) return { value: "N1" };
          // new token is absent
          if (name === LEGACY_CART_ID_COOKIE) return { value: "L1" };
          if (name === LEGACY_CART_TOKEN_COOKIE) return { value: "LT" };
          return undefined;
        },
      };

      const resolved = resolveCartCookieState(mockReader, "dtc");
      expect(resolved).toEqual({
        id: "N1",
        token: undefined,
        source: "mirza",
      });

      // Critical safety invariant: never pair new ID with legacy token
      expect(resolveCartId(mockReader, "dtc")).toBe("N1");
      expect(resolveCartToken(mockReader, "dtc")).toBeUndefined();
      expect(resolveCartToken(mockReader, "dtc")).not.toBe("LT");
    });

    it("Case C: New token only + legacy state -> ID=undefined, token=NT (NEVER L1 / NT)", () => {
      // New bearer token exists without ID; legacy state exists
      const mockReader = {
        get: (name: string) => {
          // new ID is absent
          if (name === MIRZA_CART_TOKEN_COOKIE) return { value: "NT" };
          if (name === LEGACY_CART_ID_COOKIE) return { value: "L1" };
          if (name === LEGACY_CART_TOKEN_COOKIE) return { value: "LT" };
          return undefined;
        },
      };

      const resolved = resolveCartCookieState(mockReader, "dtc");
      expect(resolved).toEqual({
        id: undefined,
        token: "NT",
        source: "mirza",
      });

      // Critical safety invariant: never pair legacy ID with new token
      expect(resolveCartId(mockReader, "dtc")).toBeUndefined();
      expect(resolveCartId(mockReader, "dtc")).not.toBe("L1");
      expect(resolveCartToken(mockReader, "dtc")).toBe("NT");
    });

    it("Case D: Legacy-only full guest pair -> preserves exact legacy ID and bearer token (L1 / LT)", () => {
      const mockReader = {
        get: (name: string) => {
          if (name === LEGACY_CART_ID_COOKIE) return { value: "L1" };
          if (name === LEGACY_CART_TOKEN_COOKIE) return { value: "LT" };
          return undefined;
        },
      };

      const resolved = resolveCartCookieState(mockReader, "dtc");
      expect(resolved).toEqual({
        id: "L1",
        token: "LT",
        source: "legacy",
      });

      expect(resolveCartId(mockReader, "dtc")).toBe("L1");
      expect(resolveCartToken(mockReader, "dtc")).toBe("LT");
    });

    it("Case E: Legacy token only -> preserves guest-token continuity without fabricating an ID", () => {
      const mockReader = {
        get: (name: string) => {
          if (name === LEGACY_CART_TOKEN_COOKIE) return { value: "LT" };
          return undefined;
        },
      };

      const resolved = resolveCartCookieState(mockReader, "dtc");
      expect(resolved).toEqual({
        id: undefined,
        token: "LT",
        source: "legacy",
      });

      expect(resolveCartId(mockReader, "dtc")).toBeUndefined();
      expect(resolveCartToken(mockReader, "dtc")).toBe("LT");
    });

    it("Both absent -> returns none with undefined ID and token", () => {
      const mockReader = {
        get: () => undefined,
      };

      const resolved = resolveCartCookieState(mockReader, "dtc");
      expect(resolved).toEqual({
        id: undefined,
        token: undefined,
        source: "none",
      });

      expect(resolveCartId(mockReader, "dtc")).toBeUndefined();
      expect(resolveCartToken(mockReader, "dtc")).toBeUndefined();
    });
  });

  describe("2. Migration Semantics (migrateLegacyCartCookies)", () => {
    it("Case A (Complete new + legacy): new namespace wins, expires legacy cookies without copying", () => {
      const request = new NextRequest("https://store.example/us/en");
      request.cookies.set(MIRZA_CART_ID_COOKIE, "N1");
      request.cookies.set(MIRZA_CART_TOKEN_COOKIE, "NT");
      request.cookies.set(LEGACY_CART_ID_COOKIE, "L1");
      request.cookies.set(LEGACY_CART_TOKEN_COOKIE, "LT");

      const response = NextResponse.next();
      const migrated = migrateLegacyCartCookies(request, response);

      // True because legacy cookies were expired
      expect(migrated).toBe(true);
      // New cookies were NOT overwritten with legacy values
      expect(response.cookies.get(MIRZA_CART_ID_COOKIE)).toBeUndefined();
      expect(response.cookies.get(MIRZA_CART_TOKEN_COOKIE)).toBeUndefined();
      // Legacy cookies expired
      expect(response.cookies.get(LEGACY_CART_ID_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_CART_TOKEN_COOKIE)?.value).toBe("");
    });

    it("Case B (New ID only + legacy): new namespace wins, does NOT copy legacy token, expires legacy cookies", () => {
      const request = new NextRequest("https://store.example/us/en");
      request.cookies.set(MIRZA_CART_ID_COOKIE, "N1");
      request.cookies.set(LEGACY_CART_ID_COOKIE, "L1");
      request.cookies.set(LEGACY_CART_TOKEN_COOKIE, "LT");

      const response = NextResponse.next();
      const migrated = migrateLegacyCartCookies(request, response);

      expect(migrated).toBe(true);
      // New token must NOT be populated with legacy token
      expect(response.cookies.get(MIRZA_CART_TOKEN_COOKIE)).toBeUndefined();
      // Legacy cookies expired
      expect(response.cookies.get(LEGACY_CART_ID_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_CART_TOKEN_COOKIE)?.value).toBe("");
    });

    it("Case C (New token only + legacy): new namespace wins, does NOT copy legacy ID, expires legacy cookies", () => {
      const request = new NextRequest("https://store.example/us/en");
      request.cookies.set(MIRZA_CART_TOKEN_COOKIE, "NT");
      request.cookies.set(LEGACY_CART_ID_COOKIE, "L1");
      request.cookies.set(LEGACY_CART_TOKEN_COOKIE, "LT");

      const response = NextResponse.next();
      const migrated = migrateLegacyCartCookies(request, response);

      expect(migrated).toBe(true);
      // New ID must NOT be populated with legacy ID
      expect(response.cookies.get(MIRZA_CART_ID_COOKIE)).toBeUndefined();
      // Legacy cookies expired
      expect(response.cookies.get(LEGACY_CART_ID_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_CART_TOKEN_COOKIE)?.value).toBe("");
    });

    it("Case D (Legacy-only full guest pair): copies exact values and expires legacy cookies", () => {
      const request = new NextRequest("https://store.example/us/en");
      request.cookies.set(LEGACY_CART_ID_COOKIE, "L1");
      request.cookies.set(LEGACY_CART_TOKEN_COOKIE, "LT");

      const response = NextResponse.next();
      const migrated = migrateLegacyCartCookies(request, response);

      expect(migrated).toBe(true);
      // Exact values copied into Mirza namespace
      expect(response.cookies.get(MIRZA_CART_ID_COOKIE)?.value).toBe("L1");
      expect(response.cookies.get(MIRZA_CART_TOKEN_COOKIE)?.value).toBe("LT");
      // Legacy cookies expired
      expect(response.cookies.get(LEGACY_CART_ID_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_CART_TOKEN_COOKIE)?.value).toBe("");
    });

    it("Case E (Legacy token only): copies exact token without fabricating ID and expires legacy token", () => {
      const request = new NextRequest("https://store.example/us/en");
      request.cookies.set(LEGACY_CART_TOKEN_COOKIE, "LT");

      const response = NextResponse.next();
      const migrated = migrateLegacyCartCookies(request, response);

      expect(migrated).toBe(true);
      expect(response.cookies.get(MIRZA_CART_TOKEN_COOKIE)?.value).toBe("LT");
      expect(response.cookies.get(MIRZA_CART_ID_COOKIE)).toBeUndefined();
      expect(response.cookies.get(LEGACY_CART_TOKEN_COOKIE)?.value).toBe("");
    });

    it("Already cleanly migrated (no legacy cookies): no-op with zero Set-Cookie headers", () => {
      const request = new NextRequest("https://store.example/us/en");
      request.cookies.set(MIRZA_CART_ID_COOKIE, "N1");
      request.cookies.set(MIRZA_CART_TOKEN_COOKIE, "NT");

      const response = NextResponse.next();
      const migrated = migrateLegacyCartCookies(request, response);

      expect(migrated).toBe(false);
      expect(response.cookies.getAll()).toEqual([]);
    });
  });

  describe("3. DTC / Wholesale Surface Separation (Case G)", () => {
    it("resolves surfaces independently without cross-surface pollution", () => {
      const mockReader = {
        get: (name: string) => {
          // DTC has new ID only
          if (name === MIRZA_CART_ID_COOKIE) return { value: "dtc-new-id" };
          // Wholesale has legacy pair
          if (name === LEGACY_WHOLESALE_CART_ID_COOKIE) return { value: "ws-legacy-id" };
          if (name === LEGACY_WHOLESALE_CART_TOKEN_COOKIE) return { value: "ws-legacy-token" };
          return undefined;
        },
      };

      // DTC resolves to Mirza namespace
      const dtcState = resolveCartCookieState(mockReader, "dtc");
      expect(dtcState).toEqual({
        id: "dtc-new-id",
        token: undefined,
        source: "mirza",
      });

      // Wholesale resolves to Legacy namespace
      const wsState = resolveCartCookieState(mockReader, "wholesale");
      expect(wsState).toEqual({
        id: "ws-legacy-id",
        token: "ws-legacy-token",
        source: "legacy",
      });
    });

    it("migrates wholesale legacy cookies without disturbing DTC", () => {
      const request = new NextRequest("https://store.example/us/en/wholesale");
      request.cookies.set(MIRZA_CART_ID_COOKIE, "dtc-new-id");
      request.cookies.set(LEGACY_WHOLESALE_CART_ID_COOKIE, "ws-legacy-id");
      request.cookies.set(LEGACY_WHOLESALE_CART_TOKEN_COOKIE, "ws-legacy-token");

      const response = NextResponse.next();
      const migrated = migrateLegacyCartCookies(request, response);

      expect(migrated).toBe(true);
      expect(response.cookies.get(MIRZA_WHOLESALE_CART_ID_COOKIE)?.value).toBe("ws-legacy-id");
      expect(response.cookies.get(MIRZA_WHOLESALE_CART_TOKEN_COOKIE)?.value).toBe("ws-legacy-token");
      expect(response.cookies.get(LEGACY_WHOLESALE_CART_ID_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_WHOLESALE_CART_TOKEN_COOKIE)?.value).toBe("");

      // DTC cookies untouched
      expect(response.cookies.get(MIRZA_CART_ID_COOKIE)).toBeUndefined();
      expect(response.cookies.get(LEGACY_CART_ID_COOKIE)).toBeUndefined();
    });
  });

  describe("4. Authenticated Cart Write (Case F: setCartCookies)", () => {
    it("expires legacy ID and token unconditionally on authenticated DTC cart write", async () => {
      const calls: { name: string; value: string; opts?: unknown }[] = [];
      mockCookieStore.set.mockImplementation((name, value, opts) => {
        calls.push({ name, value, opts });
      });

      await setCartCookies("user-cart-123", undefined, "dtc");

      // Verify new ID written
      const idCall = calls.find((c) => c.name === MIRZA_CART_ID_COOKIE);
      expect(idCall?.value).toBe("user-cart-123");

      // Verify new bearer token cleared (maxAge: -1)
      const tokenCall = calls.find((c) => c.name === MIRZA_CART_TOKEN_COOKIE);
      expect(tokenCall?.opts).toEqual(expect.objectContaining({ maxAge: -1 }));

      // Verify legacy ID unconditionally expired
      const legacyIdCall = calls.find((c) => c.name === LEGACY_CART_ID_COOKIE);
      expect(legacyIdCall?.opts).toEqual(expect.objectContaining({ maxAge: -1 }));

      // Verify legacy token unconditionally expired
      const legacyTokenCall = calls.find((c) => c.name === LEGACY_CART_TOKEN_COOKIE);
      expect(legacyTokenCall?.opts).toEqual(expect.objectContaining({ maxAge: -1 }));
    });

    it("expires legacy wholesale ID and token unconditionally on wholesale cart write", async () => {
      const calls: { name: string; value: string; opts?: unknown }[] = [];
      mockCookieStore.set.mockImplementation((name, value, opts) => {
        calls.push({ name, value, opts });
      });

      await setCartCookies("ws-user-cart-456", undefined, "wholesale");

      const idCall = calls.find((c) => c.name === MIRZA_WHOLESALE_CART_ID_COOKIE);
      expect(idCall?.value).toBe("ws-user-cart-456");

      const tokenCall = calls.find((c) => c.name === MIRZA_WHOLESALE_CART_TOKEN_COOKIE);
      expect(tokenCall?.opts).toEqual(expect.objectContaining({ maxAge: -1 }));

      const legacyIdCall = calls.find((c) => c.name === LEGACY_WHOLESALE_CART_ID_COOKIE);
      expect(legacyIdCall?.opts).toEqual(expect.objectContaining({ maxAge: -1 }));

      const legacyTokenCall = calls.find((c) => c.name === LEGACY_WHOLESALE_CART_TOKEN_COOKIE);
      expect(legacyTokenCall?.opts).toEqual(expect.objectContaining({ maxAge: -1 }));
    });
  });

  describe("5. Neutral Helper Functions & Legacy Boundary", () => {
    it("hasLegacyAuthCookies detects legacy auth tokens", () => {
      const reqWithJwt = {
        cookies: {
          has: (name: string) => name === LEGACY_ACCESS_TOKEN_COOKIE,
        },
      };
      expect(hasLegacyAuthCookies(reqWithJwt)).toBe(true);

      const reqWithRefresh = {
        cookies: {
          has: (name: string) => name === LEGACY_REFRESH_TOKEN_COOKIE,
        },
      };
      expect(hasLegacyAuthCookies(reqWithRefresh)).toBe(true);

      const reqClean = {
        cookies: {
          has: () => false,
        },
      };
      expect(hasLegacyAuthCookies(reqClean)).toBe(false);
    });

    it("hasLegacyLocaleCookies detects legacy country and locale cookies", () => {
      const reqWithCountry = {
        cookies: {
          has: (name: string) => name === LEGACY_COUNTRY_COOKIE,
        },
      };
      expect(hasLegacyLocaleCookies(reqWithCountry)).toBe(true);

      const reqWithLocale = {
        cookies: {
          has: (name: string) => name === LEGACY_LOCALE_COOKIE,
        },
      };
      expect(hasLegacyLocaleCookies(reqWithLocale)).toBe(true);

      const reqClean = {
        cookies: {
          has: () => false,
        },
      };
      expect(hasLegacyLocaleCookies(reqClean)).toBe(false);
    });

    it("hasLegacyCartCookies detects legacy DTC and Wholesale cart cookies", () => {
      const reqWithDtcToken = {
        cookies: {
          has: (name: string) => name === LEGACY_CART_TOKEN_COOKIE,
        },
      };
      expect(hasLegacyCartCookies(reqWithDtcToken, "dtc")).toBe(true);
      expect(hasLegacyCartCookies(reqWithDtcToken, "wholesale")).toBe(false);

      const reqWithWsId = {
        cookies: {
          has: (name: string) => name === LEGACY_WHOLESALE_CART_ID_COOKIE,
        },
      };
      expect(hasLegacyCartCookies(reqWithWsId, "wholesale")).toBe(true);
      expect(hasLegacyCartCookies(reqWithWsId, "dtc")).toBe(false);
    });

    it("clearLegacyCartCookies and clearLegacyCartToken expire legacy cookies on writer", () => {
      const setCalls: string[] = [];
      const writer = {
        set: (name: string) => {
          setCalls.push(name);
        },
      };

      clearLegacyCartCookies(writer, "dtc");
      expect(setCalls).toContain(LEGACY_CART_ID_COOKIE);
      expect(setCalls).toContain(LEGACY_CART_TOKEN_COOKIE);

      setCalls.length = 0;
      clearLegacyCartCookies(writer, "wholesale");
      expect(setCalls).toContain(LEGACY_WHOLESALE_CART_ID_COOKIE);
      expect(setCalls).toContain(LEGACY_WHOLESALE_CART_TOKEN_COOKIE);

      setCalls.length = 0;
      clearLegacyCartToken(writer, "dtc");
      expect(setCalls).toEqual([LEGACY_CART_TOKEN_COOKIE]);
    });

    it("expireLegacyLocaleCookies expires legacy country and locale cookies", () => {
      const response = NextResponse.next();
      expireLegacyLocaleCookies(response);

      expect(response.cookies.get(LEGACY_COUNTRY_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_LOCALE_COOKIE)?.value).toBe("");
    });

    it("expireLegacyAuthCookies expires legacy jwt and refresh cookies", () => {
      const request = new NextRequest("https://store.example/us/en");
      request.cookies.set(LEGACY_ACCESS_TOKEN_COOKIE, "legacy-jwt");
      request.cookies.set(LEGACY_REFRESH_TOKEN_COOKIE, "legacy-refresh");

      const response = NextResponse.next();
      expireLegacyAuthCookies(response, request);

      expect(response.cookies.get(LEGACY_ACCESS_TOKEN_COOKIE)?.value).toBe("");
      expect(response.cookies.get(LEGACY_REFRESH_TOKEN_COOKIE)?.value).toBe("");
      expect(request.cookies.has(LEGACY_ACCESS_TOKEN_COOKIE)).toBe(false);
      expect(request.cookies.has(LEGACY_REFRESH_TOKEN_COOKIE)).toBe(false);
    });
  });

  describe("6. Locale resolution with legacy fallback", () => {
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
  });
});
