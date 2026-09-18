# Media Contract v1 — Architecture & Invariants

> **Status:** Phase 1 Foundation Complete (Backend & DAL landed; storefront cutover deferred to Phase 2).  
> **Authority:** Canonical reference for physical media asset metadata and product placement associations.

---

## 1. Conceptual Model

Media Contract v1 decouples physical media storage from product placement.

```text
media_assets (Physical reusable assets)
      │
      │ 1 : N
      ▼
product_media (Product placement / association)
      ▲
      │ N : 1
      │
   products (Catalog products)
```

### Invariants:
1. **Asset Independence**: A media asset exists globally and independently of any product. Uploading a file registers a `media_assets` record; it does not require attaching to a product.
2. **Plural Placement**: A single physical asset can be referenced by multiple products (or future marketing/hero surfaces) simultaneously without byte duplication.
3. **Deterministic Product Order**: A product's gallery ordering is governed by `product_media.position` (ascending) and `product_media.created_at` (ascending).
4. **Hero Integrity**: A product has at most one hero image (`product_media.is_hero = true`), enforced at the database level via a partial unique index.

---

## 2. Database Schema

### 2.1 `public.media_assets`
Represents the immutable physical asset and its metadata.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `DEFAULT gen_random_uuid()` |
| `storage_provider` | `VARCHAR(50)` | Storage backend identifier: `'legacy_public'` or `'supabase'` |
| `storage_path` | `VARCHAR(500)` | Unique relative asset path (e.g. `/catalog-shoes/shoe-01.webp` or `products/...`) |
| `original_filename`| `VARCHAR(255)` | Source filename at time of upload |
| `mime_type` | `VARCHAR(100)` | MIME type (`image/webp`, `image/avif`, `image/jpeg`, `image/png`) |
| `file_size_bytes` | `BIGINT` | File size in bytes |
| `width` | `INT` | Natural image width in pixels |
| `height` | `INT` | Natural image height in pixels |
| `dominant_color` | `VARCHAR(30)` | Dominant hex color code (e.g. `#887868`) |
| `lqip` | `TEXT` | Base64-encoded low quality image placeholder data URI |
| `processed_variants`| `JSONB` | Multi-resolution responsive derivative mapping (`160`, `320`, `640`, `960`, `1280`, `1600`) |
| `content_sha256` | `VARCHAR(64)` | SHA-256 integrity hash of verified image binary (Phase 5) |
| `created_at` | `TIMESTAMPTZ` | Timestamp of asset creation |
| `updated_at` | `TIMESTAMPTZ` | Timestamp of last metadata update |

**Constraints & Indexes:**
- `CONSTRAINT uq_media_assets_provider_path UNIQUE (storage_provider, storage_path)`
- `INDEX idx_media_assets_provider (storage_provider)`
- `INDEX idx_media_assets_created_at (created_at DESC)`
- `INDEX idx_media_assets_content_sha256 (content_sha256) WHERE content_sha256 IS NOT NULL`
- RLS enabled; revoked from untrusted client roles (`anon`, `authenticated`).

### 2.2 `public.product_media`
Represents product placement, gallery ordering, hero designation, and contextual overrides.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `DEFAULT gen_random_uuid()` |
| `product_id` | `UUID` | Foreign Key to `public.products(id) ON DELETE CASCADE` |
| `media_asset_id` | `UUID` | Foreign Key to `public.media_assets(id) ON DELETE RESTRICT` |
| `position` | `INT` | 0-indexed gallery position for deterministic ordering |
| `is_hero` | `BOOLEAN` | Hero image flag; at most one `true` per product |
| `alt_text` | `VARCHAR(255)` | Accessible alt text customized for this product |
| `created_at` | `TIMESTAMPTZ` | Timestamp of placement creation |
| `updated_at` | `TIMESTAMPTZ` | Timestamp of placement update |

**Constraints & Indexes:**
- `CONSTRAINT uq_product_media_product_asset UNIQUE (product_id, media_asset_id)`
- `UNIQUE INDEX idx_product_media_single_hero (product_id) WHERE is_hero = true`
- `INDEX idx_product_media_product_position (product_id, position ASC, created_at ASC)`
- `INDEX idx_product_media_media_asset_id (media_asset_id)`
- RLS enabled; revoked from untrusted client roles (`anon`, `authenticated`).

---

## 3. Storage Providers & Namespaces

### 3.1 Transitional Providers (Phase 1)
- **`legacy_public`**:
  - Serves root-relative paths like `/catalog-shoes/shoe-NN.webp` from `storefront/public/catalog-shoes/`.
  - Used by the 31 active catalog shoes.
