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

### R006 — Direct prepared product images vs Next Image
- **Baseline:** S4 `5cdf3ad`; S5 candidate `29b25c0` (reverted after test).
- **Hypothesis:** bypassing `/_next/image` and serving the already-generated AVIF/WebP `srcset` directly would remove redundant runtime transformation.
- **Baseline behavior:** Next Image selected tightly sized/low-byte variants (e.g. PLP desktop ~3.7 KB body at 384w, mobile ~2.2 KB at 256w; PDP desktop ~10.5 KB at 640w, mobile ~4.8 KB at 384w).
- **Direct behavior:** browser selected prepared AVIFs that were materially larger (PLP 320w ~6.4 KB body on both desktop/mobile; PDP 640w ~20.5 KB desktop and 480w ~12.6 KB mobile).
- **Production result:** first-viewport image bytes 77,741 -> 149,250 B (+92%). PLP first image complete +96 ms, first row +143 ms, homepage featured image +150 ms. CLS stayed 0 and quality was unchanged.
- **PDP anomaly:** title and main image both appeared ~150–160 ms earlier in the direct variant, but the title should not depend on image delivery; desktop request duration only improved ~13 ms while mobile direct image duration regressed to ~250 ms. Treat this route-level improvement as confounded, not proof that direct PDP delivery wins.
- **Decision:** **REVERT / KEEP NEXT IMAGE**. Workspace returned to S4 baseline.
- **Why:** Vercel/Next image optimization is doing useful responsive compression and substantially reduces transferred bytes on card-heavy surfaces. The theoretical double-transform concern did not survive measurement.

### R007 — Render all 38 products vs 12-item infinite scroll
- **Baseline:** S4 `5cdf3ad`; S6 candidate `6a4743f`.
- **Hypothesis:** with only 38 products, rendering the whole catalog immediately might be simpler and faster than 12-item pagination, a 250 ms auto page-2 action, IntersectionObserver, append state, and later page actions.
- **Desktop:** first card 957.5 -> 942.8 ms (neutral/slightly better), first row 1330.6 -> 1238.8 ms (~92 ms earlier), LCP 994 -> 1004 ms (~1% regression), CLS 0. All #13/#25/#38 records were immediately available instead of arriving at ~2458/~3221/~4043 ms.
- **Payload:** HTML +276,855 B (+270.4 KB uncompressed), RSC +170,857 B (+166.9 KB); client JS fell only ~1.1 KB transfer / ~1.9 KB parsed. First-viewport image bytes grew 77,741 -> 112,046 B.
- **Mobile:** first card 991.5 -> 1214.6 ms (+223.1 ms), LCP 1030 -> 1264 ms (+234 ms), image bytes 41,012 -> 53,357 B. This is a meaningful regression under the project decision rule.
- **Baseline correctness issue:** the old observer flow stalled at 24 cards during realistic continuous mobile scroll and required a manual pause to reach later products. S6 all-at-once reliably exposed all 38.
- **Complexity:** S6 removed the infinite-list client island, timer, observer, transitions/state, spinner, dedupe logic, and follow-up pagination actions; one file, +9/-27.
- **70-product benchmark-only probe:** 649,346 B HTML / 343,985 B RSC, 70 cards, 1,738 DOM nodes, one long task, ~16.6 MB peak heap; useful as scale context only, not a production decision.
- **Decision:** **REJECT CURRENT ALL-38 IMPLEMENTATION; REPLACE OLD PAGINATION DESIGN**.
- **Why:** desktop tolerates all 38 well, but the ~223–234 ms mobile first-card/LCP regression is too large to accept. The old infinite-scroll mechanism is also not acceptable because it can stall before the end. Next test should preserve the fast small initial payload while replacing multi-page observer pagination with one reliable deferred bulk load.

