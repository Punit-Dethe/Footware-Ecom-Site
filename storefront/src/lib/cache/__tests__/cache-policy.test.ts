import { describe, expect, it } from "vitest";
import {
  CACHE_POLICIES,
  generateNextConfigCacheHeaders,
  resolveRouteCachePolicy,
  stripLocalePrefix,
} from "../cache-policy";

describe("cache-policy", () => {
  describe("stripLocalePrefix", () => {
    it("strips 2-letter country and locale", () => {
      expect(stripLocalePrefix("/us/en/products")).toBe("/products");
      expect(stripLocalePrefix("/in/en/cart")).toBe("/cart");
      expect(stripLocalePrefix("/us/en")).toBe("");
    });

    it("handles regional locales like en-US or fr-CA", () => {
      expect(stripLocalePrefix("/us/en-US/products")).toBe("/products");
      expect(stripLocalePrefix("/ca/fr-CA/c/shoes")).toBe("/c/shoes");
    });

    it("leaves non-localized paths intact", () => {
      expect(stripLocalePrefix("/products")).toBe("/products");
      expect(stripLocalePrefix("/cart")).toBe("/cart");
      expect(stripLocalePrefix("/")).toBe("/");
    });
  });

  describe("resolveRouteCachePolicy", () => {
    it("classifies homepage and categories as STABLE_CATALOG", () => {
      expect(resolveRouteCachePolicy("/us/en")).toBe(
        CACHE_POLICIES.STABLE_CATALOG,
      );
      expect(resolveRouteCachePolicy("/us/en/")).toBe(
        CACHE_POLICIES.STABLE_CATALOG,
      );
      expect(resolveRouteCachePolicy("/us/en/c/categories/oxfords")).toBe(
        CACHE_POLICIES.STABLE_CATALOG,
      );
      expect(resolveRouteCachePolicy("/c/derbies")).toBe(
        CACHE_POLICIES.STABLE_CATALOG,
      );
    });

    it("classifies product catalog and PDPs as CATALOG_CONTENT", () => {
      expect(resolveRouteCachePolicy("/us/en/products")).toBe(
        CACHE_POLICIES.CATALOG_CONTENT,
      );
      expect(
        resolveRouteCachePolicy(
          "/us/en/products/sovereign-cap-toe-oxford",
        ),
      ).toBe(CACHE_POLICIES.CATALOG_CONTENT);
      expect(resolveRouteCachePolicy("/products")).toBe(
        CACHE_POLICIES.CATALOG_CONTENT,
      );
      expect(resolveRouteCachePolicy("/us/en/policies/shipping")).toBe(
        CACHE_POLICIES.CATALOG_CONTENT,
      );
    });

    it("classifies cart, checkout, and account as PRIVATE_SESSION", () => {
      expect(resolveRouteCachePolicy("/us/en/cart")).toBe(
        CACHE_POLICIES.PRIVATE_SESSION,
      );
      expect(resolveRouteCachePolicy("/us/en/checkout/order-123")).toBe(
        CACHE_POLICIES.PRIVATE_SESSION,
      );
      expect(resolveRouteCachePolicy("/us/en/account")).toBe(
        CACHE_POLICIES.PRIVATE_SESSION,
      );
      expect(resolveRouteCachePolicy("/us/en/account/orders")).toBe(
        CACHE_POLICIES.PRIVATE_SESSION,
      );
      expect(resolveRouteCachePolicy("/cart")).toBe(
        CACHE_POLICIES.PRIVATE_SESSION,
      );
    });
  });

  describe("generateNextConfigCacheHeaders", () => {
    it("generates route header mappings matching the policies", () => {
      const headers = generateNextConfigCacheHeaders();
      expect(headers.length).toBeGreaterThan(5);

      const cartHeader = headers.find((h) => h.source === "/:country/:locale/cart");
      expect(cartHeader?.headers[0].value).toBe(CACHE_POLICIES.PRIVATE_SESSION);

      const categoryHeader = headers.find(
        (h) => h.source === "/:country/:locale/c/:path*",
      );
      expect(categoryHeader?.headers[0].value).toBe(
        CACHE_POLICIES.STABLE_CATALOG,
      );

      const productsHeader = headers.find(
        (h) => h.source === "/:country/:locale/products",
      );
      expect(productsHeader?.headers[0].value).toBe(
        CACHE_POLICIES.CATALOG_CONTENT,
      );
    });
  });
});
