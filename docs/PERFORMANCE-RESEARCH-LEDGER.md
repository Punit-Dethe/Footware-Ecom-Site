# Performance Research Ledger

> Current source of truth for performance decisions. Keep entries short. Historical experiment write-ups remain in `docs/PERFORMANCE.md`, but results measured before the serverless migration are not the current baseline.

**Audit baseline:** `38481f2335141d9eec4095242e9c3567b459aba6`  
**Architecture:** Next.js 16 / React 19 on Vercel, same-app Spree-compatible BFF, static TypeScript catalog (38 products), pre-generated product assets.

## Decision rule

Every optimization must earn its complexity.

- **KEEP** — measured benefit or near-zero complexity with clear correctness value.
- **TEST** — plausible benefit, but current architecture changed enough that old evidence is invalid.
- **SIMPLIFY** — useful idea implemented with more machinery than the current project needs.
- **REMOVE CANDIDATE** — likely redundant, dead, or actively adds latency; remove only after a controlled comparison unless it is demonstrably dead code.

For user-visible latency, prefer a change only when it produces a repeatable visible improvement (roughly >= 5–10% or >= 50 ms) or removes a loading/skeleton state. If the difference is inside normal run-to-run noise, prefer the simpler implementation.

## Current optimization audit

| ID | Optimization / mechanism | Status | Current audit note |
|---|---|---|---|
| O01 | Next Cache Components + cache lifetimes | TEST | Valuable with remote data, but much of the catalog is now in-process static data. Re-test whether remote cache wrappers add value. |
| O02 | Canonical edge cache classes / `s-maxage` / SWR | KEEP | Low complexity and useful for public HTML/API responses. Private routes remain `no-store`. |
| O03 | Suppress redundant locale `Set-Cookie` | KEEP | Prevents unnecessary cache-busting headers after locale is established. |
| O04 | React request memoization (`cache()`) | KEEP | Cheap deduplication for metadata/page reads; reassess only after direct repository reads are simplified. |
| O05 | Parallel independent server work (`Promise.all`) | KEEP | Correct low-complexity waterfall removal. |
| O06 | Narrow product-card fields | KEEP | Reduces RSC/client serialization and API payload. Less important if HTTP BFF is removed internally, but still useful for client props. |
| O07 | Build-time `generateStaticParams` for PDP/category routes | KEEP / VERIFY | Strong fit for a 38–70 product catalog. Verify production requests are actually served from prepared/cacheable output. |
| O08 | Server data layer -> `@spree/sdk` -> same Vercel app BFF -> local repository | SIMPLIFY | Compatibility layer now creates a network/self-HTTP hop around data already in the process. High-priority A/B: direct server repository call vs current SDK path. |
| O09 | `use cache: remote` around same-app BFF reads | TEST | May hide O08 when warm but adds cache/key/invalidation complexity around static local data. Test after direct-repository variant exists. |
| O10 | User token included in catalog/category-product cache keys | SIMPLIFY | Current public catalog is not personalized; token segmentation can reduce cache reuse for identical output. |
| O11 | Root market lookup through SDK/BFF before localized layout renders | SIMPLIFY | `MARKETS` is already local. Avoid making initial shell depend on same-app HTTP/cache resolution. |
| O12 | `connection()` + dynamic navigation category subtree | SIMPLIFY | Was useful when categories came from a remote backend. Categories are now static; dynamic request work is probably unnecessary. |
| O13 | Whole document children behind `Suspense fallback={null}` | REMOVE CANDIDATE | Can produce a blank initial experience. Test removing this boundary first; page-level boundaries already exist. |
| O14 | Currency resolved from direct country map | KEEP | Correct fix: no commerce call on visual critical path. |
| O15 | Products and filters split into separate Suspense paths | KEEP | Products no longer wait for facet computation. Directly addresses full-grid skeleton delay. |
| O16 | First page limited to 12 products | TEST | For only 38 products (future ~70), pagination may cost more complexity/latency than sending the small card dataset once. Compare 12-page infinite scroll vs all products. |
| O17 | Automatic page-2 fetch 250 ms after PLP mount | TEST | May hide scroll latency, but can compete with first-page images/LCP and causes an extra Server Action immediately after load. A/B it. |
| O18 | 1000 px IntersectionObserver prefetch for later pages | TEST | Keep only if infinite scroll survives O16 and it measurably removes the end-of-list wait. |
| O19 | One high-priority product card image | KEEP / VERIFY | Better than prioritizing 3–4 images. Verify actual LCP candidate per viewport. |
| O20 | Manual product `router.prefetch()` on hover/touch | TEST | Currently overlaps with Next Link default prefetch and Speculation Rules. Test one scheduler at a time. |
| O21 | Next `<Link>` automatic product prefetch | TEST | Non-high-priority cards use `prefetch={undefined}`, so Next can still auto-prefetch despite the intent-prefetch design. Current implementation is not truly intent-only. |
| O22 | Chromium PDP Speculation Rules prerender | TEST | Could make PDP clicks instant, but overlaps O20/O21 and can consume bandwidth/CPU. A/B against Next prefetch only. |
| O23 | Category/product Speculation Rules prefetch rule | REMOVE / FIX | Current rule requires a URL to match both `/*/*/c/*` AND `/*/*/products`; it is effectively impossible and contributes no benefit. |
| O24 | Sharp build-time image ingestion | KEEP | Strong fit: rotate, resize, AVIF/WebP, hash, dominant colour, LQIP once before requests. |
| O25 | Seven widths x AVIF + WebP | TEST | Potentially more variants than this small storefront needs. Measure which source widths are ever used before pruning. |
| O26 | Content-hashed product asset paths | KEEP | Enables safe immutable caching and clean invalidation. |
| O27 | One-year immutable cache for `/products/*` static assets | KEEP | Correct match for content-hashed files. |
| O28 | Per-image LQIP + dominant colour | KEEP IDEA / SIMPLIFY DELIVERY | Good perceived-loading metadata, but do not ship the full manifest to every client just to access it. |
| O29 | 66 KB media manifest imported by client ProductCard/PDP code | SIMPLIFY HIGH | `catalog-images.ts` imports the entire manifest and is imported by Client Components. Verify bundle impact; pass only the current product's media metadata or resolve it server-side. |
| O30 | `next/image` on already pre-generated local WebP/AVIF | TEST HIGH | Likely sends finished assets through `/_next/image` again. Compare current path against direct `<picture>/<img srcset>` or `unoptimized` delivery. |
| O31 | 31-day Next transformed-image TTL | TEST | Useful only if O30 keeps runtime Next image transformation. Redundant if finished hashed assets are delivered directly. |
| O32 | Broad Next image qualities/device sizes | SIMPLIFY IF O30 REMOVED | Runtime transform cardinality only matters while Next owns image transformation. |
| O33 | ProductImage as Client Component solely for error fallback | LATER TEST | Adds hydration to every image; only worth changing if client JS/hydration remains a measured bottleneck after larger simplifications. |
| O34 | PDP main image eager/high priority | KEEP / VERIFY | Correct for likely LCP. Avoid stacking redundant priority mechanisms if direct image delivery replaces Next Image. |
| O35 | PDP lightbox dynamic import | KEEP | Rare interaction; deferring it is low-risk and sensible. |
| O36 | Homepage hero from Unsplash through Next optimizer | SIMPLIFY | It is now the major remaining remote image origin. Put it through the same local/static media pipeline if homepage image timing is significant. |
| O37 | Native CSS scroll-snap carousel replacing Swiper | KEEP | Simpler runtime and removes heavy carousel JS. |
| O38 | `swiper` package + old `.swiper-*` CSS still present | REMOVE CANDIDATE | Implementation no longer imports Swiper. Remove dependency/lock entry/stale CSS after confirming search has no runtime imports. |
| O39 | Native carousel still dynamically imported | TEST HIGH | Dynamic import made sense for heavy Swiper. The replacement is small; lazy loading now may prolong homepage skeletons. Compare static import. |
| O40 | Featured products outer Suspense + dynamic carousel loading fallback | TEST | Two loading boundaries can turn a fast local product read into visible skeleton time. Simplify if static carousel wins O39. |
| O41 | Mobile `content-visibility:auto` for featured section | KEEP / VERIFY | Low-complexity way to defer below-fold rendering. Remove only if it causes visibility/layout issues. |
| O42 | React Compiler + manual `memo(ProductCard)` | TEST LOW PRIORITY | Compiler may make manual memo redundant; not worth touching until bundle/render traces show it matters. |
| O43 | Whole PDP `ProductDetails` client boundary | LATER TEST | Real hydration cost exists, but do not refactor until route/data/image latency is fixed and client execution is proven to be next bottleneck. |
| O44 | In-memory serverless BFF cart `Map` | SIMPLIFY / CORRECTNESS RISK | Fast when same instance survives, but ephemeral and instance-local. For this research storefront, client/localStorage cart is simpler and truly instant if persistence is not required. |
| O45 | Legacy Spree cart orchestration on top of simple BFF cart | REMOVE CANDIDATE HIGH | `getCart`, surface/channel checks, cookies, tags and multiple SDK calls survived the Rails architecture. Current BFF does not need most of it. |
| O46 | `router.refresh()` after every cart mutation | REMOVE CANDIDATE HIGH | Mutation already returns updated cart and calls `setCart`. Refresh can trigger unnecessary RSC work. |
| O47 | Re-fetch cart on every pathname change | REMOVE CANDIDATE HIGH | Generates server work on unrelated navigation. Keep only if a concrete correctness case requires it. |
| O48 | Cart drawer opens immediately on Add | KEEP | Good instant acknowledgement independent of backend state. |
| O49 | Vercel Analytics + Speed Insights | KEEP | Useful measurement tooling; small cost is justified during research. |
| O50 | GTM optional by environment | KEEP OFF FOR CONTROL TESTS | Third-party analytics should be disabled for clean performance comparisons unless specifically being measured. |
| O51 | Lighthouse budgets and CI | KEEP | Useful regression guard, but current three-run desktop lab result is not enough to judge user-visible navigation latency. |
| O52 | Old `perf/benchmarks/latest-results.json` | HISTORICAL ONLY | Measured the pre-serverless architecture and old product routes. Do not use it as the new baseline. |
| O53 | HTTP-only benchmark harness | KEEP AS SERVER TOOL | Measures TTFB/body completion, not LCP, skeleton duration, soft navigation, images or cart interaction. |
| O54 | Stale Render `/admin` redirects in Next config | REMOVE | Rails/Render backend is gone; redirects are now incorrect. |
| O55 | `docs/ARCHITECTURE.md` still describing Rails/Render | UPDATE | Documentation no longer matches the active architecture. |
| O56 | Payment/checkout/wholesale feature surface | SCOPE CLEANUP | User says payments are not required. Pruning these can reduce maintenance/dependency surface, but measure route bundle impact before calling it a speed optimization. |

