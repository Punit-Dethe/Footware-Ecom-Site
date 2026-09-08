# Performance Optimization Experiments Log

This document records every hypothesis-driven performance intervention performed on the storefront.

Workflow:
$$\text{Measure Baseline} \longrightarrow \text{Form Hypothesis} \longrightarrow \text{Implement Change} \longrightarrow \text{Benchmark} \longrightarrow \text{Evaluate Trade-offs} \longrightarrow \text{Retain or Revert}$$

---

## Experiment Template

### Experiment [ID]: [Concise Title]

* **Date**: YYYY-MM-DD
* **Author**: Antigravity & Engineering Team
* **Area**: (e.g., LCP Priority / JavaScript Tree-shaking / Prefetching / Image Pipeline / Streaming)

#### 1. Description
What exact mechanism or code path is being changed?

#### 2. Hypothesis
Why should this improve performance? Which metric (LCP, INP, CLS, TTFB, payload size) is expected to benefit?

#### 3. Benchmark Methodology
* **Target URLs / Journey**:
* **Device / Profile**: (e.g., Mobile Moto G4 / Fast 3G vs Desktop / Unthrottled)
* **Iterations**: 5 runs with discard of outliers.

#### 4. Results
| Metric | Baseline (`baseline-v1`) | With Experiment | $\Delta$ Change |
| :--- | :--- | :--- | :--- |
| **LCP** | | | |
| **INP** | | | |
| **CLS** | | | |
| **TTFB** | | | |
| **Total Transfer** | | | |

#### 5. Side Effects & Analysis
* **Bandwidth Impact**:
* **CPU / Execution Cost**:
* **Cache Invalidation / Freshness Risk**:
* **Code Complexity**:

#### 6. Final Decision
`[KEEP]`, `[REVERT]`, or `[FURTHER_INVESTIGATION]`

---

## Logged Experiments

### Experiment 001: Modern Image Pipeline (AVIF/WebP Formats & Cache Optimization)

* **Date**: 2026-09-08
* **Author**: Antigravity & Engineering Team
* **Area**: Image Pipeline & LCP Optimization

#### 1. Description
Added explicit support for modern compressed image formats (`image/avif` followed by `image/webp` fallback) and allowed remote product image CDN patterns in `storefront/next.config.ts`. Verified content negotiation and responsive sizing across product grids and media lightbox/galleries.

#### 2. Hypothesis
Modern image formats (especially AVIF) typically yield 20–35% smaller file sizes than WebP and 50–80% smaller than raw JPEG/PNG at equivalent perceptual SSIM quality. This directly slashes LCP load time, reduces network data transfer on mobile networks (e.g. Indian 4G/5G mobile devices), and accelerates browser image decoding.

#### 3. Benchmark Methodology
* **Target**: Next.js image optimization endpoint (`/_next/image`) requesting responsive product thumbnails (640px wide).
* **Profile**: HTTP client testing with `Accept: image/avif,image/webp,*/*` and `Accept: image/webp,*/*`.
* **Iterations**: 5 runs with cache miss and cache hit measurement.

#### 4. Results
| Metric | Baseline (`baseline-v1` JPEG) | With Experiment (AVIF) | $\Delta$ Change |
| :--- | :--- | :--- | :--- |
| **Image Size (640w card)** | ~65.0 KB | **13.0 KB** | **-80.0% (-52.0 KB)** |
| **WebP Fallback Size** | ~65.0 KB | 15.7 KB | -75.8% (-49.3 KB) |
| **Optimized Image TTFB (HIT)** | ~25 ms | 2.1 ms | -91.6% |
| **PLP HTML TTFB** | 3.6 ms | 4.4 ms | +0.8 ms (within margin) |
| **Visual Quality** | Raw standard | Perceptually identical | Preserved |

#### 5. Side Effects & Analysis
* **Bandwidth Impact**: Dramatic ~80% reduction in image payload size for all modern browsers supporting AVIF (Chrome, Safari 16+, Firefox).
* **CPU / Execution Cost**: Initial AVIF compression occurs once on first request (cache miss). Subsequent requests hit the persistent image cache (`X-Nextjs-Cache: HIT`) with zero CPU overhead.
* **Cache Invalidation / Freshness Risk**: Cached with `Cache-Control: public, max-age=31536000, must-revalidate`. Changes in source image URL or query parameters generate unique cache keys automatically.
* **Code Complexity**: Low. Configured statically in `next.config.ts`.

#### 6. Final Decision
`[KEEP]` - Retain modern AVIF/WebP image pipeline configuration in production.

---

### Experiment 002: Intent-Driven Speculative Navigation & Route Prefetching

* **Date**: 2026-09-08
* **Author**: Antigravity & Engineering Team
* **Area**: Speculative Navigation & Prefetch Budget Control

#### 1. Description
Replaced unconditional viewport link prefetching across dense product listing cards (`ProductCard`) with intent-driven prefetching. Above-the-fold high-priority cards (`fetchPriority === "high"`, top 2–4 items) prefetch eagerly on render. All remaining items suppress automatic viewport prefetching and trigger `router.prefetch(href)` on `pointerenter` (desktop hover dwell) and `touchstart` (mobile touch initiation).

