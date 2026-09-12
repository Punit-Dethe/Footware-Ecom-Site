import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

let capturedCookieAdapter: {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (
    cookiesToSet: Array<{
      name: string;
      value: string;
      options?: Record<string, unknown>;
    }>,
  ) => void;
} | null = null;

const mockGetClaims = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn((_url, _key, options) => {
    capturedCookieAdapter = options.cookies;
    return {
      auth: {
        getClaims: mockGetClaims,
      },
    };
  }),
}));

vi.mock("../server", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabasePublishableKey: () => "mock-anon-key",
}));

import {
  createProxySupabaseClient,
  verifyProxySession,
} from "../proxy";

describe("createProxySupabaseClient cookie adapter rotation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCookieAdapter = null;
    mockGetClaims.mockReset();
  });

  it("updates request.cookies and rebuilds NextResponse with x-middleware-request-cookie on setAll()", () => {
    const request = new NextRequest("https://store.example/us/en/account", {
      headers: {
        cookie: "sb-auth=old-token",
      },
    });

    const { getResponse, getCookiesRefreshed } = createProxySupabaseClient(request);

    expect(capturedCookieAdapter).not.toBeNull();
    expect(request.cookies.get("sb-auth")?.value).toBe("old-token");
    expect(getCookiesRefreshed()).toBe(false);

    // Simulate Supabase rotating the auth token
    capturedCookieAdapter!.setAll([
      {
        name: "sb-auth",
        value: "rotated-token-xyz",
        options: { path: "/", httpOnly: true, maxAge: 3600 },
      },
    ]);

    // 1. Mutated request cookie is visible
    expect(request.cookies.get("sb-auth")?.value).toBe("rotated-token-xyz");

    // 2. Flags rotation
    expect(getCookiesRefreshed()).toBe(true);

    const response = getResponse();

    // 3. Downstream request override contains rotated token (x-middleware-request-cookie)
    const downstreamCookieHeader = response.headers.get(
      "x-middleware-request-cookie",
    );
    expect(downstreamCookieHeader).toContain("sb-auth=rotated-token-xyz");

    // 4. Outgoing response contains Set-Cookie for browser
    expect(response.cookies.get("sb-auth")?.value).toBe("rotated-token-xyz");
  });

  it("verifyProxySession returns rotated tokens and response when setAll occurs during claims check", async () => {
    const request = new NextRequest("https://store.example/us/en/account", {
      headers: {
        cookie: "sb-auth=old-token",
      },
    });

    mockGetClaims.mockImplementation(async () => {
      capturedCookieAdapter!.setAll([
        {
          name: "sb-auth",
          value: "rotated-token-123",
          options: { path: "/", httpOnly: true },
        },
      ]);
      return {
        data: {
          claims: {
            sub: "user-456",
            email: "verified@example.com",
          },
        },
        error: null,
      };
    });

    const result = await verifyProxySession(request);

    expect(result.userId).toBe("user-456");
    expect(result.email).toBe("verified@example.com");
    expect(result.cookiesRefreshed).toBe(true);
    expect(request.cookies.get("sb-auth")?.value).toBe("rotated-token-123");
    expect(
      result.response.headers.get("x-middleware-request-cookie"),
    ).toContain("sb-auth=rotated-token-123");
    expect(result.response.cookies.get("sb-auth")?.value).toBe(
      "rotated-token-123",
    );
  });

  it("verifyProxySession distinguishes transient 5xx / transport failure from normal invalid session", async () => {
    const request = new NextRequest("https://store.example/us/en/account");

    // Case 1: Normal invalid session (no claims or 400 error)
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: { name: "AuthSessionMissingError", message: "Auth session missing", status: 400 },
    });
    const invalidResult = await verifyProxySession(request);
    expect(invalidResult.userId).toBeNull();
    expect(invalidResult.transientFailure).toBeFalsy();

    // Case 2: Transient 503 service outage
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: { name: "AuthApiError", message: "Service Unavailable", status: 503 },
    });
    const outageResult = await verifyProxySession(request);
    expect(outageResult.userId).toBeNull();
    expect(outageResult.transientFailure).toBe(true);

    // Case 3: Network fetch exception thrown
    mockGetClaims.mockRejectedValueOnce(new Error("fetch failed"));
    const transportResult = await verifyProxySession(request);
    expect(transportResult.userId).toBeNull();
    expect(transportResult.transientFailure).toBe(true);
  });
});