## First simplification queue

Do **not** add new optimization techniques yet. Test these in this order because each can remove existing machinery.

1. **S1 — Internal data path:** current SDK -> same-app BFF vs direct server repository reads.
2. **S2 — Initial shell:** remove whole-body null Suspense and remove remote-style market/navigation resolution where local constants suffice.
3. **S3 — Homepage products:** static import of the now-small native carousel vs current dynamic import + nested skeletons.
4. **S4 — Listing strategy:** current 12-item infinite scroll vs all 38 products (and later synthetic 70) with lazy images.
5. **S5 — Image delivery:** current `next/image` around pre-generated assets vs direct generated `srcset`/`picture` delivery.
6. **S6 — Media metadata:** current full client manifest vs server-resolved/per-product media metadata.
7. **S7 — Navigation speculation:** Next automatic only vs intent prefetch only vs Speculation Rules only. Keep the simplest winner.
8. **S8 — Cart:** current Spree-compatible orchestration vs minimal local/client cart. Remove `router.refresh()` and navigation refetch first.

## Baseline latency log

Use production Vercel, the same device/browser/network for every comparison. Record at least 3 runs; use the median. Do not mix cold-browser and warm-browser runs.

| Date / commit | Condition | Initial home useful paint | Home products visible | `/products` real cards visible | Category click -> real cards | Product click -> useful PDP | Product click -> main image | Add to cart | Remove item | Infinite-scroll pause | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 38481f2 | Cold browser | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Current audit baseline |
| 38481f2 | Warm browser | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Current audit baseline |

