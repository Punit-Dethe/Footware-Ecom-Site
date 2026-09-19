# Media Library Backend — Architecture & Operations (Phase 5)

> **Status:** Production Ready (Server-Side Backend & Upload Pipeline Implemented)  
> **Branch:** `feat/media-library-backend`  
> **Authority:** Technical architecture and implementation reference for the product-independent Media Library backend powering the Mirza Phase 6 admin UI.

---

## 1. Overview & Architectural Decoupling

Phase 5 establishes the server-side Media Library backend that decouples media upload and asset management from product placements:

```text
Browser / Admin Client
      │
      │ 1. Request upload URL (MIME, size, filename)
      ▼
requestMediaLibraryUploadAction (Server Action)
      │ Generates asset UUID
      │ Signs product-independent path: media/{assetId}/original.{ext}
      ▼
Direct-to-Supabase Upload (Browser -> Supabase Storage S3 API)
      │
      │ 2. Finalize upload (assetId, storagePath)
      ▼
finalizeMediaLibraryUploadAction (Server Action)
      │ Downloads buffer from Supabase Storage
      │ Decodes with Sharp: verifies format, dimensions, dominant color, LQIP
      │ Computes SHA-256 integrity hash
      │ Idempotent INSERT into public.media_assets (usage_count = 0)
      ▼
public.media_assets
      │
      │ (Admin assigns asset to product later in Phase 6 UI)
      ▼
attachMediaAssetToProductAction / setProductMediaHeroAction
      │
      ▼
public.product_media ──► public.products
```

### Core Invariants:
1. **Product Independence**: Uploading an asset registers a `public.media_assets` record without creating or requiring a `public.product_media` association.
2. **Direct-to-Storage Ingestion**: Image binaries are streamed directly from client browsers to Supabase Storage signed URLs. Large payload bodies never traverse Next.js Server Action bodies, eliminating Vercel serverless memory and timeout bottlenecks.
3. **Server-Side Validation Authority**: Storage objects are downloaded server-side and decoded using Sharp to ensure untrusted client declarations cannot introduce spoofed MIME types, SVGs, or oversized payloads.
4. **Zero Storefront Mutation**: Storefront public queries (`listCatalogProducts`, `getProductDetailBySlug`, etc.) read exclusively from Media Contract v1; legacy table `public.product_images` was subsequently dropped in Phase 9.
5. **Safe Deletion Sequence**: Deletion removes database records first (guarded by `ON DELETE RESTRICT` foreign keys against concurrent attachment), then cleans up physical storage objects. If physical storage cleanup fails, a structured warning is returned without rolling back the DB delete.

---

## 2. Database Schema & Migration

### Migration: `20260918150000_media_library_content_hash.sql`

Phase 5 adds content integrity hashing to `public.media_assets`:

```sql
ALTER TABLE public.media_assets
ADD COLUMN IF NOT EXISTS content_sha256 VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_media_assets_content_sha256
ON public.media_assets (content_sha256)
WHERE content_sha256 IS NOT NULL;
```

### Asset Schema Summary (`public.media_assets`):
- `id` (UUID, Primary Key)
- `storage_provider` (`'supabase'`; legacy_public retired)
- `storage_path` (`media/{assetId}/original.{ext}`)
- `original_filename` (Source filename at time of upload)
- `mime_type` (`image/webp`, `image/avif`, `image/jpeg`, `image/png`)
- `file_size_bytes` (Exact byte size)
- `width`, `height` (Pixel dimensions)
- `dominant_color` (Hex code `#rrggbb`)
- `lqip` (Base64 data URI `data:image/webp;base64,...`)
- `content_sha256` (64-character hex SHA-256 digest)
- `created_at`, `updated_at` (Timestamps)

---

## 3. Storage Namespaces

| Namespace | Status | Pattern | Description |
| :--- | :--- | :--- | :--- |
| `media/{assetId}/original.{ext}` | **Active (Canonical)** | Global Media Library | Product-agnostic master original asset in Supabase bucket `product-media`. |
| `products/{productId}/...` | **Retained (Historical)** | Legacy Product Media | 26 objects retained for 2 archived products referenced by historical orders and active carts. |
| `/catalog-shoes/shoe-NN.webp` | **Historical Snapshots** | Order Snapshot Fidelity | Exactly 3 static files retained in `storefront/public/catalog-shoes/` for historical order thumbnails. |

---

## 4. Server Actions (`storefront/src/lib/actions/admin-media-library.ts`)

All Media Library actions require admin authorization via `requireAdmin()`. Infrastructure errors are sanitized to prevent leaking database or auth details to callers.

### 4.1 Ingestion Actions

#### `requestMediaLibraryUploadAction(filename, declaredMimeType, byteSize)`
- **Auth**: Enforces `requireAdmin()`.
- **Validation**: Rejects empty filenames, non-image types, SVGs (`image/svg+xml`), and sizes <= 0 or > 10MB.
- **Generation**: Generates server-side UUID (`assetId`) and canonical storage path `media/{assetId}/original.{ext}`.
- **Signed URL**: Issues single-use signed upload token via `createSignedMediaUploadUrl` (valid for 15 minutes).
- **Return**: `{ success: true, assetId, storagePath, signedUrl, token }`.

