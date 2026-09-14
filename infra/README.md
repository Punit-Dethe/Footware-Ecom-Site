# Infrastructure & Deployment Guide

This directory documents the deployment targets, environment topology, and infrastructure configuration for the Mirza high-performance footwear ecommerce platform.

---

## 1. Production Topology: Vercel Serverless Architecture

### Storefront & Application Layer: Vercel (Edge & Node.js Serverless)
* **Production URL**: [https://mirzafootwear.vercel.app](https://mirzafootwear.vercel.app)
* **Framework**: Next.js 16 (App Router + Turbopack + Cache Components)
* **Architecture**: Direct first-party Data Access Layer (DAL) and React Server Actions
  * Bounded-query catalog snapshot with zero DB queries on warm cache and maximum 4 queries on cold.
  * Direct PostgreSQL persistence for orders, addresses, profiles, and cart domain tables.
  * Zero dependency on any external Rails, Spree, or Render backend.
* **Cache Architecture**:
  * Edge caching with canonical cache policies (`s-maxage=86400` for stable catalog; `s-maxage=3600` for catalog content; private `no-store` for cart/checkout), all derived from the single module `storefront/src/lib/cache/cache-policy.ts`.
  * Build-time pre-rendered catalog via `generateStaticParams()`. Current catalog: **31 product detail pages** and **2 category pages** (`office-wear`, `traditional`).
    *(The previously documented "38 product detail pages" referred to the retired demo catalog.)*
* **Stateful Services**:
  * Auth: Supabase Auth.
  * Media: Supabase Storage `product-media` bucket for admin-uploaded media; the current catalog also serves static assets from `storefront/public/catalog-shoes/`. This split is transitional — see Media Contract v1 in the continuity log.
  * Database: Supabase PostgreSQL (`ap-south-1` / Mumbai) with direct pooled connections and strict TLS.

---

## 2. Local Development

Running the application locally requires no Docker or external Rails runtime:
```bash
# From storefront directory:
pnpm dev
```
The Next.js storefront will be immediately available on `http://localhost:3001`.

Canonical local URLs:

```text
http://localhost:3001/us/en
http://localhost:3001/us/en/products
http://localhost:3001/us/en/products/shoe-2026-09-001
```

### Required environment

Copy `storefront/.env.local.example` (or `.env.example`) to `.env.local` and set:

```text
DATABASE_URL
SUPABASE_DB_CA_CERT_BASE64     (strict TLS)
SUPABASE_SECRET_KEY            (server-only)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
WHOLESALE_CHANNEL              (optional; unset = DTC-only)
```

> The publishable key is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, not
> `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Both env examples were corrected on
> 2026-09-14; if you copied an older `.env.local`, rename the variable.

### Validation before deploying

```bash
pnpm test        # 62 suites / 662 tests
pnpm run lint    # Biome
npx tsc --noEmit
pnpm run build
```

---

## 3. Production Deployment

The project is configured for continuous deployment on Vercel:
```bash
cd storefront
npx vercel --prod
```
All static pages are compiled and verified during the build step, and deployment completes with sub-second edge cache replication.

### Vercel environment

`DATABASE_URL`, `SUPABASE_DB_CA_CERT_BASE64` and `SUPABASE_SECRET_KEY` must be
set as **Vercel Secrets** for both Production and Preview. `SUPABASE_SECRET_KEY`
is server-only and must never carry a `NEXT_PUBLIC_` prefix.

Last production-verified backend deployment:

```text
Deployment ID : dpl_9vTuvjoiNtThD93xSSDpMb4aZxGB
Application SHA: 3367ea2f05fac795cc8df616d4e7a4b59859ef7e  (B10 merge)
URL           : https://mirzafootwear.vercel.app
Status        : READY / Production Verified
```

`main` has since advanced 12 commits past that SHA with editorial UI work
(head `6c504be`); those commits had not been re-verified in production at the
time this file was reconciled.

---

## 4. Topology diagrams

The runtime topology is documented in `docs/ARCHITECTURE.md` §1. Route groups,
data ownership and the catalog read path are in §4–§6 of the same file.