### R008 — 12 initial products + one deferred bulk remainder load
- **Baseline:** S4 `5cdf3ad`; S6B `c8ae438`.
- **Hypothesis:** retain the fast 12-product initial payload, then replace observer/page-by-page pagination with one delayed request for all remaining matching products.
- **Architecture:** 12 products initially; one request at a fixed 1200 ms after mount using `offset:12, limit:100`; no IntersectionObserver, page counter, scroll sentinel, loading-more spinner, multi-page actions, or client dedupe state machine.
- **Initial desktop:** HTML 217,168 -> 217,094 B; RSC 128,460 -> 128,450 B; client JS -1,145 B parsed; first card 916 -> 914 ms; first row 1256 -> 1193 ms; LCP 956 -> 950 ms; CLS 0.
- **Initial mobile:** first card 958 -> 995 ms (+37 ms), LCP 992 -> 1024 ms (+32 ms), image bytes unchanged at 41,012 B, CLS unchanged. Both regressions are inside the project <50 ms acceptance window.
- **Remainder:** one ~161.9 KB transfer; append completes around 3.17 s desktop / 3.22 s mobile. Product #38 becomes available ~662–714 ms earlier than S4, although #13 arrives later because the request deliberately waits until after critical rendering.
- **Reliability:** S4 stalled at 24/38 on 9/12 continuous-mobile-scroll runs (75%); S6B reached 38/38 on 12/12 runs with no observer-trigger dependency.
- **Complexity:** 5 files, +71/-140 (net -69); one pagination-related action instead of up to three; ~1.1 KB less parsed client JS.
- **Decision:** **KEEP STRONG**.
- **Why:** preserves initial desktop performance and keeps mobile first-card/LCP within the acceptance window while fixing the pagination correctness/reliability failure and materially simplifying the runtime. Do not tune the 1200 ms delay unless later evidence shows a user-visible need.

### R009 — Remove public storefront `connection()` from category navigation
- **Baseline:** S6B `c8ae438`; S3B `5447900`.
- **Hypothesis:** static public category taxonomy should be prepared with the PPR shell rather than explicitly postponed to request time with `connection()`.
- **Before:** the category tree was rendered behind mobile/header/footer Suspense boundaries at request time; navigation arrived in later streamed chunks and was injected with `$RC(...)`. Every public storefront request executed `getRootCategories()` dynamically.
- **After:** removing one `connection()` call and its import moves category navigation into prepared Chunk 0. All tested routes remain Partial Prerendered and Vercel edge-cacheable; request-time category executions for navigation drop to 0.
- **Visible result:** homepage nav readiness improves ~516 ms desktop / ~608 ms mobile; PLP nav readiness improves ~346 ms desktop / ~418 ms mobile. Homepage LCP improves ~30 ms desktop / ~22 ms mobile; other first-card/LCP deltas are within roughly ±30 ms.
- **Streaming:** homepage streamed `$RC` replacements 9 -> 5; PLP 11 -> 9; category 12 -> 10; PDP 10 -> 8. Homepage application-executed median total completion 822.7 -> 236.4 ms (~586 ms earlier); TTFB is essentially unchanged. Category median total improves ~55 ms; PDP median total ~36 ms, with larger p75 improvements on PLP/PDP.
- **Payload/complexity:** HTML changes are negligible/slightly smaller; RSC unchanged except homepage +543 B. One file, 3 lines removed, no new machinery.
- **Decision:** **KEEP PERFORMANCE**.
- **Why:** a tiny deletion removes request-time dynamic work for immutable public taxonomy and delivers navigation hundreds of milliseconds earlier while preserving PPR/cacheability.

