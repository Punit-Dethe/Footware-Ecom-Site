# Performance Research Ledger

> Current source of truth for performance decisions. Keep entries short. Historical experiment write-ups remain in `docs/PERFORMANCE.md`, but results measured before the serverless migration are not the current baseline.

**Audit baseline:** `38481f2335141d9eec4095242e9c3567b459aba6`  
**Architecture:** Next.js 16 / React 19 on Vercel, same-app Spree-compatible BFF retained for API compatibility, static TypeScript catalog (38 products), pre-generated product assets.  
**Research method:** one meaningful variable per experiment; benchmark before/after; keep, simplify, or revert from measured evidence.

## Decision rule

Every optimization must earn its complexity.

- **KEEP** — measured benefit or near-zero complexity with clear correctness value.
- **KEEP SIMPLIFICATION** — latency is neutral, but the change removes machinery/failure surface without meaningful regression.
- **TEST** — plausible benefit, but not yet proven on the current architecture.
- **SIMPLIFY** — useful idea implemented with more machinery than the current project needs.
- **REMOVE CANDIDATE** — likely redundant, dead, or actively adds latency; remove only after a controlled comparison unless demonstrably dead.

For user-visible latency, prefer a change when it produces a repeatable visible improvement (roughly >= 5–10% or >= 50 ms) or removes a loading/blank state. If the difference is inside normal run-to-run noise, prefer the simpler implementation. No speed benefit + more complexity => remove/revert. No speed benefit + less complexity => usually keep as simplification.

## Confirmed experiment results

### R001 — Remove full media manifest from client JS
- **Baseline:** `38481f2`; pure S1 commit after cleanup: `ce097c0`.
- **Hypothesis:** resolve media server-side/per-product instead of importing the full catalog media manifest into Client Components.
- **Before:** manifest contributed ~54.3 KB stat / ~53.8 KB parsed / ~6.9 KB gzip; affected shared chunk ~9.0 KB gzip.
- **After:** manifest is absent from all client chunks. Homepage JS 454.0 -> 400.7 KB; PLP 490.8 -> 437.5 KB; PDP 509.2 -> 455.9 KB (~53.3 KB parsed reduction per route).
- **Serialization:** no payload relocation penalty. PLP HTML 216,959 -> 215,097 B and RSC 128,010 -> 127,061 B; PDP grew only ~1.7 KB RSC/HTML. `product_media` is ~5.0 KB uncompressed across 12 PLP cards (~425 B/card).
- **Decision:** **KEEP STRONG**.
- **Why:** removes ~9 KB compressed client code and ~53.8 KB of browser-parsed JS without shifting equivalent bytes into RSC/HTML.

### R002 — Bypass same-app HTTP for server catalog reads
- **Baseline:** S1 `ce097c0`; S2 `4dd3c8d`.
- **Hypothesis:** server Components should read the in-process catalog repository directly rather than `@spree/sdk -> public Vercel HTTPS -> /api/v3/store/* -> repository`.
- **Before:** homepage 1, PLP 3, category 4, PDP 2 internal API calls per render. In production S1 self-calls went through the public Vercel edge; warm cached calls were often ~20–40 ms, while uncached product API could approach ~945 ms total.
- **After:** 0 internal catalog HTTP calls on all four routes; API compatibility remains intact; 3 files changed, +105/-137 (net -32 lines).
- **Production A/B:** application-executed median TTFB differences were neutral/noisy: homepage +0.2%, PLP +1.4%, category -0.3%, PDP +3.1%. Warm CDN-HIT results also showed no reliable speed win.
- **Serialization:** RSC/HTML shrank ~1.3–2.2% because SDK/JSON:API envelope metadata and duplicate master variant serialization disappeared; DOM markup remained byte-identical on the checked PDP.
- **Decision:** **KEEP SIMPLIFICATION**, not a latency optimization.
- **Why:** Vercel/Next caching had already hidden most warm self-HTTP cost. Keep the direct path because it deletes 1–4 nested HTTPS hops, cross-function recursion/failure modes, and 32 net lines without measurable latency regression.

