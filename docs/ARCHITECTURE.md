# Architecture & Delivery Topology

> **Scope.** This document describes *runtime topology only*. It does not carry
> phase or project state — see `docs/ENGINEERING-CONTINUITY-LOG.md` for that.
> It was reconciled with the codebase on **2026-09-14** (head `6c504be`).
>
> Phase at reconciliation: **backend migration B1–B10 complete**;
> **final UI implementation in progress**.

## 1. System Topology Overview

```mermaid
flowchart TD
    subgraph Browser ["User Browser"]
        UI["React 19 Interactive Islands"]
        Cache["Browser / bfcache"]
    end

    subgraph CDN ["Global CDN & Edge Layer (Vercel Mumbai)"]
        StaticShell["Cached Static HTML Shell"]
        ImageCDN["Next.js Image Optimization / Edge Cache"]
        EdgeMiddleware["Edge Middleware (Cache-Control & Geo Routing)"]
    end

    subgraph StorefrontCompute ["Storefront & Backend Compute (Vercel Node.js Runtime)"]
        RSC["React Server Components"]
        Actions["Server Actions (Cart, Auth, Checkout, Catalog Admin)"]
        DAL["First-Party Data Access Layer (DAL)"]
        NextCache["Next.js Cache Components (PPR)"]
    end

    subgraph Auth ["Authentication (Supabase Auth)"]
        SupabaseAuth["Customer & Admin Session Management"]
    end

    subgraph Persistence ["Managed PostgreSQL (Supabase ap-south-1 / Mumbai)"]
        DB[(PostgreSQL Database - Domain & Catalog Cache Tables)]
    end

    subgraph Storage ["Object Storage (Supabase Storage)"]
        ProductMedia["Supabase Storage product-media Bucket"]
    end

    Browser <-->|HTTP/2 / HTTP/3| CDN
    CDN <--> EdgeMiddleware
    EdgeMiddleware <--> StorefrontCompute
    StorefrontCompute <-->|Session Tokens / Auth API| SupabaseAuth
    StorefrontCompute <-->|Direct Connection Pooler| DB
    ImageCDN <-->|Public Media Delivery| ProductMedia
    StorefrontCompute <-->|Media Storage Admin| ProductMedia
```

---

## 2. Architecture Tiers & Environments

To ensure benchmark integrity and avoid contaminated comparisons, this repository strictly distinguishes between architecture environments:

