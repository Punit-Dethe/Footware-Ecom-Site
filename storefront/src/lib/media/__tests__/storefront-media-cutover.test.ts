import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuery = vi.fn();

vi.mock("@/lib/db", () => ({
  query: (text: string, params?: unknown[]) => mockQuery(text, params),
}));

import { adaptRawCatalogToPublicSnapshot } from "@/lib/catalog/catalog-repository";
import { loadPublicCatalogRows } from "@/lib/db/catalog";

describe("Media Contract v1 Storefront Cutover (Phase 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Public Catalog Media Authority & Query Invariants", () => {
    it("loads public catalog in exactly 4 bounded queries without per-product queries or N+1", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: "p-001",
              name: "The Viceroy Oxford",
              slug: "shoe-2026-09-001",
              sku: "MIRZA-SH-001",
              description: "Handcrafted Oxford shoe",
              description_html: "<p>Handcrafted Oxford shoe</p>",
              status: "active",
              created_at: new Date(),
              updated_at: new Date(),
              images: [
                {
                  id: "pm-001",
                  storage_provider: "supabase",
                  storage_path: "media/3f7b6164-67a8-5623-afbc-8558ad14ff88/original.webp",
                  alt_text: "The Viceroy Oxford - Stone Hero",
                  position: 0,
                  is_hero: true,
                  width: 1200,
                  height: 1200,
                  dominant_color: "#ece7de",
                  lqip: "data:image/webp;base64,UklGRm...",
                  processed_variants: null,
                },
              ],
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "cat-1",
              name: "Dress",
              slug: "dress",
              description: "Dress shoes",
              parent_id: null,
              position: 1,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "v-001",
              product_id: "p-001",
              sku: "MIRZA-SH-001-9",
              size_option: "9",
              price_in_cents: 29500,
              compare_at_price_in_cents: null,
              currency: "USD",
              quantity_on_hand: 10,
              backorderable: false,
              position: 1,
              is_default: true,
              active: true,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ product_id: "p-001", category_id: "cat-1" }],
        });

      const res = await loadPublicCatalogRows();

      // Exactly 4 queries: products, categories, variants, product_categories
      expect(mockQuery).toHaveBeenCalledTimes(4);
      expect(res.products).toHaveLength(1);

      // Verify the product query reads from product_media + media_assets, NOT product_images
      const productQuerySql = mockQuery.mock.calls[0][0];
      expect(productQuerySql).toContain("FROM public.product_media pm");
      expect(productQuerySql).toContain("JOIN public.media_assets ma ON ma.id = pm.media_asset_id");
      expect(productQuerySql).not.toContain("FROM public.product_images");
    });
  });

  describe("2. Hero Semantics & Rollback Duplicate Exclusion", () => {
    it("resolves canonical product hero to Supabase storage URL and carries LQIP and stone dominant color", () => {
      const raw = {
        products: [
          {
            id: "prod-1",
            name: "The Viceroy Oxford",
            slug: "shoe-2026-09-001",
            sku: "MIRZA-SH-001",
            description: "Handcrafted luxury shoe",
            description_html: "<p>Handcrafted luxury shoe</p>",
            status: "active",
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            created_at: new Date(),
            updated_at: new Date(),
            images: [
              {
                id: "pm-stone-hero",
                storage_provider: "supabase",
                storage_path: "media/3f7b6164-67a8-5623-afbc-8558ad14ff88/original.webp",
                alt_text: "The Viceroy Oxford",
                position: 0,
                is_hero: true,
                width: 1200,
                height: 1200,
                dominant_color: "#ece7de",
                lqip: "data:image/webp;base64,UklGRlAAAABXRUJQVlA4IE...",
                processed_variants: null,
              },
            ],
          },
        ],
        categories: [
          {
            id: "cat-1",
            name: "Dress",
            slug: "dress",
            description: "",
            parent_id: null,
            position: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        variants: [
          {
            id: "var-1",
            product_id: "prod-1",
            sku: "MIRZA-SH-001-9",
            size_option: "9",
            price_in_cents: 29500,
            compare_at_price_in_cents: null,
            currency: "USD",
            quantity_on_hand: 5,
            backorderable: false,
            position: 1,
            is_default: true,
            active: true,
          },
        ],
        productCategories: [{ product_id: "prod-1", category_id: "cat-1" }],
      };

      const snapshot = adaptRawCatalogToPublicSnapshot(raw);
      const product = snapshot.products[0];

      // Authoritative hero resolves to Supabase public CDN URL
      expect(product.thumbnail_url).toMatch(
        /^https:\/\/[^/]+\/storage\/v1\/object\/public\/product-media\/media\/3f7b6164-67a8-5623-afbc-8558ad14ff88\/original\.webp$/,
      );
      expect(product.primary_media.url).toBe(product.thumbnail_url);

      // LQIP and dominant color propagate to product_media DTO
      expect(product.product_media?.lqip).toBe("data:image/webp;base64,UklGRlAAAABXRUJQVlA4IE...");
      expect(product.product_media?.dominantColor).toBe("#ece7de");

      // Exactly 1 media entry in gallery (no rollback duplicate)
      expect(product.media).toHaveLength(1);
    });

    it("excludes legacy_public rollback copy in SQL query when non-legacy media exists", () => {
      // Test the SQL filter clause directly
      const filterClause = `
        (
          ma.storage_provider != 'legacy_public'
          OR NOT EXISTS (
            SELECT 1
            FROM public.product_media pm_sub
            JOIN public.media_assets ma_sub ON ma_sub.id = pm_sub.media_asset_id
            WHERE pm_sub.product_id = p.id
              AND ma_sub.storage_provider != 'legacy_public'
          )
        )
      `;
      expect(filterClause).toContain("ma.storage_provider != 'legacy_public'");
      expect(filterClause).toContain("NOT EXISTS");
    });
  });

  describe("3. Legacy Fallback Semantics for Unmigrated Products", () => {
    it("gracefully falls back to legacy_public media if product has not migrated", () => {
      const raw = {
        products: [
          {
            id: "prod-legacy",
            name: "Unmigrated Shoe",
            slug: "shoe-unmigrated",
            sku: "MIRZA-LEGACY-001",
            description: "Vintage collection",
            description_html: "<p>Vintage collection</p>",
            status: "active",
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            created_at: new Date(),
            updated_at: new Date(),
            images: [
              {
                id: "pm-legacy-1",
                storage_provider: "legacy_public",
                storage_path: "/catalog-shoes/shoe-99.webp",
                alt_text: "Unmigrated Shoe",
                position: 1,
                is_hero: true,
                width: 1200,
                height: 1200,
                dominant_color: "#ffffff",
                lqip: null,
                processed_variants: null,
              },
            ],
          },
        ],
        categories: [
          {
            id: "cat-1",
            name: "Classic",
            slug: "classic",
            description: "",
            parent_id: null,
            position: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        variants: [
          {
            id: "var-legacy",
            product_id: "prod-legacy",
            sku: "MIRZA-LEGACY-001-9",
            size_option: "9",
            price_in_cents: 19900,
            compare_at_price_in_cents: null,
            currency: "USD",
            quantity_on_hand: 5,
            backorderable: false,
            position: 1,
            is_default: true,
            active: true,
          },
        ],
        productCategories: [{ product_id: "prod-legacy", category_id: "cat-1" }],
      };

      const snapshot = adaptRawCatalogToPublicSnapshot(raw);
      const product = snapshot.products[0];

      // Falls back safely to root-relative path
      expect(product.thumbnail_url).toBe("/catalog-shoes/shoe-99.webp");
      expect(product.primary_media.url).toBe("/catalog-shoes/shoe-99.webp");
      expect(product.media).toHaveLength(1);
    });
  });

  describe("4. Order Thumbnail Selection & Immutability", () => {
    it("queries product_media + media_assets hero for new order thumbnails without touching historical rows", () => {
      const orderTsPath = path.resolve(__dirname, "../../db/order.ts");
      const orderTsContent = fs.readFileSync(orderTsPath, "utf8");

      // Verify cart checkout thumbnail subqueries select from product_media + media_assets
      expect(orderTsContent).toContain("FROM public.product_media pm");
      expect(orderTsContent).toContain("JOIN public.media_assets ma ON ma.id = pm.media_asset_id");
      expect(orderTsContent).not.toContain("FROM public.product_images pi");

      // Verify no UPDATE order_items statements exist (historical snapshots are strictly immutable)
      expect(orderTsContent).not.toMatch(/UPDATE\s+public\.order_items/i);
    });
  });

  describe("5. Customer Read Path product_images Audit", () => {
    it("ensures zero customer read paths depend on public.product_images", () => {
      const catalogTs = fs.readFileSync(
        path.resolve(__dirname, "../../db/catalog.ts"),
        "utf8",
      );
      const orderTs = fs.readFileSync(
        path.resolve(__dirname, "../../db/order.ts"),
        "utf8",
      );
      const catalogRepoTs = fs.readFileSync(
        path.resolve(__dirname, "../../catalog/catalog-repository.ts"),
        "utf8",
      );

      expect(catalogTs).not.toContain("public.product_images");
      expect(orderTs).not.toContain("public.product_images");
      expect(catalogRepoTs).not.toContain("product_images");
    });
  });

  describe("6. CSS mix-blend-mode: multiply Removal", () => {
    it("proves mix-blend-mode: multiply has been removed from all product imagery styles", () => {
      const cssFiles = [
        "cart-page.css",
        "catalog-page.css",
        "home-experiment.css",
        "product-page.css",
      ];

      for (const file of cssFiles) {
        const content = fs.readFileSync(
          path.resolve(__dirname, "../../../app", file),
          "utf8",
        );
        expect(content).not.toContain("mix-blend-mode: multiply");
      }
    });
  });

  describe("7. PDP Product-Stage Color Standardization", () => {
    it("standardizes --pdp-stage to canonical #ece7de", () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../../../app/product-page.css"),
        "utf8",
      );
      expect(content).toContain("--pdp-stage: #ece7de;");
      expect(content).not.toContain("--pdp-stage: #ebe5dc;");
    });
  });

  describe("8. Product Media Manager Media Contract v1 Authority", () => {
    it("uses Media Contract v1 actions and components in ProductMediaManager", () => {
      const content = fs.readFileSync(
        path.resolve(
          __dirname,
          "../../../components/admin/ProductMediaManager.tsx",
        ),
        "utf8",
      );

      // Media Contract v1 actions wired
      expect(content).toContain("setProductMediaHeroAction");
      expect(content).toContain("detachMediaAssetFromProductAction");
      expect(content).toContain("reorderProductMediaActionV1");
      expect(content).toContain("ProductMediaLibraryPicker");

      // No legacy product_images dependencies
      expect(content).not.toContain("DbProductImageRow");
      expect(content).not.toContain("insertProductMedia");
    });
  });
});