### R003 — Remove whole-page null Suspense blocker / add granular PPR boundaries
- **Corrected baseline:** B0 `330b723` after separately fixing the ProductCarousel translation contract. S3A: `a501781`.
- **Hypothesis:** `<Suspense fallback={null}>{children}</Suspense>` in `DocumentShell` was holding the entire visible shell behind one dynamic subtree.
- **Production result:** **strong visible win**.
  - Homepage header/hero: ~536 ms -> ~288 ms (~248 ms earlier); hero image ~767 -> ~309 ms (~458 ms earlier).
  - PLP header/skeleton: ~511 -> ~260 ms (~251 ms earlier); first real card ~703 -> ~676 ms (~28 ms earlier).
  - Category shell: ~690 -> ~283 ms (~407 ms earlier); blank-after-TTFB ~463 -> ~54 ms; first card ~866 -> ~689 ms (~178 ms earlier).
  - PDP shell: ~571 -> ~271 ms (~300 ms earlier); blank-after-TTFB ~320 -> ~38 ms; title/main image ~67/~64 ms earlier.
- **Correctness/cache:** CLS 0, no PLP/category/PDP hydration errors, all measured routes remain Partial Prerendered and Vercel edge-cacheable.
- **Complexity:** 1 blanket root blocker removed; 8 targeted boundaries added (7 required for current PPR behavior, 1 optional PDP boundary). 12 files, +171/-36.
- **Decision:** **KEEP STRONG**.
- **Why:** the added targeted boundaries are justified by ~248–408 ms earlier visible shell delivery while preserving PPR/cacheability and CLS=0.

### R004 — Fix featured-products PPR/RSC stream abort
- **Baseline:** S3A `a501781`; C3 `de8d19e`.
- **Root cause:** public homepage `FeaturedProducts` unnecessarily called `getAccessToken()`, causing `cookies()` to mark the Suspense subtree dynamic during PPR. A swallowed dynamic exception then allowed `use cache: remote` work to persist an incomplete Resume Data Cache stream; runtime replay failed with `Error: Connection closed.` and aborted the featured-products boundary.
- **Change:** remove homepage auth-cookie lookup from public featured catalog reads; stop swallowing Next PPR dynamic exceptions in the cookie helper.
- **Production result:** featured products render reliably in 100% of measured runs; first real featured card ~360–496 ms, CLS 0, no console/hydration/stream abort errors; PPR and edge `HIT` caching remain active.
- **Decision:** **KEEP CORRECTNESS**.
- **Why:** fixes a real streaming correctness bug without giving back the S3A shell-performance gains.

### R005 — Static import of native ProductCarousel
- **Baseline:** C3 `de8d19e`; S4 `5cdf3ad`.
- **Hypothesis:** after replacing heavy Swiper with a tiny native CSS scroll-snap carousel, `next/dynamic` no longer earns its request waterfall/skeleton complexity.
- **Before:** featured card ~496.1 ms; skeleton ~29.8 ms; separate carousel chunk 8,527 B stat/parsed, ~3.2 KB Brotli, ~76.2 ms request duration.
- **After:** featured card ~360.9 ms (~135.2 ms earlier); skeleton ~15.6 ms; homepage parsed JS unchanged exactly (931,137 B); transfer 282,025 -> 281,927 B (-98 B); LCP 342 -> 372 ms (inside run noise).
- **Decision:** **KEEP STRONG**.
- **Why:** removes a real chunk waterfall and halves skeleton duration with effectively zero bundle cost. The dynamic import was legacy optimization residue from the old Swiper implementation.

## Current optimization audit