## Required baseline checks

Before changing code, collect these once.

### B1 — Initial site
- Open `/us/en` in a fresh/incognito tab.
- Record time until non-blank useful content is visible.
- Record time until featured product cards are real cards rather than skeletons.
- In Network, note Document TTFB and whether the hero image is `/_next/image`.

### B2 — All products
- Open `/us/en/products` directly.
- Record time until the first real row of cards appears.
- Record whether filters finish before or after products.
- In Network, count requests fired in the first 2 seconds after cards appear; note whether an automatic page-2 Server Action occurs.

### B3 — Infinite scroll
- Start at `/us/en/products` and scroll normally to the end of currently loaded products.
- Record whether a loading spinner is ever visible and, if so, for how long.

### B4 — Category navigation
- From the homepage, click Office Wear / Traditional.
- Record click -> first real category product card.
- Repeat once after the category has already been visited (warm navigation).

### B5 — PDP navigation
- From a product listing, click a product immediately without hovering first; record click -> useful PDP and click -> main image.
- Go back, hover the same card ~500 ms, then click; record the same two values. This tells us whether speculation/prefetch is doing useful work.

### B6 — Cart
- From a PDP, add one item; record click -> cart contents/count updated (not just drawer opening).
- Remove it; record click -> item disappears.
- In Network, count how many requests each mutation causes and whether an RSC refresh follows it.

### B7 — Image path
On `/us/en/products`, inspect one product image request.
- If URL starts with `/_next/image`, the pre-generated image is being transformed again by Next.
- Record transferred bytes and duration for the first card image and PDP main image, cold and warm.

### B8 — Bundle check
Run `pnpm analyze` and record:
- total client JS for homepage, PLP and PDP;
- whether `storefront/src/lib/media/manifest.json` appears in a client chunk;
- whether `swiper` appears in any client chunk.

## Result entry template

Append one short entry per controlled change.

```md
### Rxxx — <change>
- Hypothesis: <one sentence>
- Before: <median / visible behavior>
- After: <median / visible behavior>
- Delta: <absolute + %>
- Side effect: <none / bytes / requests / correctness>
- Decision: KEEP / REVERT / SIMPLIFY
- Why: <one or two sentences; include hosting/cache explanation if relevant>
```

## Research principle

A failed optimization is a valid result. Record why it failed (already cached, bottleneck elsewhere, extra network contention, hosting cold start, duplicated work, browser ignored hint, etc.) and remove it if it adds complexity without measurable value.
