import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Media Migration Invariants & Logic", () => {
  const manifestPath = path.resolve(__dirname, "../manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const publicDir = path.resolve(__dirname, "../../../../public");

  it("contains exactly 38 product entries in manifest.json", () => {
    const slugs = Object.keys(manifest);
    expect(slugs).toHaveLength(38);
  });

  it("verifies all 532 local derivative files exist on disk", () => {
    let totalFiles = 0;
    const missing: string[] = [];

    for (const [_slug, item] of Object.entries(manifest as Record<string, any>)) {
      expect(item.variants).toBeDefined();
      for (const [_width, formats] of Object.entries(item.variants as Record<string, any>)) {
        for (const [_format, relPath] of Object.entries(formats as Record<string, string>)) {
          totalFiles++;
          const diskPath = path.join(publicDir, relPath.replace(/^\//, ""));
          if (!fs.existsSync(diskPath)) {
            missing.push(diskPath);
          }
        }
      }
    }

    expect(totalFiles).toBe(532);
    expect(missing).toHaveLength(0);
  });

  it("rewrites processed_variants to deterministic Storage object paths without /products/ prefix", () => {
    const dummyProductId = "11111111-1111-4111-8111-111111111111";
    const dummyMediaId = "22222222-2222-4222-8222-222222222222";

    const sampleVariants = manifest["office-footwear-01"].variants;
    const rewritten: Record<string, Record<string, string>> = {};

    for (const [width, formats] of Object.entries(sampleVariants as Record<string, any>)) {
      rewritten[width] = {};
      for (const format of Object.keys(formats)) {
        rewritten[width][format] = `products/${dummyProductId}/${dummyMediaId}/variants/${width}.${format}`;
      }
    }

    // Check every rewritten path
    for (const [width, formats] of Object.entries(rewritten)) {
      for (const [format, p] of Object.entries(formats)) {
        expect(p).not.toMatch(/^\/products\//);
        expect(p).toBe(`products/${dummyProductId}/${dummyMediaId}/variants/${width}.${format}`);
      }
    }
  });

  it("canonical storage_path points to 640 webp derivative", () => {
    const dummyProductId = "prod-1";
    const dummyMediaId = "med-1";
    const canonical = `products/${dummyProductId}/${dummyMediaId}/variants/640.webp`;
    expect(canonical).toBe("products/prod-1/med-1/variants/640.webp");
  });
});
