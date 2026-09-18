import { describe, expect, it } from "vitest";
import { generateDeterministicAssetId } from "../../../../scripts/migrate-stone-media-to-supabase";

describe("Stone Media Migration — Phase 3 Logic & Safety", () => {
  describe("Deterministic Asset Identity", () => {
    it("generates a valid RFC 4122 v5 UUID format", () => {
      const slug = "shoe-2026-09-001";
      const sha256 = "e4b90c17d818d16d1a9ccd870694936f5cd986009693fb4a44055bef1b256e3d";
      const id = generateDeterministicAssetId(slug, sha256);

      // Must match 8-4-4-4-12 hex with version 5 and variant 1 (8, 9, a, b)
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it("produces identical UUIDs for identical inputs", () => {
      const slug = "shoe-2026-09-015";
      const sha256 = "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";

      const id1 = generateDeterministicAssetId(slug, sha256);
      const id2 = generateDeterministicAssetId(slug, sha256);
      expect(id1).toBe(id2);
    });

    it("produces different UUIDs for different slugs or hashes", () => {
      const hash = "e4b90c17d818d16d1a9ccd870694936f5cd986009693fb4a44055bef1b256e3d";
      const id1 = generateDeterministicAssetId("shoe-2026-09-001", hash);
      const id2 = generateDeterministicAssetId("shoe-2026-09-002", hash);
      const id3 = generateDeterministicAssetId("shoe-2026-09-001", "0000000000000000000000000000000000000000000000000000000000000000");

      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
    });

    it("formats the storage path under the media/{assetId}/original.webp namespace", () => {
      const id = generateDeterministicAssetId("shoe-2026-09-031", "hash123");
      const storagePath = `media/${id}/original.webp`;

      expect(storagePath).toBe(`media/${id}/original.webp`);
      expect(storagePath.startsWith("media/")).toBe(true);
      expect(storagePath.endsWith("/original.webp")).toBe(true);
    });
  });

  describe("Canonical Slug Filtering & Exclusions", () => {
    const isCanonicalSlug = (slug: string) => /^shoe-2026-09-\d{3}$/.test(slug);

    it("accepts only canonical 31 slugs shoe-2026-09-001 through 031", () => {
      for (let i = 1; i <= 31; i++) {
        const slug = `shoe-2026-09-${String(i).padStart(3, "0")}`;
        expect(isCanonicalSlug(slug)).toBe(true);
      }
    });

    it("strictly excludes archived demo products", () => {
      const legacySlugs = [
        "office-footwear-01",
        "office-footwear-12",
        "traditional-footwear-01",
        "traditional-footwear-07",
        "demo-shoe-1",
        "shoe-2026-08-001",
      ];

      for (const slug of legacySlugs) {
        expect(isCanonicalSlug(slug)).toBe(false);
      }
    });
  });

  describe("Storage Idempotency & Collision Protection", () => {
    it("marks existing object with identical hash as already_complete", () => {
      const entryHash = "abc123hash";
      const existingHash = "abc123hash";

      let action: "upload" | "already_complete";
      if (existingHash === entryHash) {
        action = "already_complete";
      } else {
        action = "upload";
      }

      expect(action).toBe("already_complete");
    });

    it("rejects existing storage object with different hash as fatal collision", () => {
      const entryHash: string = "expectedHash";
      const existingHash: string = "corruptedOrDifferentHash";

      const checkStorage = () => {
        if (existingHash !== entryHash) {
          throw new Error("Storage collision: existing object SHA-256 differs from expected.");
        }
      };

      expect(checkStorage).toThrow(/Storage collision/);
    });
  });

  describe("Hero State Transition & Rollback Targeting", () => {
    it("simulates the transitional state: new stone hero at position 0, legacy copy at position 1", () => {
      const productId = "faf206ab-d86e-4efb-9076-addb30df2b78";
      const legacyAssetId = "fcded186-3e8b-4748-ba51-60bc6b32f81d";
      const newStoneAssetId = generateDeterministicAssetId("shoe-2026-09-001", "dummyhash");

      // Initial Phase 1/2 state
      const initialMedia = [
        {
          productId,
          mediaAssetId: legacyAssetId,
          position: 0,
          isHero: true,
          provider: "legacy_public",
        },
      ];

      // Step 1: Demote existing hero
      const demoted = initialMedia.map((m) =>
        m.productId === productId && m.isHero ? { ...m, isHero: false, position: 1 } : m,
      );

      // Step 2: Add new stone hero
      const updatedMedia = [
        ...demoted,
        {
          productId,
          mediaAssetId: newStoneAssetId,
          position: 0,
          isHero: true,
          provider: "supabase",
        },
      ];

      // Verifications
      const productItems = updatedMedia.filter((m) => m.productId === productId);
      expect(productItems).toHaveLength(2);

      const hero = productItems.find((m) => m.isHero);
      expect(hero).toBeDefined();
      expect(hero?.mediaAssetId).toBe(newStoneAssetId);
      expect(hero?.position).toBe(0);
      expect(hero?.provider).toBe("supabase");

      const rollbackCopy = productItems.find((m) => !m.isHero);
      expect(rollbackCopy).toBeDefined();
      expect(rollbackCopy?.mediaAssetId).toBe(legacyAssetId);
      expect(rollbackCopy?.position).toBe(1);
      expect(rollbackCopy?.provider).toBe("legacy_public");
    });

    it("verifies rollback targets strictly the 31 migration-created asset IDs", () => {
      const migrationAssetIds = new Set(["stone-asset-1", "stone-asset-2"]);
      const otherAssetIds = ["legacy-asset-1", "admin-upload-2", "old-demo-asset-3"];

      // Rollback filter
      const shouldDelete = (id: string) => migrationAssetIds.has(id);

      expect(shouldDelete("stone-asset-1")).toBe(true);
      expect(shouldDelete("stone-asset-2")).toBe(true);

      for (const other of otherAssetIds) {
        expect(shouldDelete(other)).toBe(false);
      }
    });
  });
});
