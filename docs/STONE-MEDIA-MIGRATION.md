# Mirza Stone Media Migration (Phase 3)

> Supabase Stone-Asset Migration and Canonical Product Association for the 31-shoe catalog.

---

## 1. Executive Summary

Phase 3 uploaded the 31 accepted deterministic stone-baked WebP master images (`#ece7de` baked directly into the pixels) into Supabase Storage, registered them in `public.media_assets`, and attached them as the new heroes in `public.product_media` across all 31 canonical products.

### Critical Safety Invariants
1. **Zero Customer Impact**: `public.product_images` was **NOT** modified. The live storefront continues reading from `/catalog-shoes/shoe-NN.webp`.
2. **Deterministic Identities**: Asset UUIDs are derived deterministically using RFC 4122 v5 over `slug:sha256` under the fixed Mirza media namespace (`e8c07e26-f762-4b71-b0e6-54a7c0618031`).
3. **Deterministic Storage Path**: All uploaded objects reside at `media/{assetId}/original.webp` in bucket `product-media`.
4. **Idempotency**: Rerunning the migration plan in dry-run mode detects that all 31 storage objects and database associations are already converged, proposing 0 uploads and 0 database updates.
5. **Rollback Safety**: Legacy `legacy_public` assets remain attached to each canonical product at position 1 as rollback copies (`is_hero = false`). Rollback targets strictly the 31 migration-created asset IDs.

---

## 2. Global Database State Progression

| Table / Metric | Phase 1 Baseline | Phase 3 Completed | Delta | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **`public.media_assets`** | 69 | **100** | +31 | 31 new stone masters (`storage_provider = 'supabase'`) |
| **`public.product_media`** | 69 | **100** | +31 | 31 new stone hero attachments (`is_hero = true, position = 0`) |
| **`public.product_images`** | 69 | **69** | **0** | **Untouched** (storefront read path preserved) |
| **`public.products`** | 69 total (31 active, 38 archived) | 69 total | **0** | **Untouched** (no products created, deleted, or IDs changed) |
| **`public.variants`** | 368 total | 368 total | **0** | **Untouched** |

---

## 3. Canonical Product Placement State (Transitional)

For each of the 31 canonical products (`shoe-2026-09-001` through `shoe-2026-09-031`):

```text
Product (shoe-2026-09-NN)
  ├── product_media [position: 0, is_hero: true]  → media_assets (supabase, media/{assetId}/original.webp) [NEW STONE HERO]
  └── product_media [position: 1, is_hero: false] → media_assets (legacy_public, /catalog-shoes/shoe-NN.webp) [ROLLBACK COPY]
```

- **Canonical Products Targeted**: Exactly 31
- **Products with Exactly 1 Stone Hero**: 31 / 31 (100%)
- **Products Retaining Legacy Rollback Copy**: 31 / 31 (100%)
- **Orphan `product_media` rows**: 0
- **Orphan new `media_assets` rows**: 0

---

## 4. Supabase Storage Contract

- **Bucket**: `product-media`
- **Target Namespace**: `media/{assetId}/original.webp`
- **MIME Type**: `image/webp`
- **Dimensions**: 1200 × 1200
- **Quality**: 84 (effort 5)
- **Public URL Verification**: All 31 objects verified via public HTTP GET (200 OK, `image/webp`, exact byte length and SHA-256 match).

---

## 5. Operational Script Usage

The migration script is located at `storefront/scripts/migrate-stone-media-to-supabase.ts`.

### Migration Dry-Run (Default)
```bash
pnpm --prefix storefront exec tsx scripts/migrate-stone-media-to-supabase.ts
```

### Migration Apply
```bash
pnpm --prefix storefront exec tsx scripts/migrate-stone-media-to-supabase.ts --apply
```

### Rollback Dry-Run
```bash
pnpm --prefix storefront exec tsx scripts/migrate-stone-media-to-supabase.ts --rollback
```

### Rollback Apply
```bash
pnpm --prefix storefront exec tsx scripts/migrate-stone-media-to-supabase.ts --rollback --apply
```

---

## 6. Operational Evidence

Operational manifest generated locally (gitignored):
`artifacts/media-v1/supabase-stone-migration.json`

Records:
- `productId`
- `productSlug`
- `legacyMediaAssetId`
- `legacyStoragePath`
- `newStoneMediaAssetId`
- `newStoragePath`
- `publicUrl`
- `imageSha256`
- `fileSize`
- `width` / `height`
- `resultingHeroState`
