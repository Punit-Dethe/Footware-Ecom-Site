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