### R010 — Remove Chromium Speculation Rules; keep Next + intent prefetch
- **Baseline:** S3B `5447900`; S7B `fb72be5`.
- **Hypothesis:** Next Link viewport prefetch plus ProductCard intent `router.prefetch()` provides most of the navigation benefit, while Chromium Speculation Rules add duplicate full-document prerender work.
- **Audit:** CURRENT used three overlapping mechanisms: Next automatic/eager Link prefetch, manual pointer/touch `router.prefetch()`, and Chromium `moderate` PDP prerender. One 500 ms hover could trigger both RSC prefetch and a full-document prerender for the same PDP; the category speculation rule was impossible/dead.
- **Hover network:** CURRENT 19 requests / 39,626 B with 11 RSC requests + 2 document prerenders; S7B 7 requests / 20,098 B with 4 RSC requests and 0 document prerenders. Roughly 19.5 KB and 12 requests are removed per measured hover interaction.
- **Navigation:** Chromium desktop immediate useful PDP 721 -> 627 ms (S7B faster); desktop 500 ms hover 535 -> 630 ms median but p75 802 -> 722 ms; mobile tap 603 -> 639 ms (+36 ms median, +45 ms p75, inside acceptance window). Firefox immediate 696 -> 597 ms; hover 585 -> 581.5 ms.
- **Idle/remainder cost:** five-second idle traffic is effectively unchanged because Next viewport prefetch remains (~63 KB speculative for three PDPs). S6B remainder append traffic also remains ~60.7 KB. S7B specifically removes duplicate Chromium document prerender work rather than Next RSC warming.
- **Complexity:** one file, 2 lines removed; zero client-JS delta; removes ~1.5 KB inline speculation-rule HTML from the document.
- **Decision:** **KEEP**.
- **Why:** removes an overlapping Chromium-only scheduler and substantial per-hover duplicate requests while preserving the useful cross-browser Next + intent prefetch path. Mobile regression is within the project threshold and tail/other-browser behavior is neutral or better.

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
| O12 | `connection()` + dynamic navigation category subtree | RESOLVED: KEEP REMOVED | R009 removed the sole public storefront marker. Category nav now ships in PPR Chunk 0 and is ~346–608 ms earlier; private/transactional `connection()` calls remain untouched. |
| O13 | Whole document children behind `Suspense fallback={null}` | RESOLVED: KEEP STRONG | R003 removed it. Category blank-after-TTFB ~463 -> 54 ms; PDP ~320 -> 38 ms; shell visible ~248–408 ms earlier. |
| O14 | Currency resolved from direct country map | KEEP | No commerce call on visual critical path. |
| O15 | Products and filters split into separate Suspense paths | KEEP | Products do not wait for facet computation. |
| O16 | First page limited to 12 products | RESOLVED: KEEP 12 INITIAL | R008 keeps 12 for critical rendering, then fetches the remainder once. This avoids the ~230 ms mobile regression from all-38 initial render. |
| O17 | Automatic page-2 fetch 250 ms after PLP mount | RESOLVED: REMOVED | R008 replaced it with one 1200 ms deferred remainder request after critical rendering. |
| O18 | 1000 px IntersectionObserver prefetch for later pages | RESOLVED: REMOVED | R008 removed observer-gated correctness; continuous mobile scroll now reaches 38/38 reliably. |
| O19 | One high-priority product card image | KEEP / VERIFY | Verify actual LCP candidate per viewport. |
| O20 | Manual product `router.prefetch()` on hover/touch | RESOLVED: KEEP WITH NEXT | R010 shows intent prefetch contributes useful navigation performance, especially outside Chromium speculation; retain alongside Next Link prefetch. |
| O21 | Next `<Link>` automatic product prefetch | RESOLVED: KEEP | R010 keeps Next viewport/eager prefetch as the primary cross-browser warming mechanism. Idle cost is ~63 KB for three PDP RSC payloads in the measured PLP. |
| O22 | Chromium PDP Speculation Rules prerender | RESOLVED: REMOVED | R010 removes it: hover duplicate work falls from 19 requests / 39.6 KB to 7 requests / 20.1 KB while mobile useful-PDP latency regresses only ~36 ms. |
| O23 | Category/product Speculation Rules prefetch rule | RESOLVED: INERT/REMOVE CLEANUP | The category rule is logically impossible and no longer injected after R010. Delete the unused source during later cleanup, not as a claimed runtime win. |
| O24 | Sharp build-time image ingestion | KEEP | Strong fit as source preparation, but runtime Next Image should keep owning final responsive compression after R006. |
| O25 | Seven widths x AVIF + WebP | TEST LATER | R006 shows generated variants are larger than final Next transforms at several target widths; prune only after measuring which source variants Next actually benefits from. |
| O26 | Content-hashed product asset paths | KEEP | Enables immutable source caching and clean invalidation. |
| O27 | One-year immutable cache for `/products/*` static assets | KEEP | Correct for content-hashed source files used by Next Image. |
| O28 | Per-image LQIP + dominant colour | KEEP | R001 proved per-product metadata can be delivered without shipping the global manifest in JS. |
| O29 | Full media manifest imported by client ProductCard/PDP code | RESOLVED: KEEP STRONG | R001 removed it: ~53.8 KB parsed JS and ~9 KB compressed affected chunk eliminated without RSC/HTML relocation. |
| O30 | `next/image` on pre-generated local WebP/AVIF | RESOLVED: KEEP NEXT IMAGE | R006 direct-delivery A/B nearly doubled first-viewport image bytes and delayed PLP/home image completion. Runtime transformation is doing useful responsive compression. |
| O31 | 31-day Next transformed-image TTL | KEEP | Relevant and useful because R006 keeps Next Image runtime transformation. |
| O32 | Broad Next image qualities/device sizes | TEST LOW PRIORITY | Still relevant while Next owns final transforms; simplify only with evidence about actual requested widths/qualities. |
| O33 | ProductImage as Client Component solely for error fallback | LATER TEST | Lower priority than listing/navigation/cart simplification. |
| O34 | PDP main image eager/high priority | KEEP / VERIFY | S5 PDP route timing was confounded; do not change priority policy based on that result. |
| O35 | PDP lightbox dynamic import | KEEP | Rare interaction; sensible deferral. |
| O36 | Homepage hero from Unsplash through Next optimizer | SIMPLIFY LATER | Major remaining remote image origin; separate experiment only. |
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