- **`supabase`**:
  - Serves objects from the Supabase Storage `product-media` public bucket.
  - Legacy paths use `products/{productId}/{mediaId}/original.<ext>`.

### 3.2 Preferred Future Storage Namespace (Phase 2+)
To fully decouple physical storage from product ownership, new uploads will use the product-agnostic global asset namespace:
- **Original asset:**
  `media/{assetId}/original.<ext>`
- **Responsive WebP/AVIF derivatives:**
  `media/{assetId}/variants/320.webp`  
  `media/{assetId}/variants/640.webp`  
  `media/{assetId}/variants/960.webp`  
  `media/{assetId}/variants/1280.webp`  

*Note:* Phase 1 does not rename or move existing Supabase storage objects.

---

## 4. Lifecycle & Deletion Semantics

1. **Product Deletion**:
   - `public.product_media` rows are deleted via `ON DELETE CASCADE`.
   - The underlying `public.media_assets` rows remain untouched and reusable.
2. **Asset Detach**:
   - Calling `detachMediaFromProduct(productId, mediaAssetId)` removes the association in `public.product_media`.
   - If the detached item was hero and other media remain, the lowest-position remaining media item is automatically promoted to hero.
   - The underlying `public.media_assets` row remains intact.
3. **Asset Deletion**:
   - Calling `deleteMediaAsset(assetId)` attempts deletion of `public.media_assets`.
   - If the asset is currently referenced by any product, deletion is **strictly prevented** by `ON DELETE RESTRICT` (throwing `MediaDomainError`). The asset must be detached from all products before it can be deleted.

---

## 5. Usage Tracking

To support the future global Media Library UI, `getMediaAssetUsage(assetId)` provides a bounded single query that maps an asset to all referencing products:

```ts
const usage = await getMediaAssetUsage(assetId);
// Returns:
// {
//   assetId: "...",
//   usageCount: 2,
//   products: [
//     { productId: "...", productName: "The Sovereign Oxford", productSlug: "shoe-2026-09-001", position: 0, isHero: true, altText: "..." },
//     { productId: "...", productName: "The Viceroy Wholecut", productSlug: "shoe-2026-09-003", position: 1, isHero: false, altText: "..." }
//   ]
// }
```

---

## 6. Migration & Backfill Behavior

Migration `20260918000000_media_contract_v1.sql` performs an idempotent, forward-compatible backfill:
1. Every existing `public.product_images` row is copied into `public.media_assets`.
   - Classified as `legacy_public` if `storage_path LIKE '/catalog-shoes/%'`.
   - Classified as `supabase` otherwise.
   - All visual metadata (dimensions, dominant color, LQIP, responsive variants, original filename, MIME, file size) is fully preserved.
2. Every product attachment is copied into `public.product_media` preserving `product_id`, `position`, `is_hero`, and `alt_text`.
3. `ON CONFLICT DO NOTHING` ensures the migration is safe to run multiple times without duplicating data.
4. **Rollback Safety**: `public.product_images` is **not** deleted or modified in Phase 1.

---

## 7. Evolution & Storefront Cutover (Phase 4)

As of Phase 4 (`feat/media-v1-storefront-cutover`):
- **Customer Read Authority**: Public catalog reads (`loadPublicCatalogRows`) and checkout order thumbnail snapshots (`createOrderFromCart`) have officially cut over to `public.product_media` joined with `public.media_assets`.
- **Authoritative Heroes**: All 31 canonical products now serve their Supabase stone masters (`media/{assetId}/original.webp`) via `getStoragePublicUrl()`.
- **Non-Legacy Preference & Rollback Exclusion**: The public catalog query excludes `storage_provider = 'legacy_public'` assets when a product has non-legacy Media Contract assets, preventing duplicate white gallery images on PDPs while retaining legacy fallback for unmigrated products.
- **Transitional Preservation**: `public.product_images`, static `/catalog-shoes/`, and `legacy_public` database records are strictly retained for zero-risk code rollback.
- **Runtime Styling Modernization**: Runtime `mix-blend-mode: multiply` has been eliminated from all product cards, PDP media stages, and cart/checkout thumbnails.
- **Stage Color Standardization**: `--pdp-stage` has been harmonized from `#ebe5dc` to canonical `#ece7de`.
- **Admin Media UI Guard**: Legacy `ProductMediaManager` mutation controls have been disabled with a migration banner, preventing silent desynchronization while the global Media Library UI is pending.