### Tier 1: Active Production Architecture (Current Live Baseline)
* **Storefront & Backend**: Next.js 16 (React 19) hosted on **Vercel** ([`mirzafootwear.vercel.app`](https://mirzafootwear.vercel.app)). Static shells and catalog routes are cached at edge nodes (Mumbai `bom1`). Direct first-party Server Actions and Data Access Layer.
* **Authentication**: **Supabase Auth** for customer and catalog admin authentication with secure HTTP-only session cookies.
* **Database**: Managed **Supabase PostgreSQL** in the `ap-south-1` (Mumbai) region. Direct pooled connection handling addresses, profiles, carts, orders, and bounded-query catalog read models.
* **Media**: Delivered via **Supabase Storage** `product-media` public bucket with Next.js Image Optimization edge caching.
* **Commerce Operations**: Zero runtime dependency on Ruby on Rails, Spree, Puma, or Render.

### Tier 2: Local Development Architecture
* **Storefront**: Local Next.js dev server (`http://localhost:3001`).
* **Backend**: First-party DAL communicating directly with PostgreSQL and Supabase services. Zero Docker or external Rails containers required.

### Tier 3: Alternative Comparison Architectures (Benchmarking Candidates)
* **Fly.io Mumbai (`bom`) Persistent Container**: An alternative persistent deployment target evaluated for low-latency sub-millisecond network hops to Supabase Mumbai.
* **Supabase Smart CDN / Direct Pre-Generated Storage**: Target architecture evaluated under Experiments 009–013 for eliminating runtime on-demand image transformation compute.

---

## 3. Core Rendering & Performance Principles

1. **Server Components by Default**:
   All page chrome, navigation, breadcrumbs, descriptions, technical specifications, and static media shells are rendered via React Server Components (RSC). They do not ship hydration JavaScript to the client.
2. **Dynamic / Interactive Islands**:
   Only interactive components (Cart drawer, Variant picker, Live availability badge, Wishlist controls) use `"use client"` directives.
3. **Centralized Cache Policy**:
   All route caching headers in `next.config.ts` and `middleware.ts` are strictly derived from the single canonical module `storefront/src/lib/cache/cache-policy.ts` to prevent edge cache drift.
4. **First-Party Data Access Layer**:
   The application communicates directly through a typed Data Access Layer (DAL) and React Server Actions to PostgreSQL and Supabase services. Zero runtime dependency on `@spree/sdk`, legacy BFF endpoints, or external Rails servers.

---

## 4. Route Groups & URL Structure

URL shape:

```text
/{country}/{locale}/...
```

Example: `/us/en/products`, `/us/en/c/office-wear`, `/us/en/products/shoe-2026-09-001`.

Supported locales: `de`, `en`, `es`, `fr`, `pl` (registry: `src/i18n/locales.ts`).

Route groups under `src/app/[country]/[locale]/`:

| Group | Purpose | Notes |
|---|---|---|
| `(storefront)` | Public catalog, PDP, cart, account, policies | Full header/footer layout |
| `(checkout)` | `checkout/[id]`, `order-placed/[id]` | Minimal layout |
| `(admin)` | `/admin` — products, variants, categories | Role-gated server-side |
| `(wholesale)` | `/wholesale` — gated B2B surface, quick order | Enabled by `WHOLESALE_CHANNEL` |

Plus `src/app/dev/emails/[template]` — a development-only email template
previewer (Resend + `react-email`).

---

## 5. Data Ownership

```text
auth            → Supabase Auth            (sole authority)
profiles        → PostgreSQL public.profiles
addresses       → PostgreSQL public.addresses
carts           → PostgreSQL public.carts / cart_items
orders          → PostgreSQL public.orders / order_items
catalog         → PostgreSQL public.products / variants / categories
                  + cached public read model (tag: catalog-public)
catalog admin   → first-party Next.js admin
media metadata  → PostgreSQL public.media_assets / product_media (Media Contract v1; public.product_images dropped)
media bytes     → Supabase Storage `product-media` (all 31 canonical products; 0 legacy_public rows)
                  …and 3 static /catalog-shoes/*.webp (strictly retained for historical order snapshots)
```

Authorization is always:

```text
verified Supabase claims.sub → public.profiles → public.profiles.role
```

Never from email, signup metadata, client state, route visibility, or legacy tokens.

---

## 6. Catalog Read Path & Current Catalog Contract

```text
PostgreSQL source of truth
→ bounded 4-query snapshot   (lib/catalog/catalog-repository.ts)
→ Next cache tagged `catalog-public`
→ in-process filter / search / sort / lookup
→ compatibility DTOs → components
```

Performance contract (enforced by audit tests):

```text
warm snapshot DB queries = 0
cold snapshot DB queries = 4 (bounded)
N+1 = 0
PLP = 12 products initial + exactly one deferred remainder request
```

Current catalog contents:

```text
categories = 2   office-wear, traditional
products   = 31  shoe-2026-09-001 … shoe-2026-09-031
sizes      = 7 per product  (UK/India 6–12)
media      = /catalog-shoes/shoe-NN.webp
```

**Media Contract v1 Customer Cutover Complete (Phase 4).**
The customer-facing storefront reads directly from `public.product_media` and `public.media_assets`.
The 31 canonical shoes are served from their authoritative Supabase Storage stone masters
(`media/{assetId}/original.webp`) through `getStoragePublicUrl()`.
The legacy table `public.product_images` has been dropped via migration `20260919000000_drop_legacy_product_images.sql`. Static assets for historical orders remain in `storefront/public/catalog-shoes/`. Legacy admin media mutation controls (`insertProductMedia`, `deleteProductMedia`) are completely eliminated from all active write paths.

### 6.1 Media Contract v1 & Media Library Backend (Phases 1–5)
1. **Physical & Placement Decoupling**:
   - `public.media_assets`: Global reusable assets (`storage_provider`, `storage_path`, dimensions, dominant color, LQIP, `content_sha256`).
   - `public.product_media`: Product placement, gallery positioning (`position`), hero designation (`is_hero`), and contextual alt text (`alt_text`).
2. **Direct-to-Storage Ingestion**:
   - Client requests single-use signed URL via `requestMediaLibraryUploadAction`.
   - Client uploads image binary directly to Supabase Storage path `media/{assetId}/original.{ext}`.
   - Client invokes `finalizeMediaLibraryUploadAction`: Server downloads buffer, validates and decodes with Sharp (format, dimensions, dominant color, LQIP), computes SHA-256 integrity hash, and inserts idempotent record into `public.media_assets`.
3. **Placement & Deletion Safety**:
   - Products are attached via `attachMediaAssetToProductAction` without file duplication.
   - Asset deletion (`deleteMediaLibraryAssetAction`) enforces strict foreign-key protection: rejects deletion of assets currently attached to products (`usage_count > 0`), and performs DB deletion before Supabase Storage object cleanup.
4. **Cache Invalidation**:
   - All product media mutations invoke `updateTag("catalog-public")` to revalidate customer-facing Next.js PPR cache.

The retired demo catalog has been cleaned up: 36 dead legacy products removed, with 2 archived legacy products (`office-footwear-01` and `office-footwear-03`) temporarily retained solely because active guest carts hold FK references.

---

## 7. Environment Configuration

First-party variables (server-only unless prefixed):

```text
DATABASE_URL                              Secret
SUPABASE_DB_CA_CERT_BASE64                Secret — strict TLS, rejectUnauthorized: true
SUPABASE_SECRET_KEY                       Secret, server-only, never NEXT_PUBLIC_*
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
WHOLESALE_CHANNEL                         optional; unset = DTC-only
```

Optional: `RESEND_API_KEY` / `EMAIL_FROM`, `SENTRY_DSN`, `GTM_ID`,
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_STORE_NAME`.

> The publishable key is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not
> `..._ANON_KEY`). All env examples were corrected on 2026-09-14.

Strict database TLS is a hard invariant. Do not regress to
`rejectUnauthorized: false`.

---

## 8. Validation Baseline

Measured on `feat/editorial-admin-commerce` (Phase 8), 2026-09-18:

```text
Vitest        77 suites / 873 tests passing (100% pass)
TypeScript    tsc --noEmit clean (0 errors)
Biome         lint clean (0 errors, 0 warnings across 372 files)
Next.js       Production build clean (111/111 static pages generated)
```

---

## 9. Media Contract Authority Status

Following Phase 6B:
- **Customer Storefront Media Authority**: Media Contract v1 (`public.product_media` + `public.media_assets`).
- **Admin Product Media Authority**: Media Contract v1 (`public.product_media` + `public.media_assets`).
- **Global Media Library Authority**: Media Contract v1 (`public.media_assets` direct signed uploads + Sharp processing).
- **Legacy `public.product_images` Status**: Dropped permanently via `20260919000000_drop_legacy_product_images.sql` without CASCADE. Active admin read/write dependency count: 0. Rollback window has ended.

---

## 10. Mirza Admin Studio Control Plane (Phase 7)

The Mirza Admin Studio (`/(admin)/admin/*`) provides a unified, editorial control plane adhering to the brand's aesthetic language:

1. **Design Tokens & Typography**:
   - Shared CSS variables (`--admin-canvas: #f3efe8`, `--admin-surface: #fffefc`, `--admin-secondary: #e9e2d6`, `--admin-stone: #ece7de`, `--admin-ink: #30261f`, `--admin-muted: #706257`, `--admin-border: #cfc4b6`).
   - Typography: MIRZA wordmark uses branded serif (`Cormorant Garamond`, `--font-editorial-display`). All other Admin Studio UI elements strictly use `Geist` (`--font-geist`) with `tabular-nums` for numeric and identifier alignment. (`EB Garamond` is not used in Admin UI).
   - Replaced generic SaaS gray tables, shadow-sm, and bright pill badges with quiet typography, thin warm dividers, and flat surfaces.
2. **Data Access Models**:
   - **Overview (`/admin`)**: `getAdminCatalogOverview()` executes bounded metric queries and recent product delivery in exactly 2 SQL queries with Media Contract v1 hero resolution.
   - **Products Index (`/admin/products`)**: `listAdminProductsPage()` executes bounded CTE pagination (default 30/page; normal = 1 query, worst case out-of-range = 2 queries), supporting URL state (`?q=&status=&category=&sort=&page=`), aggregating variants and categories, and delivering Media Contract v1 heroes with 0 N+1 lookups.
   - **Product Edit (`/admin/products/[id]`)**: Integrates Radix dialog confirmations for archiving (no browser `confirm()`), unsaved form dirty tracking, accessible category checkboxes, compact variants editor, and preserved Media Contract v1 Product Media Manager.
   - **Categories (`/admin/categories`)**: Replaced browser `alert()`/`confirm()` with Radix Create/Edit Dialog and Safe Delete Dialog with server-validated product-count guards.
3. **Storefront Isolation**:
   - Customer-facing bundle impact = 0 bytes JS.
   - Zero customer catalog query changes or database schema migrations.

---

## 11. Mirza Admin Commerce Control Plane (Phase 8)

Phase 8 introduces read-only operational domains for **Orders** and **Customers** within the unified Mirza Admin Studio (`/(admin)/admin/*`), completing the business control plane alongside Catalog:

1. **Navigation Structure**:
   - `AdminSidebar.tsx` provides persistent desktop navigation and an accessible mobile slide-over drawer organized into logical operational groups:
     - **Studio**: Overview (`/admin`)
     - **Catalog**: Products (`/admin/products`), Categories (`/admin/categories`), Media (`/admin/media`)
     - **Commerce**: Orders (`/admin/orders`), Customers (`/admin/customers`)
   - Replaced legacy top navigation shell (`AdminTopNav.tsx` removed). Includes full keyboard focus rings, active path matching, and responsive drawer handling.

2. **Orders Domain (`src/lib/db/admin-commerce.ts`)**:
   - **Snapshot Authority**: Orders and line items are immutable records. Line items are read directly from `order_items` schema columns (`product_name`, `sku`, `size_option`, `price_in_cents`, `quantity`, `total_in_cents`, `thumbnail_url`), never dynamically re-priced or re-linked to mutated catalog records.
   - **Address Snapshots**: Customer delivery and billing locations are read directly from `shipping_address_snapshot` and `billing_address_snapshot` on `orders`.
   - **Stored Totals**: Subtotal, shipping total, tax total, and grand total are read strictly from stored cent integers (`subtotal_in_cents`, `total_in_cents`, etc.), guaranteeing audit integrity.
   - **Single-CTE Pagination**: `listAdminOrdersPage()` paginates orders with single-query CTE aggregation (default 30/page; normal = 1 query, worst case out-of-range = 2 queries), supporting URL state (`?q=&status=&customer=&sort=&page=`), joining line item counts and unit totals with 0 N+1 queries. Sort options: `newest`, `oldest`. (Invalid cross-currency total sort options removed).
   - **Bounded Detail Query**: `getAdminOrderDetail()` executes in exactly 2 bounded queries (order snapshot + line items with Media Contract v1 public URLs).
   - **Strict Read-Only Guarantee**: Payment capture, fulfillment, shipment management, refunds, and admin cancellation workflows are not implemented in the current Mirza commerce backend. Zero operational mutation buttons are provided.

3. **Customers Domain (`src/lib/db/admin-commerce.ts`)**:
   - **Identity Authority**: Direct server join between `public.profiles` (`role = 'customer'`) and `auth.users` (`u.email`).
   - **Order Association Authority**: Order counts and historical spend are linked strictly via `orders.user_id = customer.id`. Guest orders sharing an email address are never merged or counted toward customer spend.
   - **Monetary & Currency Semantics**:
     - Terminology: `Orders` (total count), `Placed Orders` (placed count), `Placed Order Value` (calculated only from `orders.status = 'placed'`).
     - Totals are grouped strictly by currency (`placedOrderTotals: Array<{ currency: string; totalInCents: number }>`). Currencies are never summed together or silently converted.
     - Sort options: `newest`, `oldest`, `latest_order`, `most_orders`. (Invalid cross-currency `highest_order_total` sort removed).
   - **Single-CTE Directory**: `listAdminCustomersPage()` delivers customer directory pagination (default 30/page; normal = 1 query, worst case out-of-range = 2 queries) with URL search and sorting, calculating order count and currency-grouped placed order totals without N+1 queries.
   - **Bounded Profile & History**: `getAdminCustomerDetail()` executes in exactly 3 bounded queries (profile + auth email + full-history aggregates from SQL, saved addresses from `public.addresses` bounded to 100, and bounded order history LIMIT 50). Full-history aggregates are computed in SQL, strictly independent of the bounded 50 rows returned in order history.
   - **Security Guardrails**: Zero customer credentials, password hashes, auth tokens, or session tokens exposed to the client.

4. **Catalog Overview Extension**:
   - `getAdminCatalogOverview()` in `admin-catalog.ts` aggregates commerce metrics (`total_orders`, `orders_today`, `guest_orders`, `registered_customers`) inside the existing CTE query, maintaining the strict 2-query budget.

5. **Storefront Isolation**:
   - Zero customer storefront JS bundle impact (0 bytes).
   - Zero customer database migrations or schema alterations.

---

## 12. Payment Architecture: Razorpay Standard Checkout (Test Mode)

1. **Razorpay Standard Checkout Overlay**:
   - Integrates the client-side Razorpay modal overlay directly onto Mirza's existing checkout page (`checkout.js` loaded lazily on demand).
   - The browser initiates payment by calling the server action `createRazorpayCheckoutOrder()`, which generates a server-authoritative Razorpay Order and returns public metadata (`keyId`, `amount`, `currency`, `order_id`, `customer`). `keySecret` is never exposed to the client.

2. **Server-Side `payment_attempts` Binding**:
   - Every Razorpay Order creation persists an authoritative record in `public.payment_attempts` linking `cart_id`, `surface`, `provider_order_id`, `amount_in_cents`, and `currency` with status `created`.
   - Carts can legitimately create multiple attempts across retries, but each attempt is cryptographically bound to its source cart and surface in the database.

3. **Trusted Provider Order ID (Cross-Cart Replay Defense)**:
   - When the client verification callback returns `(razorpay_order_id, razorpay_payment_id, razorpay_signature)`, the server does **not** treat the callback's `razorpay_order_id` as trusted.
   - The server queries `payment_attempts` strictly filtered by `provider_order_id`, `cart_id`, and `surface`.
   - The server-stored `payment_attempt.provider_order_id` is used as the `trustedOrderId` for constant-time HMAC-SHA256 signature verification (`trustedOrderId|razorpay_payment_id`), completely eliminating cross-cart payment replay attacks.

4. **Captured-Payment & Live Provider Verification**:
   - Before any database mutations, the server queries Razorpay API:
     - `fetchRazorpayOrder(trustedOrderId)`: Verifies order ID, `notes.cart_id`, `notes.surface`, amount, and currency match the payment attempt and active cart.
     - `fetchRazorpayPayment(razorpay_payment_id)`: Verifies payment ID, `order_id === trustedOrderId`, `status === 'captured'`, amount, and currency.

5. **Mirza Order Placed Only After Verification**:
   - `placeOrderFromCart()` executes atomically inside an ACID transaction only *after* signature, provider order, and provider payment verification succeed.
   - Idempotency guards validate that if the cart was already converted, the existing order's stored payment IDs match the incoming payment; otherwise, conflicting completions are rejected.
   - Returns `{ order, items, created: boolean }`; order confirmation emails are scheduled *only* when `created === true`.
   - Upon successful placement, `payment_attempts` row is marked `consumed` with `provider_payment_id` and timestamp.

6. **Webhook Reconciliation Deferred to Next Phase**:
   - In the current test checkout phase, payments are captured via the standard overlay and verified synchronously via the client callback.
   - Webhook processing (`payment.captured`, `order.paid`) with signature verification and replay-defense is planned for the subsequent production phase to handle edge-case dropoffs where the browser terminates prior to callback completion.


