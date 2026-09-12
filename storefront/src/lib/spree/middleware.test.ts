import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockVerifyProxySession = vi.fn();

vi.mock("@/lib/supabase/proxy", () => ({
  verifyProxySession: (req: NextRequest, res: unknown) =>
    mockVerifyProxySession(req, res),
}));

import { createSpreeMiddleware } from "@/lib/spree/middleware";

const middleware = createSpreeMiddleware({
  defaultCountry: "us",
  defaultLocale: "en",
  supportedLocales: ["en", "de", "zh-CN"],
});

describe("Spree locale middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyProxySession.mockResolvedValue({
      userId: null,
      email: null,
      claims: null,
      cookiesRefreshed: false,
    });
  });

  it("canonicalizes an existing country and locale prefix", async () => {
    const response = await middleware(
      new NextRequest("https://store.example/US/ZH-cn/products?sort=name"),
    );

    expect(response.headers.get("location")).toBe(
      "https://store.example/us/zh-CN/products?sort=name",
    );
  });

  it("redirects an unsupported storefront locale without dropping the path", async () => {
    const response = await middleware(
      new NextRequest("https://store.example/ar/it/products/coffee"),
    );

    expect(response.headers.get("location")).toBe(
      "https://store.example/us/en/products/coffee",
    );
    expect(response.cookies.get("spree_country")?.value).toBe("us");
    expect(response.cookies.get("spree_locale")?.value).toBe("en");
  });

  it("falls back to a supported locale when the configured default is unavailable", async () => {
    const invalidDefaultMiddleware = createSpreeMiddleware({
      defaultCountry: "us",
      defaultLocale: "it",
      supportedLocales: ["en", "de"],
    });

    const response = await invalidDefaultMiddleware(
      new NextRequest("https://store.example/us/it/products"),
    );

    expect(response.headers.get("location")).toBe(
      "https://store.example/us/en/products",
    );
  });

  it("negotiates the first supported browser language", async () => {
    const response = await middleware(
      new NextRequest("https://store.example/products", {
        headers: { "accept-language": "it-IT, de-DE;q=0.9, en;q=0.8" },
      }),
    );

    expect(response.headers.get("location")).toBe(
      "https://store.example/us/de/products",
    );
  });

  it("uses Accept-Language quality weights instead of header order", async () => {
    const response = await middleware(
      new NextRequest("https://store.example/products", {
        headers: { "accept-language": "de;q=0, en-US;q=0.9" },
      }),
    );

    expect(response.headers.get("location")).toBe(
      "https://store.example/us/en/products",
    );
  });

  it("forwards the localized request path for Market-aware fallbacks", async () => {
    const response = await middleware(
      new NextRequest("https://store.example/ar/en/products/coffee?sort=price"),
    );

    expect(
      response.headers.get("x-middleware-request-x-spree-request-pathname"),
    ).toBe("/ar/en/products/coffee");
    expect(
      response.headers.get("x-middleware-request-x-spree-request-search"),
    ).toBe("?sort=price");
  });

  it("passes through /auth/confirm without locale prefix rewrite", async () => {
    const response = await middleware(
      new NextRequest(
        "https://store.example/auth/confirm?token_hash=xyz123&type=email",
      ),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects an anonymous protected account request to sign in", async () => {
    const response = await middleware(
      new NextRequest(
        "https://store.example/us/en/account/orders?state=complete",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://store.example/us/en/account?redirect=%2Fus%2Fen%2Faccount%2Forders%3Fstate%3Dcomplete",
    );
  });

  it.each([
    "/us/en/account",
    "/us/en/account/register",
    "/us/en/account/forgot-password",
    "/us/en/account/reset-password",
  ])("keeps the public account route accessible and refreshes session: %s", async (pathname) => {
    const response = await middleware(
      new NextRequest(`https://store.example${pathname}`),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(mockVerifyProxySession).toHaveBeenCalled();
  });

  it.each([
    "/us/en",
    "/us/en/products",
    "/us/en/products/running-shoes",
    "/us/en/c/footwear",
    "/us/en/search",
    "/us/en/policies/terms-of-service",
  ])("never invokes verifyProxySession on public catalog route: %s", async (pathname) => {
    const response = await middleware(
      new NextRequest(`https://store.example${pathname}`),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(mockVerifyProxySession).not.toHaveBeenCalled();
  });

  it.each([
    "/us/en/checkout",
    "/us/en/checkout/payment",
    "/us/en/wholesale",
    "/us/en/wholesale/orders",
  ])("invokes verifyProxySession without anonymous redirect for: %s", async (pathname) => {
    const response = await middleware(
      new NextRequest(`https://store.example${pathname}`),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(mockVerifyProxySession).toHaveBeenCalled();
  });

  it("does NOT authorize a protected account request with legacy Spree cookies", async () => {
    const request = new NextRequest(
      "https://store.example/us/en/account/orders",
    );
    request.cookies.set("_spree_jwt", "legacy-token");
    request.cookies.set("_spree_refresh_token", "legacy-refresh");

    // Supabase returns no verified user
    mockVerifyProxySession.mockResolvedValue({
      userId: null,
      email: null,
      claims: null,
      cookiesRefreshed: false,
    });

    const response = await middleware(request);

    // Legacy cookies alone MUST NOT grant access; must redirect to login
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/us/en/account?");
    // Defensively drops legacy cookies
    expect(response.cookies.get("_spree_jwt")?.value).toBe("");
    expect(response.cookies.get("_spree_refresh_token")?.value).toBe("");
  });

  it("allows protected account request when Supabase verified claims are valid", async () => {
    const request = new NextRequest(
      "https://store.example/us/en/account/orders",
    );
    mockVerifyProxySession.mockResolvedValue({
      userId: "user-uuid-123",
      email: "shopper@example.com",
      claims: { sub: "user-uuid-123" },
      cookiesRefreshed: false,
    });

    const response = await middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("sets Cache-Control: private, no-store when Supabase token refresh occurs", async () => {
    const request = new NextRequest(
      "https://store.example/us/en/account/orders",
    );
    mockVerifyProxySession.mockResolvedValue({
      userId: "user-uuid-123",
      email: "shopper@example.com",
      claims: { sub: "user-uuid-123" },
      cookiesRefreshed: true,
    });

    const response = await middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});