#### `finalizeMediaLibraryUploadAction(input)`
- **Auth**: Enforces `requireAdmin()`.
- **Untrusted Path Validation**: Rejects path traversal (`..`), enforces pattern `^media/{assetId}/original.(jpg|png|webp|avif)$`, verifies extension matches declared MIME type.
- **Idempotency**: If `storage_path` is already recorded in `public.media_assets`, returns the existing record immediately without re-downloading or re-processing.
- **Storage Verification**: Downloads buffer from Supabase Storage. Cleans up object if download fails.
- **Sharp Decoding**: Decodes buffer, verifies format matches path extension, extracts width, height, dominant color (`#rrggbb`), and LQIP (16x16 WebP data URI).
- **Integrity Hash**: Computes SHA-256 hex digest of verified bytes.
- **Persistence**: Inserts into `public.media_assets`. Cleans up storage object if database insert fails.
- **Return**: `{ success: true, asset: DbMediaAsset }`.

### 4.2 Product Placement Actions

All placement actions invalidate `updateTag("catalog-public")` upon success and operate solely on `public.product_media`.

- **`attachMediaAssetToProductAction(productId, mediaAssetId, options?)`**: Attaches global asset to product with optional `isHero` and `altText`.
- **`detachMediaAssetFromProductAction(productId, mediaAssetId)`**: Detaches asset from product. If the detached asset was hero, promotes the next available gallery item automatically.
- **`setProductMediaHeroAction(productId, mediaAssetId)`**: Atomically demotes existing hero and designates target asset as hero.
- **`reorderProductMediaActionV1(productId, mediaAssetIds)`**: Deterministically updates gallery ordering with normalized 0-based positions. Enforces exact set equality (no additions, omissions, or duplicates).
- **`updateProductMediaAltTextActionV1(productId, mediaAssetId, altText)`**: Updates placement-specific accessible alt text.

### 4.3 Safe Deletion Action

#### `deleteMediaLibraryAssetAction(assetId)`
- **Auth**: Enforces `requireAdmin()`.
- **Usage Guard**: Queries `getMediaAssetUsage(assetId)`. Rejects deletion if `usageCount > 0` with descriptive error listing attached product titles.
- **Deletion Ordering**:
  1. Executes database deletion (`DELETE FROM public.media_assets WHERE id = $1`). This is guarded by foreign key `ON DELETE RESTRICT` in `public.product_media`, preventing race conditions where another admin attaches the image concurrently.
  2. Executes Supabase Storage object cleanup (`deleteStorageObjects([storage_path])`).
  3. If storage deletion fails, logs an alert and returns `{ success: true, warning: "Media asset record deleted from database, but storage cleanup encountered an error. Physical storage object may require manual removal." }`.
  4. Invalidates `updateTag("catalog-public")`.

---

## 5. Read Data Access Layer (`storefront/src/lib/db/media-v1.ts`)

### `listMediaLibraryAssets(params)`
Provides bounded, paginated retrieval for the future Media Library UI:
- **0 N+1 Queries**: Single query using `COUNT(*) OVER() AS full_count` and correlated subquery `(SELECT COUNT(*)::int FROM public.product_media pm WHERE pm.media_asset_id = ma.id) AS usage_count`.
- **Filtering**:
  - `query`: Case-insensitive substring match against `ma.original_filename` and `ma.storage_path`.
  - `provider`: Filter by storage provider (defaults to `'supabase'`; legacy rollback window ended).
  - `sort`: `'created_desc'` (default), `'created_asc'`, `'size_desc'`, `'size_asc'`.
  - `limit`: Bounded between 1 and 100 (default 24).
  - `offset`: Bounded >= 0.
- **Public URL Resolution**: Resolves CDN public URL synchronously for each asset with 0 network calls.

### `getMediaLibraryAsset(id)`
Retrieves full asset details and usage report:
- Asset metadata, resolved public URL, dimensions, colors, LQIP, and SHA-256 hash.
- Complete product usage report (`MediaAssetUsageReport`) listing all attached products with their titles, slugs, positions, and hero statuses.

---

## 6. Verification & Test Coverage

- **Automated Tests**:
  - `src/lib/actions/__tests__/admin-media-library.test.ts`: 28 unit/integration tests covering authentication, upload authorization, validation, Sharp decoding, idempotency, storage cleanup, product placement, and deletion guards.
  - `src/lib/db/__tests__/media-library-dal.test.ts`: 12 unit/integration tests covering single-query pagination, usage counting, search filtering, and alt text updates.
  - Full suite: 70 test files, 785 tests passing.
- **Live Integration Smoke Test**:
  - Direct upload of 200x200 stone `#ece7de` test WebP image to Supabase Storage via signed URL token.
  - Server-side validation with Sharp, LQIP generation, SHA-256 verification, and `public.media_assets` insertion.
  - Verification of public HTTP 200 GET from Supabase Storage CDN.
  - Verified `usage_count = 0`.
  - Safe asset deletion: DB row deleted first, then Storage object removed.
  - Verified initial counts preserved: exactly 100 `media_assets` and 100 `product_media` rows.
