# Mirza Admin Studio — Operational Documentation

> Canonical architectural and operational guide for the Mirza Admin Studio (Phase 7 & Phase 8).

---

## 1. Visual System & Design Tokens

The Mirza Admin Studio shares the editorial design system established by the customer-facing storefront, tailored for an operational control plane:

* **Canvas & Surface Tokens**:
  * `--admin-canvas`: `#f3efe8` (warm background canvas)
  * `--admin-surface`: `#fffefc` (elevated editorial content surface)
  * `--admin-secondary`: `#e9e2d6` (secondary structural stone fields)
  * `--admin-stone`: `#ece7de` (image frames and muted input backgrounds)
  * `--admin-border`: `#cfc4b6` (subtle hairline dividers and field borders)
* **Typography Tokens**:
  * `--admin-ink`: `#30261f` (primary text and button backgrounds)
  * `--admin-muted`: `#706257` (secondary labels, metadata, and timestamps)
  * `--font-editorial-display`: Cormorant Garamond
  * `--font-editorial-text`: EB Garamond
  * `--font-geist`: Geist
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
  * Query count: normal = 1 bounded query; worst case = 2 bounded queries on empty out-of-range pages; zero N+1 database lookups; zero legacy `product_images` queries.

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
  * Query count: normal = 1 bounded query; worst case = 2 bounded queries on empty out-of-range pages; zero N+1 queries.
  * URL-addressable filter state: `?q=&status=&customer=&sort=&page=`.
  * Search: Order number (e.g. `MRZ-XXXXXXXXXX`), customer email, and line item SKU ILIKE matching.
  * Status filter: `all`, `placed`, `cancelled`.
  * Customer filter: `all`, `registered` (`user_id IS NOT NULL`), `guest` (`user_id IS NULL`).
  * Sort options: Newest, Oldest. (Invalid cross-currency total sort options removed).
  * Default pagination: 30 orders/page.
  * Read-only record: displays order number, placed date, customer/email, member vs guest badge, quiet status, items count, total, and surface (`DTC` or `Wholesale`).

### Order Detail (`/admin/orders/[id]`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/orders/[id]/page.tsx`
* **Data Access**: `getAdminOrderDetail(idOrNumber)` (in `src/lib/db/admin-commerce.ts`)
* **Snapshot Authority & Invariants**:
  * Strictly executes exactly 2 bounded SQL queries.
  * Order items, address snapshots, and totals are permanently fixed at checkout time.
  * Items Table: renders immutable historical snapshots using schema columns: `product_name`, `sku`, `size_option`, `price_in_cents`, `quantity`, `total_in_cents`, and `thumbnail_url`.
  * Customer & Address Grid: displays customer identity, shipping address snapshot, and billing address snapshot directly from stored `shipping_address_snapshot` and `billing_address_snapshot` JSONB columns. Stored country ISO is displayed when present without fabricating default countries.
  * Totals: subtotal, tax, shipping, and total displayed directly from stored cents columns (no price recomputation).
  * **Strictly Read-Only**: Payment capture, fulfillment, shipment management, refunds, and admin cancellation workflows are not implemented in the current Mirza commerce backend, and operational mutation buttons are deliberately absent.

### Customers Directory (`/admin/customers`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/customers/page.tsx`
* **Data Access**: `listAdminCustomersPage({ query, sort, page, pageSize })` (in `src/lib/db/admin-commerce.ts`)
* **Identity Authority & Monetary Semantics**:
  * Joins `public.profiles` with `auth.users` on `role = 'customer'` (excludes administrator accounts).
  * Calculates `orderCount` (all orders, including placed and cancelled) and `placedOrderTotals` (grouped strictly by currency from `orders.status = 'placed'`).
  * Cancelled orders are excluded from Placed Order Value.
  * Currencies are never summed together or silently converted.
  * Sort options: `newest`, `oldest`, `latest_order`, `most_orders`. (Invalid cross-currency `highest_order_total` sort removed).
  * Query count: normal = 1 bounded query; worst case = 2 bounded queries on empty out-of-range pages; zero N+1 queries.
  * Default pagination: 30 customers/page.

### Customer Detail (`/admin/customers/[id]`)
* **Endpoint**: `src/app/[country]/[locale]/(admin)/admin/customers/[id]/page.tsx`
* **Data Access**: `getAdminCustomerDetail(customerId)` (in `src/lib/db/admin-commerce.ts`)
* **Full-History SQL Aggregates & Query Bound**:
  * Strictly executes exactly 3 bounded SQL queries:
    1. Customer Profile + Auth Email + Full-History Order Aggregates (`total_order_count`, `placed_order_count`, `placed_order_totals` grouped by currency, `latest_order_at`).
    2. Saved Delivery Addresses (`public.addresses WHERE user_id = $1 LIMIT 100`).
    3. Bounded Order History (`public.orders WHERE user_id = $1 LIMIT 50`).
  * Displayed metrics are computed across the full historical database record in SQL, strictly independent of the bounded 50 rows returned in order history.
  * Terminology: `Orders` (total count), `Placed Orders` (placed count), `Placed Order Value` (separated per currency). Zero implication of payment capture or fulfillment completion.
* **Sections**:
  * **Identity**: Full name, verified email from `auth.users`, phone, user UUID, joined date, update timestamp. Zero exposure of password hashes, session tokens, or sensitive auth metadata.
  * **Saved Addresses**: Lists addresses from `public.addresses` with default shipping and default billing badges. Read-only.
  * **Order History**: Bounded list of historical checkouts strictly matched by `orders.user_id = customer.id` (never email-based). Links to Order Detail.
  * **Strictly Read-Only**: No customer password reset, email change, impersonation, or address mutation controls.

---

## 3. Boundary & Implementation Constraints

* **Payment & Fulfillment Workflows**: Payment capture, fulfillment, shipment management, refunds, and admin cancellation workflows are **NOT** implemented in the current Mirza commerce backend.
* **Customer Mutations**: Account administration (password resets, customer creation/deletion) is handled via existing customer self-service workflows and Supabase Auth.
* **Storefront Isolation**: Customer-facing bundle JS impact is **0 bytes**. Customer queries impact is **0 queries**.
