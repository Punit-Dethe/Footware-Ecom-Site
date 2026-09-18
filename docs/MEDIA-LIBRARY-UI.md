# Mirza Media Modernization — Phase 6A: Editorial Admin Foundation & Global Media Library UI

## 1. Executive Summary

Phase 6A establishes the visual foundation and first user-facing administrative interface for the Mirza admin console. It replaces the generic gray SaaS admin aesthetic with the Mirza editorial visual language and deploys the standalone Media Library at `/[country]/[locale]/admin/media`.

This implementation builds directly on the server-side media infrastructure established in Phase 5 (`public.media_assets`, direct signed Supabase uploads, server-side Sharp verification, usage tracking, safe deletion).

---

## 2. Route Architecture & Direct Authorization

### Route Structure
```
storefront/src/app/[country]/[locale]/(admin)/
├── layout.tsx                                # Shared Studio Shell & Access Restricted View
└── admin/
    ├── page.tsx                             # Redirects to /admin/products
    ├── products/                            # Products management (Phase 6B target)
    ├── categories/                          # Category management
    └── media/                               # Standalone Media Library (Phase 6A)
        ├── page.tsx                         # Server Component with requireAdmin() & DAL query
        └── __tests__/
            └── media-library-ui.test.ts     # Route auth, params parsing, and detail action tests
```

### Authorization Contract
- Layout-level and page-level enforcement via `requireAdmin()`.
- Unauthenticated or non-admin callers are intercepted and presented with the Mirza Studio **Access Restricted** screen (warm cream surface, Cormorant Garamond typography, clear actions to sign in or return to the storefront).
- Zero customer-facing or unauthenticated data leakage.
- Direct invocation of `connection()` in Next.js Server Components ensuring strict dynamic request evaluation.

---

## 3. Visual System & Design Tokens (`admin.css`)

All admin styling is strictly scoped to administrative routes and components via `storefront/src/app/admin.css`. It does not bleed into the customer-facing storefront.

### Core Color Palette
| Token | Hex Value | Purpose |
|---|---|---|
| `--admin-bg` | `#f3efe8` | Warm cream primary canvas |
| `--admin-card-bg` | `#fffefc` | Crisp off-white card/container surface |
| `--admin-stone` | `#ece7de` | Canonical product stage / image frame background |
| `--admin-field` | `#e9e2d6` | Input background & secondary controls |
| `--admin-ink` | `#30261f` | Deep warm ink primary text |
| `--admin-text-muted` | `#706257` | Muted secondary editorial copy |
| `--admin-border` | `#cfc4b6` | Delicate warm structural borders & dividers |
| `--admin-border-subtle` | `#e5ddd0` | Subtle internal dividers |

### Typography
- **Headings & Brand**: Cormorant Garamond / EB Garamond (`var(--font-editorial)` / serif), high-contrast uppercase brand headers.
- **Body & UI Controls**: Geist Sans (`var(--font-geist)`), legible proportions, balanced tracking (`tracking-wide`, `tracking-widest`).
- **Technical Specs**: Geist Mono (`var(--font-geist-mono)` / monospace) for dimensions, hashes, byte counts, and UUIDs.

---

## 4. Media Library Listing & Query Parameters

The Media Library listing at `/[country]/[locale]/admin/media` supports deep-linkable URL search parameters:

| Parameter | Type | Default | Behavior |
|---|---|---|---|
| `q` | `string` | `""` | Case-insensitive search on `original_filename` or `storage_path`. Debounced at 350ms on client. |
| `provider` | `supabase \| all \| legacy_public` | `"supabase"` | Defaults to managed Supabase assets. Prevents 31 legacy rollback copies from dominating view while retaining explicit access via "Legacy Rollback" tab. |
| `sort` | `created_desc \| created_asc \| size_desc \| size_asc` | `"created_desc"` | Sorts assets chronologically or by file size. |
| `page` | `number` | `1` | 1-indexed pagination (bounded at 24 assets per page). |

### Visual Layout & States
- **Grid Layout**: Responsive grid transitioning from 2 columns on mobile (390px), 3 on tablet (768px), 4 on small desktop (1280px), to 5 columns on wide desktop (1920px).
- **Asset Cards**:
  - Baked `#ece7de` stone frame displaying WebP thumbnail with progressive LQIP blur-up.
  - Truncated filename and dimensions (`WIDTH × HEIGHT`).
  - Status badges: `Used Nx` (charcoal), `Unused` (muted amber/neutral), `Rollback` (terracotta).
- **Empty State**: Editorial card explaining zero results with quick action to clear search/filters.

---

## 5. Direct-to-Supabase Upload Pipeline (`MediaUploadModal`)

