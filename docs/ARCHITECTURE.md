# Architecture & Delivery Topology

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

    subgraph StorefrontCompute ["Storefront Compute (Vercel Node.js Runtime)"]
        RSC["React Server Components"]
        Actions["Server Actions (Cart, Auth, Checkout)"]
        NextCache["Next.js Cache Components (PPR)"]
    end

    subgraph CommerceBackend ["Commerce Engine (Official Spree 5 on Render)"]
        SpreeAPI["Spree Store REST API v3 (/api/v3/store/*)"]
        SpreeAdmin["Spree Official Admin & React Dashboard (/admin, /dashboard)"]
        PumaServer["Puma 6 Web Server (Single Worker Mode)"]
    end

    subgraph Persistence ["Managed PostgreSQL (Supabase ap-south-1 / Mumbai)"]
        DB[(Spree PostgreSQL 15 Database - 150+ Official Tables)]
    end

    subgraph Storage ["Object Storage (Cloudflare R2 / S3 / Supabase Storage)"]
        RawMedia["Product Photography & Media Originals"]
    end

    Browser <-->|HTTP/2 / HTTP/3| CDN
    CDN <--> EdgeMiddleware
    EdgeMiddleware <--> StorefrontCompute
    StorefrontCompute <-->|REST API v3 (@spree/sdk)| SpreeAPI
    SpreeAdmin <--> PumaServer
    PumaServer <-->|Persistent Connection Pooler| DB
    SpreeAPI --> RawMedia
    ImageCDN <--> RawMedia
```

---

## 2. Architecture Tiers & Environments

To ensure benchmark integrity and avoid contaminated comparisons, this repository strictly distinguishes between three architecture environments:

### Tier 1: Active Research Production Architecture (Current Live Baseline)
* **Storefront**: Next.js 16 (React 19) hosted on **Vercel** ([`storefront-three-tau.vercel.app`](https://storefront-three-tau.vercel.app)). Static shells and catalog routes are cached at edge nodes (Mumbai `bom1`).
* **Commerce Engine**: Official **Spree Commerce 5 (Ruby on Rails 8.1)** hosted on **Render** ([`mirza-spree-backend.onrender.com`](https://mirza-spree-backend.onrender.com)). Provides standard Spree REST API v3, Devise authentication, and the official Spree Admin Dashboard.
* **Database**: Managed **Supabase PostgreSQL** in the `ap-south-1` (Mumbai) region. Standard Spree 5 schema with master variants, inventory tracking, prices, and Mobility English translations.
* **Media**: Current delivery routes media through Next.js Image Optimization; pre-generated responsive variant pipeline in preparation.

### Tier 2: Local Development & Control Architecture
* **Storefront**: Local Next.js Turbopack dev server (`http://localhost:3000`).
* **Commerce Engine**: Local Docker Compose container running `ghcr.io/spree/spree:latest` on port `4000`.
* **Database**: Local PostgreSQL 18 container (`postgres://postgres@postgres:5432/spree_development`).
* **Storage**: Local Active Storage volume mount (`storage_data`).

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
4. **Decoupled Architecture**:
   The storefront communicates strictly through the Spree Store API v3 via `@spree/sdk`. Next.js does not connect directly to the database.
