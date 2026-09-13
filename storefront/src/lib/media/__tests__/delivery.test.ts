import { describe, expect, it } from "vitest";
import {
  generateSrcSet,
  getStoragePublicUrl,
  resolveResponsiveVariants,
} from "../delivery";

describe("Media Delivery Helpers", () => {
  describe("getStoragePublicUrl", () => {
    it("returns placeholder for empty storage path", () => {
      expect(getStoragePublicUrl(null)).toBe("/placeholder.svg");
      expect(getStoragePublicUrl(undefined)).toBe("/placeholder.svg");
      expect(getStoragePublicUrl("")).toBe("/placeholder.svg");
    });

    it("returns direct URL if storage path is already an absolute HTTP(S) URL", () => {
      const url = "https://example.com/images/shoe.webp";
      expect(getStoragePublicUrl(url)).toBe(url);
    });

    it("returns direct path if storage path is already relative public path", () => {
      const path = "/products/shoe-1/card.webp";
      expect(getStoragePublicUrl(path)).toBe(path);
    });

    it("prepends public supabase storage URL for object key", () => {
      const path = "products/prod-123/hero.webp";
      const publicUrl = getStoragePublicUrl(path);
      expect(publicUrl).toContain("/storage/v1/object/public/product-media/products/prod-123/hero.webp");
    });
  });

  describe("resolveResponsiveVariants", () => {
    it("returns undefined for null, undefined, or empty object", () => {
      expect(resolveResponsiveVariants(null)).toBeUndefined();
      expect(resolveResponsiveVariants(undefined)).toBeUndefined();
      expect(resolveResponsiveVariants({})).toBeUndefined();
    });

    it("resolves relative or object URLs across responsive widths", () => {
      const input = {
        "320": { webp: "products/shoe/320.webp", avif: "products/shoe/320.avif" },
        "640": { webp: "/products/shoe/640.webp" },
      };

      const resolved = resolveResponsiveVariants(input);
      expect(resolved).toBeDefined();
      expect(resolved?.["320"]?.webp).toContain("/storage/v1/object/public/product-media/products/shoe/320.webp");
      expect(resolved?.["320"]?.avif).toContain("/storage/v1/object/public/product-media/products/shoe/320.avif");
      expect(resolved?.["640"]?.webp).toBe("/products/shoe/640.webp");
    });
  });

  describe("generateSrcSet", () => {
    it("returns null for missing variants or format", () => {
      expect(generateSrcSet(null, "webp")).toBeNull();
      expect(generateSrcSet({}, "webp")).toBeNull();
    });

    it("generates sorted responsive srcset for requested format", () => {
      const variants = {
        "640": { webp: "https://example.com/640.webp" },
        "320": { webp: "https://example.com/320.webp" },
        "1280": { webp: "https://example.com/1280.webp" },
      };

      const srcset = generateSrcSet(variants, "webp");
      expect(srcset).toBe(
        "https://example.com/320.webp 320w, https://example.com/640.webp 640w, https://example.com/1280.webp 1280w",
      );
    });

    it("skips widths where requested format is not available", () => {
      const variants = {
        "320": { avif: "https://example.com/320.avif" },
        "640": { webp: "https://example.com/640.webp" },
      };

      const srcset = generateSrcSet(variants, "webp");
      expect(srcset).toBe("https://example.com/640.webp 640w");
    });
  });
});