| ID | Optimization / mechanism | Status | Current audit note |
|---|---|---|---|
| O01 | Next Cache Components + cache lifetimes | TEST | Catalog is now in-process static data. Re-test remote-style cache wrappers after larger visible bottlenecks are finished. |
| O02 | Canonical edge cache classes / `s-maxage` / SWR | KEEP | Production A/B confirms Vercel edge caching is active and materially hides server execution on warm routes. |
| O03 | Suppress redundant locale `Set-Cookie` | KEEP | Prevents unnecessary cache-busting headers after locale is established. |
| O04 | React request memoization (`cache()`) | KEEP | Cheap request-level deduplication. |
| O05 | Parallel independent server work (`Promise.all`) | KEEP | Correct low-complexity waterfall removal. |
| O06 | Narrow product-card fields | KEEP | Still reduces serialization/client props. |
| O07 | Build-time `generateStaticParams` for PDP/category routes | KEEP | Current routes remain Partial Prerendered/cacheable after S3A. |
| O08 | Server data layer -> SDK -> public same-app BFF -> local repository | RESOLVED: KEEP SIMPLIFICATION | R002 removed server self-HTTP. Production latency was neutral because caches hid the cost; direct path is simpler and removes failure surface. |
| O09 | `use cache: remote` around catalog reads | TEST | Keep unchanged until a dedicated cache-wrapper A/B; R002 intentionally did not conflate this variable. |
| O10 | User token included in public catalog/category cache keys | SIMPLIFY | Public catalog is not personalized; token segmentation may reduce reuse. Later test. |
| O11 | Root market/category reads via remote-style path | PARTLY RESOLVED | R002 moved server public reads to local repository/constants. Remaining layout/PPR behavior is separate from self-HTTP. |
| O12 | `connection()` + dynamic navigation category subtree | TEST / S3B LATER | Exactly one storefront `connection()` is a realistic removal candidate; the other six audited calls are private/transactional and should remain dynamic. |
| O13 | Whole document children behind `Suspense fallback={null}` | RESOLVED: KEEP STRONG | R003 removed it. Category blank-after-TTFB ~463 -> 54 ms; PDP ~320 -> 38 ms; shell visible ~248–408 ms earlier. |
| O14 | Currency resolved from direct country map | KEEP | No commerce call on visual critical path. |
| O15 | Products and filters split into separate Suspense paths | KEEP | Products do not wait for facet computation. |
| O16 | First page limited to 12 products | TEST | For 38 products (future ~70), compare infinite scroll vs all lightweight records + lazy images. |
| O17 | Automatic page-2 fetch 250 ms after PLP mount | TEST | May hide scrolling pause but can compete with initial work. |
| O18 | 1000 px IntersectionObserver prefetch for later pages | TEST | Only useful if infinite scroll survives O16. |
| O19 | One high-priority product card image | KEEP / VERIFY | Verify actual LCP candidate per viewport. |
| O20 | Manual product `router.prefetch()` on hover/touch | TEST | Overlaps Next default prefetch and Speculation Rules. |
| O21 | Next `<Link>` automatic product prefetch | TEST | Current implementation is not truly intent-only. |
| O22 | Chromium PDP Speculation Rules prerender | TEST | A/B after route/image behavior stabilizes. |
| O23 | Category/product Speculation Rules prefetch rule | REMOVE / FIX | Current AND rule is effectively impossible and contributes no benefit. |
| O24 | Sharp build-time image ingestion | KEEP | Strong fit: resize/AVIF/WebP/hash/LQIP/dominant color once before requests. |
| O25 | Seven widths x AVIF + WebP | TEST | Cards currently receive all seven widths/two formats; measure actual source usage before pruning. |
| O26 | Content-hashed product asset paths | KEEP | Enables immutable caching and clean invalidation. |
| O27 | One-year immutable cache for `/products/*` static assets | KEEP | Correct for content-hashed files. |
| O28 | Per-image LQIP + dominant colour | KEEP | R001 proved per-product metadata can be delivered without shipping the global manifest in JS. |
| O29 | Full media manifest imported by client ProductCard/PDP code | RESOLVED: KEEP STRONG | R001 removed it: ~53.8 KB parsed JS and ~9 KB compressed affected chunk eliminated without RSC/HTML relocation. |
| O30 | `next/image` on already pre-generated local WebP/AVIF | TEST NEXT | Confirmed live catalog images go through `/_next/image`. Direct prepared-asset delivery is the next controlled A/B. |
| O31 | 31-day Next transformed-image TTL | TEST | Relevant only if O30 keeps runtime transformation. |
| O32 | Broad Next image qualities/device sizes | SIMPLIFY IF O30 REMOVED | Redundant if finished hashed assets are delivered directly. |
| O33 | ProductImage as Client Component solely for error fallback | LATER TEST | Lower priority than image delivery itself. |
| O34 | PDP main image eager/high priority | KEEP / VERIFY | Likely correct LCP policy; re-evaluate with direct image delivery. |
| O35 | PDP lightbox dynamic import | KEEP | Rare interaction; sensible deferral. |
| O36 | Homepage hero from Unsplash through Next optimizer | SIMPLIFY LATER | Major remaining remote image origin; test only after catalog image path. |
| O37 | Native CSS scroll-snap carousel replacing Swiper | KEEP | Simpler runtime; no active Swiper client chunk found. |
| O38 | `swiper` package + old `.swiper-*` CSS still present | REMOVE CANDIDATE | Runtime bundle analysis found 0 KB Swiper. Cleanup, not a claimed speed win. |
| O39 | Native carousel dynamically imported | RESOLVED: KEEP STATIC | R005 removed the legacy dynamic import: featured card ~135 ms earlier, skeleton halved, 0 parsed-JS increase. |
| O40 | Featured products outer Suspense + dynamic carousel fallback | PARTLY RESOLVED | Dynamic-import fallback cost is removed by R005. Outer data Suspense remains and should only be changed in a separate experiment if it becomes measurable. |
| O41 | Mobile `content-visibility:auto` for featured section | KEEP / VERIFY | Low complexity; remove only if it causes visible/layout issues. |
| O42 | React Compiler + manual `memo(ProductCard)` | TEST LOW PRIORITY | Not worth touching until larger bottlenecks are exhausted. |
| O43 | Whole PDP `ProductDetails` client boundary | LATER TEST | Real hydration cost exists but is not yet proven dominant. |
| O44 | In-memory serverless BFF cart `Map` | SIMPLIFY / CORRECTNESS RISK | Ephemeral/instance-local. Client/localStorage may eventually be simpler for this research storefront. |
| O45 | Legacy Spree cart orchestration on simple BFF cart | REMOVE CANDIDATE HIGH | Trace exact request graph before simplifying. |
| O46 | `router.refresh()` after every cart mutation | REMOVE CANDIDATE HIGH | Mutation already returns updated cart; likely redundant RSC work. |
| O47 | Re-fetch cart on every pathname change | REMOVE CANDIDATE HIGH | Likely unnecessary navigation work. |
| O48 | Cart drawer opens immediately on Add | KEEP | Good instant acknowledgement. |
| O49 | Vercel Analytics + Speed Insights | KEEP | Measurement tooling justified during research. |
| O50 | GTM optional by environment | KEEP OFF FOR CONTROL TESTS | Keep third-party analytics disabled in controlled benchmarks. |
| O51 | Lighthouse budgets and CI | KEEP | Regression guard, not sufficient for visible navigation conclusions. |
| O52 | Old `perf/benchmarks/latest-results.json` | HISTORICAL ONLY | Pre-serverless; not current baseline. |
| O53 | HTTP-only benchmark harness | KEEP AS SERVER TOOL | Useful for server/network; not a substitute for visible browser milestones. |
| O54 | Stale Render `/admin` redirects / orphan route cleanup | CLEANUP | Old backend is gone; keep repository consistent, but do not label as latency optimization. |
| O55 | `docs/ARCHITECTURE.md` still describing Rails/Render | UPDATE | Documentation should match active architecture. |
| O56 | Payment/checkout/wholesale feature surface | SCOPE CLEANUP | User does not need real payments/order lifecycle. Measure bundle leakage before claiming speed gains. |

