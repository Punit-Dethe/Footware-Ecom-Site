# Mirza Admin Studio — Operational Documentation

> Canonical architectural and operational guide for the Mirza Admin Studio (Phase 7).

---

## 1. Visual System & Design Tokens

The Mirza Admin Studio shares the editorial design system established by the customer-facing storefront, tailored for an operational control plane:

* **Canvas & Surface Tokens**:
  * `--admin-canvas`: `#FAF8F5` (warm cream background canvas)
  * `--admin-surface`: `#FFFFFF` (elevated editorial content surface)
  * `--admin-secondary`: `#F5F2EC` (secondary structural stone fields)
  * `--admin-stone`: `#EFECE6` (image frames and muted input backgrounds)
  * `--admin-border`: `#E5E0D8` (subtle hairline dividers and field borders)
  * `--admin-border-subtle`: `#EDE8E1` (internal table and card separators)
* **Typography Tokens**:
  * `--admin-ink`: `#1A1A1A` (primary text and button backgrounds)
  * `--admin-muted`: `#73706B` (secondary labels, metadata, and timestamps)
  * `--font-editorial-display`: Serif display face for catalog titles and page headers.
  * `--font-editorial-text`: Serif text face for editorial blurbs and descriptions.
  * `--font-geist`: Clean monospace/sans face for operational metrics, inputs, tables, and SKU codes.
* **Aesthetic Principles**:
  * Flat surfaces, thin warm rules, deliberate whitespace, and restrained geometry.
  * Replaced generic SaaS patterns (gray cards, shadow-sm, giant green/amber badges, browser alerts/confirms).
  * Dark warm ink primary actions and quiet uppercase operational status indicators.

---

## 2. Route Architecture & Pages

All admin routes reside under `src/app/[country]/[locale]/(admin)/admin` and require authenticated admin role enforcement via `requireAdmin()` (backed by Supabase verified JWT claims).

### Overview (`/admin`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/page.tsx`
* **Data Access**: `getAdminCatalogOverview()`
* **Behavior**:
  * Replaced previous redirect to `/admin/products`.
  * Displays an editorial catalog overview sheet with 6 key operational metrics:
    * Total Products, Active Products, Drafts, Archived Products, Total Categories, Managed Media Assets, Total Variants, Total Catalog Stock, and Active Products with Zero Stock.
  * Displays recently updated products with direct Media Contract v1 hero thumbnails and quick links to edit.
  * Quick work links to New Product, Media Library, and Categories.
  * Bound to exactly 2 SQL queries; 0 N+1 queries.

### Products Index (`/admin/products`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/products/page.tsx`
* **Data Access**: `listAdminProductsPage({ query, status, categoryId, sort, page, pageSize })`
* **Features**:
  * URL-addressable state: `?q=&status=&category=&sort=&page=`.
  * Multi-field search (name, slug, base SKU).
  * Filter by lifecycle status (`all`, `active`, `draft`, `archived`) and category.
  * Sort options: Recently updated, Name A–Z, Stock low→high, Stock high→low.
  * Default pagination: 30 items per page with total count and page range indicator.
  * Compact editorial table rendering: Media Contract v1 hero thumbnail, product title, slug/SKU, quiet status indicator, category tags, variant count, price range, stock on hand, and relative last updated timestamp.
  * Bounded single-CTE aggregation query; zero N+1 database lookups; zero legacy `product_images` queries.

### Product Edit (`/admin/products/[id]`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/products/[id]/page.tsx`
* **Component**: `ProductEditForm.tsx`
* **Features**:
  * Editorial display header with live storefront link (`View on storefront ↗`) for active products.
  * Restrained sticky action bar with Save Draft / Save Changes, Publish, Archive, and Restore lifecycle actions.
  * Radix Dialog confirmation for product archiving (replaces browser `confirm()`).
  * Unsaved dirty state indicator alerting operators of pending changes before submission.
  * Category membership selector using clean, accessible checkbox rows.
  * Embedded **Product Media Manager** (Phase 6B accepted component) with full Media Contract v1 upload, attachment, hero promotion, reordering, and alt text editing preserved without regression.
  * Unsaved form metadata is preserved across media attachment and detachment operations.
  * Compact editorial variants table supporting inline pricing, compare-at, stock, backorder toggling, and default variant switching.
  * Search & Meta (SEO) fields for title, description, and keywords.

### New Product (`/admin/products/new`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/products/new/page.tsx`
* **Component**: `ProductNewForm.tsx`
* **Workflow**:
  * Enforces the standard draft-first creation workflow: products are created as drafts so imagery, variants, and publishing invariants can be fulfilled in Product Edit prior to release.
  * Fields: Product name, slug (with auto-generation), optional base SKU, description, and initial category assignment.
  * Tasteful helper notice explaining the draft lifecycle requirement.

### Categories (`/admin/categories`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/categories/page.tsx`
* **Component**: `CategoryManager.tsx`
* **Features**:
  * Clean editorial table showing category name, slug, description, parent category, and product count.
  * Radix Dialog for category creation and editing with validation and focus management (replaces browser `alert()` and `confirm()`).
  * Radix Safe Delete Dialog:
    * If `productCount > 0`, blocks deletion with an informative explanation: *"This category contains N products and cannot be deleted."*
    * If `productCount === 0`, prompts for operator confirmation before executing atomic safe deletion.

### Media Library (`/admin/media`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/media/page.tsx`
* **Components**: Phase 6A Global Media Library UI (`MediaDetailDrawer`, `MediaUploadModal`).
* Fully integrated within the updated top navigation shell (Overview, Products, Categories, Media).

---

## 3. Boundary & Phase 8 Scope Guard

The following domains are explicitly out of scope for Phase 7 and reserved for Phase 8:

* Orders index, order detail, and fulfillment workflows.
* Customer management and profile controls.
* Refund issuance and payment gateway interfaces.
* Shipment generation and carrier tracking.
* Legacy media database table drops or cleanup migrations.
* Customer storefront UI redesign.
