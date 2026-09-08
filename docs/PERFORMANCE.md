# Living Performance Document

## 1. Core Engineering Objective

Build an extremely fast, app-like ecommerce storefront where performance is an ongoing discipline, not a one-time optimization sprint.

Key mantra:
> **Do less work, do it earlier when intent is predictable, cache it at the nearest safe layer, and never make the user wait for work that does not need to block them.**

---

## 2. Core Web Vitals & Stretch Budgets

| Metric | Google Standard | Internal Stretch Target | Measurement Method |
| :--- | :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | $\le 2.5\text{ s}$ | **$\le 1.2\text{ s}$ at p75** | Chrome DevTools / Lighthouse / RUM |
| **INP** (Interaction to Next Paint) | $\le 200\text{ ms}$ | **$\le 100\text{ ms}$ at p75** | Event Timing API / Web Vitals SDK |
| **CLS** (Cumulative Layout Shift) | $\le 0.10$ | **$\le 0.03$** | Layout Shift API / Lighthouse |
| **FCP** (First Contentful Paint) | $\le 1.8\text{ s}$ | **$\le 0.8\text{ s}$** | Navigation Timing API |
| **TTFB** (Time to First Byte) | $\le 800\text{ ms}$ | **$\le 200\text{ ms}$ (cached)** | Server-Timing / Browser timing |

---

## 3. Data Freshness Classification

Every read from the commerce backend must explicitly belong to a freshness class:

* **Class A — Extremely Stable (Long-lived CDN / Next Cache, Event Invalidation):**
  * Global navigation, footer taxonomy, category trees, store metadata.
* **Class B — Catalog Content (Aggressively Cached, Webhook Invalidation):**
  * Product titles, descriptions, technical specifications, media URLs, option types.
* **Class C — Commercial Data (Short TTL or Precision Event Invalidation):**
  * Prices, active promotions, coupon applicability.
* **Class D — Volatile & Private (Dynamic, Never Shared CDN):**
  * Inventory count, active cart, customer session, order state.

---

## 4. Route JavaScript Budgets

* **Homepage (`/`)**: $\le 120\text{ KB}$ transferred JS
* **PLP (`/categories/...` / `/products`)**: $\le 140\text{ KB}$ transferred JS
* **PDP (`/products/[slug]`)**: $\le 150\text{ KB}$ transferred JS
* **Search (`/search`)**: $\le 140\text{ KB}$ transferred JS
* **Cart (`/cart`)**: $\le 130\text{ KB}$ transferred JS

---

## 5. Navigation & Instant Interaction Rules

1. **Layout Preservation**: Never trigger full document reloads for internal transitions.
2. **Intent-driven Prefetching**: Budget background network fetches based on user intent (hover dwell, viewport visibility), avoiding speculative bandwidth waste.
3. **Instant Acknowledgement**: Add to Cart, quantity changes, and option selection must acknowledge visually on the next animation frame using optimistic UI patterns.
4. **Bfcache Eligibility**: Zero `unload` event handlers; avoid unneeded `Cache-Control: no-store` on navigable GET pages.

---

## 6. Optimization Experiments Ledger

### Experiment 004: LCP Priority Preload & Body Hydration Guard

* **Hypothesis**: Injecting `<link rel="preload">` via `priority` prop on high-priority ProductImages will reduce LCP discovery time on product pages and listings, while `suppressHydrationWarning` on the root `<body>` prevents React hydration mismatches caused by browser extensions.
* **Changes Made**:
  1. Updated `ProductImage.tsx` to automatically set `priority={rest.priority ?? (fetchPriority === "high")}`.
  2. Added `suppressHydrationWarning` to `<body>` in `DocumentShell.tsx`.
  3. Added fallback support for `media.url` in `MediaGallery.tsx` and normalized Spree Media URLs on the mock server.
* **Benchmark Results**:
  * PDP (Imperial Oxford) TTFB: **154.9 ms** (down from 171.6 ms)
  * PDP (Royal Jutti) TTFB: **148.0 ms** (down from 203.0 ms)
  * Cart View TTFB: **143.2 ms** (down from 159.9 ms)
  * Hydration Warning: **0 errors**
* **Status**: **Kept & Verified**.

### Experiment 005: Data Freshness Boundaries, Edge Cache-Control & Speculation Rules Prerendering

* **Hypothesis**: Classifying routes into explicit edge cache tiers (Class A: 1d/7d SWR; Class B: 1h/1d SWR; Class D: private, no-cache), stripping redundant `Set-Cookie` headers on warm page navigations, injecting Chromium Speculation Rules for instant PDP background prerendering, and wiring event-driven webhook cache tag revalidation will eliminate origin SSR contention and accelerate route TTFB.
* **Changes Made**:
  1. Configured explicit `Cache-Control` in `storefront/next.config.ts` and `storefront/src/lib/spree/middleware.ts`.
  2. Guarded `setLocaleCookies` in middleware to omit `Set-Cookie` when incoming cookies already match `country` and `locale`.
  3. Created `<SpeculationRules />` (`SpeculationRules.tsx`) and embedded it in `<head>` via `DocumentShell.tsx`.
  4. Added `handleProductCatalogUpdated` and `handleCategoryTaxonomyUpdated` in `handlers.ts` and registered webhook events (`product.*`, `taxonomy.updated`, `category.updated`) with `revalidateTag(..., { expire: 0 })`.
* **Benchmark Results**:
  * Homepage TTFB: **129.0 ms** (down from 238.7 ms, **-46.0%**)
  * Products Listing (PLP) TTFB: **144.3 ms** (down from 238.7 ms, **-39.6%**)
  * Category (Formal & Office) TTFB: **149.2 ms** (down from 193.6 ms, **-22.9%**)
  * Category (Traditional Indian) TTFB: **160.5 ms** (down from 199.8 ms, **-19.7%**)
  * Cart View TTFB: **101.3 ms** (down from 165.1 ms, **-38.6%**)
  * Search Query TTFB: **144.0 ms** (down from 193.5 ms, **-25.6%**)
  * Repeat Request `Set-Cookie`: **Suppressed (`null`)**
  * Speculation Rules Active: **Verified**
* **Status**: **Kept & Verified**.

### Experiment 006: Server-Side API Waterfall Elimination & Request Memoization Deduplication

* **Hypothesis**: Deduplicating divergent `expand` lists between `generateMetadata` and route page components (`PRODUCT_PAGE_EXPAND` on PDP, `CATEGORY_PAGE_EXPAND` on category pages) and parallelizing sequential awaits with `Promise.all` eliminates 50% of origin API calls per page render and trims server TTFB.
* **Changes Made**:
  1. Updated `generateProductMetadata` to use `PRODUCT_PAGE_EXPAND`, matching `ProductPage` and allowing React `cache()` to return the resolved promise with zero second network call.
  2. Updated `CategoryPage` to use `getCachedCategory` with `CATEGORY_PAGE_EXPAND = ["ancestors", "children"]`.
  3. Parallelized `[params, searchParams]`, `[currency, translations]`, and `[category, currency]` with `Promise.all`.
* **Benchmark Results**:
  * PDP (Imperial Oxford) TTFB: **116.1 ms** (down from 123.6 ms, p75: **190.5 ms**)
  * PDP (Royal Jutti) TTFB: **115.2 ms** (down from 124.3 ms, p75: **193.4 ms**)
  * Category (Traditional Indian) TTFB: **141.9 ms** (down from 160.5 ms, p75: **217.0 ms**)
  * Cart View TTFB: **99.2 ms** (down from 101.3 ms, p75: **154.3 ms**)
* **Status**: **Kept & Verified**.