## Current execution queue

Do **not** add unrelated optimization techniques. Current order:

1. **S5 — Image delivery:** current `next/image` transformation of pre-generated assets vs direct generated `<picture>/<img srcset>` delivery.
2. **S6 — Listing strategy:** 12-item infinite scroll vs all 38 products (later synthetic 70) + lazy images.
3. **S3B — Storefront navigation `connection()`:** remove only the public category-layout dynamic marker if a controlled comparison justifies it; keep private account/checkout calls.
4. **S7 — Navigation speculation:** Next automatic vs intent prefetch vs Speculation Rules; keep one scheduler.
5. **S8 — Cart:** first remove redundant refresh/navigation refetch; only then consider a minimal client cart.
6. **Later — cache-wrapper simplification, image-width pruning, stale feature/dependency cleanup.**

## Measurement notes / known facts

- Product images on live `/products` currently use `/_next/image?url=/products/...`, so prepared static WebPs are being transformed again by Next.
- Full media manifest was ~66 KB raw source; R001 proved it should stay server-side/per-product.
- Swiper is absent from runtime client chunks; dependency/CSS removal is cleanup only.
- Vercel S1 self-calls were public HTTPS edge requests, not internal localhost calls. Warm edge caches made them cheap enough that R002 did not improve measured latency.
- S3A production routes remained edge `HIT` + Partial Prerendered after replacing the blanket root boundary with targeted ones.
- C3 fixed the homepage Resume Data Cache stream abort by removing unnecessary public-route cookie access and preserving Next dynamic exception propagation.
- R005 proved the native carousel should remain statically imported: ~135 ms earlier featured cards with no parsed-JS increase.

## Result entry template

Append one short entry per controlled change.

```md
### Rxxx — <change>
- Hypothesis: <one sentence>
- Before: <median / visible behavior>
- After: <median / visible behavior>
- Delta: <absolute + %>
- Side effect: <none / bytes / requests / correctness>
- Decision: KEEP / KEEP SIMPLIFICATION / REVERT / SIMPLIFY
- Why: <one or two sentences; include hosting/cache explanation if relevant>
```

## Research principle

A failed optimization is a valid result. Record why it failed (already cached, bottleneck elsewhere, extra network contention, hosting cold start, duplicated work, browser ignored hint, etc.) and remove it if it adds complexity without measurable value.
