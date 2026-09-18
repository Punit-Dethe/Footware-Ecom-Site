# Mirza Admin Studio — Operational Documentation

> Canonical architectural and operational guide for the Mirza Admin Studio (Phase 7 & Phase 8).

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
  * Displays an editorial operations sheet with 13 key operational facts across Catalog and Commerce:
    * **Catalog Vitals**: Total Products, Active Products, Drafts, Archived Products, Total Categories, Managed Media Assets, Total Variants, Total Catalog Stock, and Active Products with Zero Stock.
    * **Commerce Activity**: Total Orders, Orders Today, Registered Customers, and Guest Orders.
  * Displays recently updated products with direct Media Contract v1 hero thumbnails and quick links to edit.
  * Quick work navigation to Orders, Customers, New Product, and Media Library.
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
* Fully integrated within the updated top navigation shell (Overview, Catalog, Commerce).

### Orders Index (`/admin/orders`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/orders/page.tsx`
* **Data Access**: `listAdminOrdersPage({ query, status, customerType, sort, page, pageSize })` (in `src/lib/db/admin-commerce.ts`)
* **Features**:
  * Bounded single-CTE SQL query; zero N+1 queries.
  * URL-addressable filter state: `?q=&status=&customer=&sort=&page=`.
  * Search: Order number (e.g. `MRZ-XXXXXXXXXX`) and checkout email ILIKE matching.
  * Status filter: `all`, `placed`, `cancelled`.
  * Customer filter: `all`, `registered` (`user_id IS NOT NULL`), `guest` (`user_id IS NULL`).
  * Sort options: Newest, Oldest, Highest total, Lowest total.
  * Default pagination: 30 orders/page.
  * Read-only record: displays order number, placed date, customer/email, member vs guest badge, quiet status, items count, total, and surface (`DTC` or `Wholesale`).

### Order Detail (`/admin/orders/[id]`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/orders/[id]/page.tsx`
* **Data Access**: `getAdminOrderDetail(idOrNumber)` (in `src/lib/db/admin-commerce.ts`)
* **Snapshot Authority & Invariants**:
  * Strictly executes exactly 2 bounded SQL queries.
  * Order items, address snapshots, and totals are permanently fixed at checkout time.
  * Items Table: renders immutable historical snapshots of product name, SKU, size option, unit price, quantity, line total, and thumbnail URL.
  * Customer & Address Grid: displays customer identity, shipping address snapshot, and billing address snapshot directly from stored JSONB.
  * Totals: subtotal, tax, shipping, and total displayed directly from stored cents columns (no price recomputation).
  * **Strictly Read-Only**: Payment capture, fulfillment, shipment tracking, refunds, and admin cancellations are NOT implemented in this backend and operational mutation buttons are deliberately absent.

### Customers Directory (`/admin/customers`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/customers/page.tsx`
* **Data Access**: `listAdminCustomersPage({ query, sort, page, pageSize })` (in `src/lib/db/admin-commerce.ts`)
* **Identity Authority**:
  * Joins `public.profiles` with `auth.users` on `role = 'customer'` (excludes administrator accounts).
  * Aggregates completed order count, historical order value (`historical_order_total_in_cents`), latest order date, and saved address count in a single bounded CTE query without N+1.
  * Search: email, customer first name, last name, phone.
  * Sort: newest, oldest, recent order activity, most orders, highest order value.
  * Default pagination: 30 customers/page.

### Customer Detail (`/admin/customers/[id]`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/customers/[id]/page.tsx`
* **Data Access**: `getAdminCustomerDetail(customerId)` (in `src/lib/db/admin-commerce.ts`)
* **Sections**:
  * **Identity**: Full name, verified email from `auth.users`, phone, user UUID, joined date, update timestamp. Zero exposure of password hashes, session tokens, or sensitive auth metadata.
  * **Saved Addresses**: Lists addresses from `public.addresses` with default shipping and default billing badges. Read-only.
  * **Order History**: Bounded list of historical checkouts strictly matched by `orders.user_id = customer.id` (never email-based). Links to Order Detail.
  * **Strictly Read-Only**: No customer password reset, email change, impersonation, or address mutation controls.

---

## 3. Boundary & Implementation Constraints

* **Payment & Fulfillment Workflows**: Payment capture, payment status lifecycles, fulfillment, shipment tracking, refund processing, and admin cancellation workflows are **NOT** implemented in the commerce backend.
* **Customer Mutations**: Account administration (password resets, customer creation/deletion) is handled via existing customer self-service workflows and Supabase Auth.
* **Storefront Isolation**: Customer-facing bundle JS impact is **0 bytes**. Customer queries impact is **0 queries**.