1. **S8 — Cart path:** trace add/update/remove/cart hydration, then remove redundant `router.refresh()` and pathname-based cart refetch if measurements confirm they are wasted work. This is the final major audit experiment.
2. **After S8 — improvement phase:** stop broad audit of existing micro-optimizations and design new high-impact work for native-feeling soft navigation, interaction latency, PDP transitions, and delivery strategy.
3. **Later cleanup only:** cache-wrapper simplification, image-width pruning, unused SpeculationRules/Swiper CSS/dependencies, stale docs/features.

## Measurement notes / known facts

- R010 closes navigation scheduler audit: keep Next Link viewport/eager prefetch plus manual ProductCard intent prefetch; remove the Chromium Speculation Rules injection. The latter duplicated RSC warming with full-document prerender work.
- R009 removed the public storefront `connection()`: static category navigation now ships in initial PPR Chunk 0, reaches the DOM ~346–608 ms earlier, and no longer performs request-time category rendering.
- R008 resolved the listing-strategy tradeoff: keep 12 products in the critical initial payload, then fetch the remainder once after critical rendering. This preserves mobile startup while removing observer/page-by-page failure modes.
- R007 showed why neither extreme was acceptable: all 38 immediately is simple and reliable on desktop but costs ~230 ms mobile LCP/first-card; old observer pagination preserves initial payload but can stall at 24 products.
- R006 disproved the assumption that direct prepared catalog assets would be faster: Vercel Next Image cut first-viewport image bytes roughly in half and improved PLP/home image completion. Keep `/_next/image` for catalog surfaces.
- R006 PDP route timings moved earlier in the direct variant, but title moved by the same ~150 ms and mobile direct image duration regressed sharply; treat the PDP result as timing confound, not a reason for a hybrid implementation yet.
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