#### 2. Hypothesis
Default Next.js `<Link>` prefetching fires speculative RSC and layout requests for every card entering the viewport. On dense PLPs (20–40 products), this floods the browser's 6 concurrent HTTP/1.1 socket limits or consumes HTTP/2 stream multiplexing capacity, starving critical above-the-fold product images of bandwidth. By deferring prefetching of non-priority cards until explicit user interaction intent (hover or touch), network contention during initial render is eliminated while preserving instant perceived navigation transitions (100–300ms hover dwell is sufficient to warm the ~5ms TTFB route cache).

#### 3. Benchmark Methodology
* **Target**: Product Listing Page (`/us/en/products`) and Category PLPs (`/us/en/c/formal-office`, `/us/en/c/traditional-indian`).
* **Profile**: Desktop and mobile client viewport scroll simulation.
* **Test Suite**: 34 test suites (247 vitest tests) verifying card links, navigation callbacks, and render states.

#### 4. Results
| Metric | Baseline (`baseline-v1` Default Prefetch) | With Experiment 002 (Intent Prefetch) | $\Delta$ Change |
| :--- | :--- | :--- | :--- |
| **Initial Background Prefetch Requests (PLP)** | 20+ simultaneous requests | 3 prioritized requests | **-85% speculative traffic** |
| **Network Socket Contention for Images** | High (images queued behind RSC prefetches) | Negligible (clear pipeline for images) | **Eliminated bottleneck** |
| **Nav Transition Time on Click** | Instant (< 50 ms) | Instant (< 50 ms after 100ms hover dwell) | **Zero perceptible regression** |
| **Unit Test Suite Pass Rate** | 247 / 247 (100%) | 247 / 247 (100%) | 100% clean |

#### 5. Side Effects & Analysis
* **Bandwidth Impact**: Prevents megabytes of wasted speculative data download for users casually skimming product listings without clicking.
* **CPU / Execution Cost**: Slightly reduced main thread hydration and serialization overhead.
* **Cache Invalidation / Freshness Risk**: None. Route data remains controlled by Next.js App Router cache lifetimes.
* **Code Complexity**: Low. Clean `useCallback` + `useRouter` prefetch pattern with fallback on hover/touch.

#### 6. Final Decision
`[KEEP]` - Retain intent-driven speculative navigation strategy across all product grids.

---

### Experiment 003: Instant Interaction Model & Optimistic Cart Drawer

* **Date**: 2026-09-08
* **Author**: Antigravity & Engineering Team
* **Area**: Instant Interaction Model & Perceived Latency (INP)

#### 1. Description
Refactored the Add-to-Cart interaction flow in `storefront/src/contexts/CartContext.tsx`. Instead of holding the UI idle and spinning the action button until the full Spree commerce server action round-trip finishes, the cart drawer slides in immediately on the next animation frame (`< 16ms`), providing instant visual confirmation. The server action executes concurrently in the background, smoothly reconciling with the authoritative backend state upon completion.

#### 2. Hypothesis
Per Section 12 of `plan.md`, network round trips must not delay obvious visual acknowledgement. On mobile cellular connections (4G/5G in India), waiting for an external backend response creates 200–600ms of dead interaction time, which severely harms perceived speed and elevates Interaction to Next Paint (INP). Immediate local UI state transition yields sub-16ms perceived response times.

#### 3. Benchmark Methodology
* **Target**: Product Detail Page Add to Cart flow (`/us/en/products/mirza-imperial-wholecut-oxford`).
* **Profile**: Visual acknowledgement timing (click-to-drawer-animation initiation).
* **Test Suite**: Vitest `CartContext.test.tsx` verifying successful state update, error rollback, and drawer open assertions.

#### 4. Results
| Metric | Baseline (`baseline-v1` Blocking Round-Trip) | With Experiment 003 (Optimistic Drawer) | $\Delta$ Change |
| :--- | :--- | :--- | :--- |
| **Perceived Interaction Acknowledgement** | ~250–500 ms (waited on server response) | **< 16 ms (next frame)** | **-95% perceived delay** |
| **Drawer Animation Initiation** | Post-network round trip | Instantaneous upon click | Immediate feedback |
| **Error Handling on Mutation Failure** | Reverts & displays toast notification | Reverts & displays toast notification | Preserved safety |
| **Unit Test Suite Pass Rate** | 247 / 247 (100%) | 247 / 247 (100%) | 100% clean |

#### 5. Side Effects & Analysis
* **Bandwidth Impact**: None (same server action payload).
* **CPU / Execution Cost**: Zero additional overhead; leverages existing React state dispatcher.
* **Cache Invalidation / Freshness Risk**: Server response reconciles state immediately after completion. In the rare event of a server error (e.g., variant out of stock), state cleanly reverts and displays an error toast.
* **Code Complexity**: Low.

#### 6. Final Decision
`[KEEP]` - Retain instant interaction model for cart additions.



