# Architecture & Delivery Topology

## 1. System Topology Overview

```mermaid
flowchart TD
    subgraph Browser ["User Browser"]
        UI["React 19 Interactive Islands"]
        Cache["Browser / bfcache"]
    end

    subgraph CDN ["Global CDN & Edge Layer (Vercel)"]
        StaticShell["Cached Static HTML Shell"]
        ImageCDN["Next.js Image Optimization / Edge Cache"]
    end

    subgraph StorefrontCompute ["Storefront Compute (Vercel Mumbai)"]
        RSC["React Server Components"]
        Actions["Server Actions"]
        NextCache["Next.js Cache Components"]
    end

    subgraph CommerceBackend ["Commerce Engine (Fly.io Mumbai)"]
        SpreeAPI["Spree REST API v3"]
        SolidQueue["Solid Queue / Background Jobs"]
    end

    subgraph Persistence ["Managed PostgreSQL (Supabase ap-south-1)"]
        DB[(Spree PostgreSQL Database)]
    end

    subgraph Storage ["Object Storage (Cloudflare R2 / S3)"]
        RawMedia["Product Images & Media Originals"]
    end

    Browser <-->|HTTP/2 / HTTP/3| CDN
    CDN <--> StorefrontCompute
    StorefrontCompute <-->|REST API v3| SpreeAPI
    SpreeAPI <-->|Persistent Session Connection| DB
    SpreeAPI --> RawMedia
    ImageCDN <--> RawMedia
```

---

## 2. Core Rendering Principles

1. **Server Components by Default**:
   All page chrome, navigation, breadcrumbs, descriptions, technical specifications, and static media are rendered via Server Components. They do not ship hydration JavaScript to the client.
2. **Dynamic / Interactive Islands**:
   Only interactive components (Cart slider, Variant selector, Live availability badge, Wishlist button) use `"use client"` directives.
3. **Next.js Cache Components**:
   Enables Partial Prerendering (PPR) semantics. Slow dynamic information does not block the initial static shell and cached product information.
4. **Decoupled Architecture**:
   The storefront communicates solely through the Spree Store API v3 via `@spree/sdk`. Next.js does not directly connect to PostgreSQL.