### Lifecycle Architecture
```
Browser (User drops file)
       │
       ▼
1. Client-Side Pre-Validation (MIME: WebP/PNG/JPEG/AVIF, Max Size: 10MB)
       │
       ▼
2. requestMediaLibraryUploadAction (Server Action)
       │──> requireAdmin()
       │──> Generates UUID assetId & storagePath (media/{assetId}/original.webp)
       │──> Generates Supabase signed upload URL token via Service Role
       ▼
3. uploadToSignedUrl (Browser -> Supabase Storage Direct)
       │──> Direct client upload via publishable anon key + signed token
       │──> ZERO binary bytes pass through Vercel serverless compute
       ▼
4. finalizeMediaLibraryUploadAction (Server Action)
       │──> requireAdmin()
       │──> Downloads buffer server-side to temporary memory
       │──> Sharp decoding, verification, SHA-256 computation
       │──> Generates 16x16 LQIP & dominant color hex
       │──> Inserts row into public.media_assets
       ▼
5. router.refresh() (Client updates library view without page reload)
```

---

## 6. Slide-Over Inspector Drawer & Safe Delete UX (`MediaDetailDrawer`)

### Inspector Capabilities
- High-resolution preview on `#ece7de` stone stage with link to open direct storage master in new tab.
- **Physical Specifications**:
  - Dimensions (`width × height px`).
  - MIME type / format.
  - File size formatted in KB/MB.
  - Dominant color swatch and hex code.
  - Content SHA-256 digest with one-click copy button.
  - Storage provider and upload timestamp.
- **Product Placements**:
  - Real-time product placements fetched via `getMediaLibraryAssetDetailAction(assetId)`.
  - Displays linked product names, position, hero badge (`Hero Asset`), and direct link to edit the product (`/admin/products/[id]`).
- **Safe Delete Guards**:
  - If `usageCount > 0`: Delete button is permanently disabled with tooltip: `"Cannot delete asset attached to N product(s). Detach from all products first."`
  - If `storage_provider === 'legacy_public'`: Delete button is disabled with tooltip: `"Legacy rollback assets are protected from deletion."`
  - If `usageCount === 0` and managed by Supabase: Delete button is enabled. Clicking triggers an editorial confirmation dialog before executing `deleteMediaLibraryAssetAction`.

---

## 7. Scope Boundaries & Progression

### Phase 6A Implemented:
- Shared Mirza Studio top shell and navigation tabs (`Products`, `Categories`, `Media`).
- Access Restricted gate and typography.
- Standalone Media Library listing, search, filtering, and pagination.
- Direct-to-Supabase upload modal with Sharp finalization.
- Slide-over asset inspector drawer with live placement reports.
- Protected safe deletion UX.

---

## 8. Phase 6B: Product ↔ Media Library Integration

Phase 6B completes the product media management workflow within the Mirza admin console (`/admin/products/[id]`).

### Key Highlights:
1. **Admin Product Detail Authority**:
   - `AdminProductDetail.media` replaces legacy `images: DbProductImageRow[]`.
   - `getAdminProduct` and `getAdminProductWithClient` load placements via `listProductMediaV1(productId)`.
   - Complete elimination of active admin read dependencies on `public.product_images`.
2. **Rollback Media Isolation**:
   - `storage_provider = 'legacy_public'` assets are excluded from the editable hero and gallery.
   - Retained quietly as a read-only technical footnote: `1 legacy asset retained internally for safe rollback (not visible to customers). Read-only • Phase 9 cleanup`.
   - Zero action buttons (`Make Hero`, `Remove`, `Reorder`) exposed on rollback copies.
3. **Select from Library Picker (`ProductMediaLibraryPicker`)**:
   - Accessible Radix UI dialog with focus trap, Escape dismissal, and focus restoration.
   - Consumes `listMediaLibraryAssetsAction` with pagination (12 assets/page), search (`q`), and sorting (`newest/oldest`).
   - Multi-select capability (`Attach N Media`).
   - Already-attached assets display an `ATTACHED` badge and are disabled from re-selection.
4. **Direct Upload from Product Edit**:
   - Integrated with `MediaUploadModal`. Global asset is uploaded and finalized first, then immediately attached to the current product.
5. **Hero & Gallery Management**:
   - Prominent, clear Hero Image stage with dimensions, file size, and inline alt text editor.
   - Reorderable gallery with keyboard fallback controls (`Move Left`, `Move Right`).
   - Promotion of any gallery item to hero via `setProductMediaHeroAction`.
6. **Active Product Last-Media & Hero Safety**:
   - Enforced server-side: active products cannot detach their final managed media asset (`Active products must retain at least one managed image. Attach a replacement before removing this asset.`).
   - Detaching a hero automatically promotes the next lowest-position managed asset.
   - `validatePublishInvariants` strictly requires at least one non-legacy managed media asset before activating a product.
7. **Unsaved Form State Protection**:
   - `ProductMediaManager` maintains independent mutation state and re-queries placements via `getProductMediaV1Action(productId)`.
   - Never calls full-page `router.refresh()` which would wipe unsaved product text or variant edits.
8. **Live Storefront Consistency**:
   - All media actions invalidate the `catalog-public` cache tag.

