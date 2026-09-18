import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  CANONICAL_BACKGROUND,
  TARGET_DIMENSION,
  WEBP_QUALITY,
  resolveSourceMappings,
  validateStoneImagePixels,
} from "../../../../../scripts/catalog/prepare-stone-shoe-images.mjs";

const rootDir = path.resolve(__dirname, "../../../../../");
const artifactsDir = path.join(rootDir, "artifacts/media-v1/stone-catalog");
const manifestPath = path.join(artifactsDir, "manifest.json");

describe("Stone Media Pipeline — Phase 2 Master Pipeline", () => {
  describe("Source Mapping & Validation", () => {
    it("matches exactly 31 canonical products from the manifest", async () => {
      const mappings = await resolveSourceMappings(rootDir);
      expect(mappings).toHaveLength(31);
    });

    it("assigns canonical slug range shoe-2026-09-001 through shoe-2026-09-031", async () => {
      const mappings = await resolveSourceMappings(rootDir);
      expect(mappings[0].productSlug).toBe("shoe-2026-09-001");
      expect(mappings[30].productSlug).toBe("shoe-2026-09-031");

      mappings.forEach((m, idx) => {
        const expectedNumber = String(idx + 1).padStart(3, "0");
        expect(m.productSlug).toBe(`shoe-2026-09-${expectedNumber}`);
        expect(m.outputFilename).toBe(`shoe-${String(idx + 1).padStart(2, "0")}.webp`);
      });
    });

    it("verifies every source file exists and is a readable PNG", async () => {
      const mappings = await resolveSourceMappings(rootDir);
      for (const item of mappings) {
        const stats = await fs.stat(item.sourcePath);
        expect(stats.isFile()).toBe(true);
        expect(stats.size).toBeGreaterThan(0);
        expect(item.sourceFilename.toLowerCase().endsWith(".png")).toBe(true);
      }
    });

    it("ensures all 31 source image paths are distinct with no duplicates", async () => {
      const mappings = await resolveSourceMappings(rootDir);
      const uniqueFilenames = new Set(mappings.map((m) => m.sourceFilename));
      expect(uniqueFilenames.size).toBe(31);
    });
  });

  describe("Generated Output Artifacts & Manifest", () => {
    it("has a valid manifest.json with all 31 product records", async () => {
      const content = await fs.readFile(manifestPath, "utf8");
      const manifest = JSON.parse(content);
      expect(manifest).toHaveLength(31);

      manifest.forEach((entry: any, index: number) => {
        const numStr = String(index + 1).padStart(3, "0");
        const fileNumStr = String(index + 1).padStart(2, "0");
        expect(entry.productSlug).toBe(`shoe-2026-09-${numStr}`);
        expect(entry.outputFilename).toBe(`shoe-${fileNumStr}.webp`);
        expect(entry.width).toBe(1200);
        expect(entry.height).toBe(1200);
        expect(entry.format).toBe("webp");
        expect(entry.outputBytes).toBeGreaterThan(0);
        expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(entry.canonicalBackground).toBe("#ece7de");
      });
    });

    it("validates that all 31 output files exist and match manifest sizes", async () => {
      const content = await fs.readFile(manifestPath, "utf8");
      const manifest = JSON.parse(content);

      for (const entry of manifest) {
        const filePath = path.join(artifactsDir, entry.outputFilename);
        const stats = await fs.stat(filePath);
        expect(stats.size).toBe(entry.outputBytes);
        expect(stats.size).toBeGreaterThan(0);
      }
    });
  });

  describe("Pixel & Color Validation", () => {
    it("validates dimensions, format, absence of alpha, and corner colors for all 31 images", async () => {
      for (let i = 1; i <= 31; i++) {
        const filename = `shoe-${String(i).padStart(2, "0")}.webp`;
        const filePath = path.join(artifactsDir, filename);

        const validation = await validateStoneImagePixels(filePath);
        expect(validation.meta.format).toBe("webp");
        expect(validation.meta.width).toBe(1200);
        expect(validation.meta.height).toBe(1200);
        expect(validation.meta.hasAlpha).toBe(false);

        // Corner background should approximate canonical stone #ece7de [236, 231, 222]
        for (const c of validation.corners) {
          expect(c.delta.r).toBeLessThanOrEqual(6);
          expect(c.delta.g).toBeLessThanOrEqual(6);
          expect(c.delta.b).toBeLessThanOrEqual(6);
        }
      }
    });

    it("rejects corrupted images or images with invalid dimensions", async () => {
      // Test the validator with an intentionally non-conforming image
      const badBuffer = await sharp({
        create: {
          width: 800,
          height: 800,
          channels: 3,
          background: "#ffffff",
        },
      })
        .webp()
        .toBuffer();

      const tempBadPath = path.join(artifactsDir, "temp-bad-test.webp");
      await fs.writeFile(tempBadPath, badBuffer);

      try {
        await expect(validateStoneImagePixels(tempBadPath)).rejects.toThrow(/Expected dimensions 1200x1200/);
      } finally {
        await fs.unlink(tempBadPath).catch(() => {});
      }
    });

    it("rejects images with white border corners", async () => {
      const whiteBuffer = await sharp({
        create: {
          width: 1200,
          height: 1200,
          channels: 3,
          background: "#ffffff",
        },
      })
        .webp()
        .toBuffer();

      const tempWhitePath = path.join(artifactsDir, "temp-white-test.webp");
      await fs.writeFile(tempWhitePath, whiteBuffer);

      try {
        await expect(validateStoneImagePixels(tempWhitePath)).rejects.toThrow(/exceeds/);
      } finally {
        await fs.unlink(tempWhitePath).catch(() => {});
      }
    });
  });

  describe("Determinism & Reproducibility", () => {
    it("produces identical SHA-256 hashes when re-processing an image", async () => {
      const stoneBaseBuffer = await sharp({
        create: {
          width: TARGET_DIMENSION,
          height: TARGET_DIMENSION,
          channels: 3,
          background: CANONICAL_BACKGROUND,
        },
      })
        .raw()
        .toBuffer();

      const sourcePath = path.join(rootDir, "Shoes/ChatGPT Image Sep 13, 2026, 12_15_11 AM.png");

      const runA = async () => {
        const shoe = await sharp(sourcePath)
          .rotate()
          .resize(TARGET_DIMENSION, TARGET_DIMENSION, { fit: "contain", background: "#ffffff" })
          .raw()
          .toBuffer();

        return sharp(stoneBaseBuffer, { raw: { width: TARGET_DIMENSION, height: TARGET_DIMENSION, channels: 3 } })
          .composite([{ input: shoe, raw: { width: TARGET_DIMENSION, height: TARGET_DIMENSION, channels: 3 }, blend: "multiply" }])
          .webp({ quality: WEBP_QUALITY, effort: 5 })
          .toBuffer();
      };

      const buf1 = await runA();
      const buf2 = await runA();

      const hash1 = crypto.createHash("sha256").update(buf1).digest("hex");
      const hash2 = crypto.createHash("sha256").update(buf2).digest("hex");

      expect(hash1).toBe(hash2);
    });
  });

  describe("Visual Equivalence & Contact Sheet", () => {
    it("generates a visual comparison contact sheet covering representative samples", async () => {
      const contactSheetPath = path.join(artifactsDir, "visual-comparison-contact-sheet.webp");
      const stats = await fs.stat(contactSheetPath);
      expect(stats.size).toBeGreaterThan(50000);

      const meta = await sharp(contactSheetPath).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBe(1200); // 2 columns of 600
      expect(meta.height).toBe(3220); // 5 rows * (600 + 44)
    });

    it("verifies sample products have close visual equivalence between A (old+multiply) and B (new stone)", async () => {
      const sampleIndices = ["01", "08", "16", "24", "31"];
      const oldDir = path.join(rootDir, "storefront/public/catalog-shoes");

      for (const numStr of sampleIndices) {
        const oldPath = path.join(oldDir, `shoe-${numStr}.webp`);
        const newPath = path.join(artifactsDir, `shoe-${numStr}.webp`);

        const oldImg = await sharp(oldPath).toBuffer();
        const oldStone = (
          await sharp({
            create: {
              width: TARGET_DIMENSION,
              height: TARGET_DIMENSION,
              channels: 3,
              background: CANONICAL_BACKGROUND,
            },
          })
            .composite([{ input: oldImg, blend: "multiply" }])
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true })
        ).data;

        const newStone = (await sharp(newPath).raw().toBuffer({ resolveWithObject: true })).data;
        expect(oldStone.length).toBe(newStone.length);

        let sumDelta = 0;
        for (let i = 0; i < oldStone.length; i++) {
          sumDelta += Math.abs(oldStone[i] - newStone[i]);
        }
        const avgDelta = sumDelta / oldStone.length;

        // Average pixel delta across all 1.44M pixels should be under 2.5 (out of 255)
        expect(avgDelta).toBeLessThan(2.5);
      }
    });
  });

  describe("Byte Efficiency", () => {
    it("confirms total output bytes do not regress compared to the old assets", async () => {
      const oldDir = path.join(rootDir, "storefront/public/catalog-shoes");
      let oldTotal = 0;
      let newTotal = 0;

      for (let i = 1; i <= 31; i++) {
        const filename = `shoe-${String(i).padStart(2, "0")}.webp`;
        const oldStat = await fs.stat(path.join(oldDir, filename));
        const newStat = await fs.stat(path.join(artifactsDir, filename));

        oldTotal += oldStat.size;
        newTotal += newStat.size;
      }

      // New baked assets should be efficient (no size inflation)
      expect(newTotal).toBeLessThanOrEqual(oldTotal);
    });
  });
});
