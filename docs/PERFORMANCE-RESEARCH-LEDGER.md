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
- **After:** 0 internal catalog HTTP calls on the audited render paths; API compatibility remained intact; 3 files changed, +105/-137 (net -32 lines).
- **Production A/B:** application-executed median TTFB differences were neutral/noisy: homepage +0.2%, PLP +1.4%, category -0.3%, PDP +3.1%. Warm CDN-HIT results also showed no reliable speed win.
- **Serialization:** RSC/HTML shrank ~1.3–2.2% because SDK/JSON:API envelope metadata and duplicate master variant serialization disappeared; DOM markup remained byte-identical on the checked PDP.
- **Decision:** **KEEP SIMPLIFICATION**, not a latency optimization.
- **Why:** Vercel/Next caching had already hidden most warm self-HTTP cost. Keep the direct path because it removes architectural recursion/failure surface without measurable latency regression. P1 later showed that the current public PDP product helper still contains request/cache-oriented SDK machinery and must be re-audited separately in P2.

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

### R011 — Remove redundant cart refresh and route-change polling
- **Baseline:** S7B `fb72be5`; S8A `ebf8549`; S8B `6749369`.
- **Hypothesis:** cart mutation responses already contain authoritative state, so `router.refresh()` and pathname-driven `getCart()` polling are redundant.
- **Mutation result:** removing `router.refresh()` cuts Add bytes 569,677 -> 458,498 B (-19.5%), Update 286,968 -> 196,998 B (-31.4%), Remove 693,405 -> 468,906 B (-32.4%). Visible update timing improves ~20–66 ms while header count, drawer, subtotal, quantity, removal and hard-refresh persistence remain correct.
- **Navigation result:** five ordinary route transitions go from 5 `getCart` Server Actions + 5 cart API reads (~3.2 KB cart data) to 0. Initial hydration, add/update/remove across navigation, reload, new tab and order-placed reset all pass.
- **Timing caveat:** five-route useful-navigation median moved ~359 -> ~402 ms, inside the project's noise/acceptance band and not causally tied to a required cart dependency.
- **Decision:** **KEEP BOTH**.
- **Why:** deletes large RSC/revalidation cascades after mutation and eliminates 100% of routine cart polling without correctness loss.

### R012 — Prewarm the exact responsive PDP hero on product intent
- **Baseline:** S8B `6749369`; P1 `7173c5d`.
- **Hypothesis:** the visible PDP image lag is primarily late resource discovery: the hero request starts only after the cold PDP RSC/title arrives. Start the exact Next Image candidate on the existing ProductCard intent event so image and route work overlap.
- **Baseline waterfall:** cold desktop hero request begins ~592–1098 ms after the RSC request starts; mobile ~476–479 ms after. The hero can paint ~187–991 ms after the title, making image latency the most visible second-stage delay.
- **Implementation:** `getImageProps` generates the same responsive Next Image `srcset`/`sizes`/q75 candidates as the PDP (`zoom-1600.webp`; measured w=640 desktop, w=1200 mobile). Pointer/touch intent inserts one deduplicated image preload alongside the existing route prefetch.
- **Reuse/cost:** preload reuse 60/60 measured runs, 0 duplicate hero requests, 0 image-byte increase (desktop 18,893 B unchanged; mobile 48,514 B unchanged), +180 B gzip / +480 B parsed client JS, 0 HTML/RSC delta.
- **Visible result:** desktop 250 ms hover hero 1141.1 -> 672.3 ms (-468.8 ms); mobile normal tap 1034.1 -> 483.8 ms (-550.3 ms); title-to-hero gap falls to ~2 ms. At 500 ms hover the hero can finish before the click.
- **Route-timing anomaly:** desktop immediate-click title timing varied 858.7 -> 1384.6 ms and the 500 ms case 676.6 -> 829.4 ms. Because the 500 ms hero was already fully downloaded before click, this cannot be explained by concurrent image transfer alone; cold-route/cache variance remains a confound. P2 must explicitly re-measure route timing and immediate-click contention rather than hiding this result.
- **Decision:** **KEEP STRONG**, with the route anomaly carried forward as a P2 control.
- **Why:** directly removes the serial image-discovery waterfall with exact cache reuse and no extra bytes. After P1, the hero appears essentially with the title; the remaining dominant latency is cold PDP route/data resolution.

## Current optimization audit

| ID | Optimization / mechanism | Status | Current audit note |
|---|---|---|---|
| O01 | Next Cache Components + cache lifetimes | TEST | Catalog is now in-process static data. Re-test remote-style cache wrappers only where the new improvement phase proves they are on a critical path. |
| O02 | Canonical edge cache classes / `s-maxage` / SWR | KEEP | Production A/B confirms Vercel edge caching is active and materially hides server execution on warm routes. |
| O03 | Suppress redundant locale `Set-Cookie` | KEEP | Prevents unnecessary cache-busting headers after locale is established. |
| O04 | React request memoization (`cache()`) | KEEP | Cheap request-level deduplication. |
| O05 | Parallel independent server work (`Promise.all`) | KEEP | Correct low-complexity waterfall removal. |
| O06 | Narrow product-card fields | KEEP | Still reduces serialization/client props. |
| O07 | Build-time `generateStaticParams` for PDP/category routes | KEEP / P2 VERIFY | PDP slugs are enumerated, but P1 shows cold PDP data still resolves slowly; P2 must determine why the prepared route is not effectively instant. |
| O08 | Server data layer -> SDK -> public same-app BFF -> local repository | RESOLVED GENERALLY / P2 RE-AUDIT PDP | R002 simplified audited server reads, but current PDP helper still contains `getProduct -> getLocaleOptions/getAccessToken -> use cache: remote -> SDK` machinery before local fallback. P2 isolates this path. |
| O09 | `use cache: remote` around catalog reads | P2 HIGH | P1 isolates cold PDP route/data as the dominant remaining latency; test whether the generic remote-style cache wrapper is unnecessary for public static DTC product data. |
| O10 | User token included in public catalog/product cache keys | P2 HIGH | Public DTC catalog is not personalized; token/cookie participation may prevent static preparation and reduce cache reuse. |
| O11 | Root market/category reads via remote-style path | PARTLY RESOLVED | R002 moved public reads toward local repository/constants; PDP-specific path is now being audited separately. |
| O12 | `connection()` + dynamic navigation category subtree | RESOLVED: KEEP REMOVED | R009 moved category nav into PPR Chunk 0 and made it ~346–608 ms earlier. |
| O13 | Whole document children behind `Suspense fallback={null}` | RESOLVED: KEEP STRONG | R003 removed it; visible shell arrives hundreds of milliseconds earlier. |
| O14 | Currency resolved from direct country map | KEEP | No commerce call on visual critical path. |
| O15 | Products and filters split into separate Suspense paths | KEEP | Products do not wait for facet computation. |
| O16 | First page limited to 12 products | RESOLVED: KEEP 12 INITIAL | R008 preserves fast critical rendering, then fetches the remainder once. |
| O17 | Automatic page-2 fetch 250 ms after PLP mount | RESOLVED: REMOVED | Replaced by one deferred bulk remainder request. |
| O18 | 1000 px IntersectionObserver pagination | RESOLVED: REMOVED | R008 fixes the 24/38 continuous-scroll stall. |
| O19 | One high-priority product card image | KEEP / VERIFY | Verify actual PLP LCP candidate later; not current dominant issue. |
| O20 | Manual product `router.prefetch()` on hover/touch | RESOLVED: KEEP WITH NEXT | Retained after R010; P1 reuses the same intent event for exact hero prewarm. |
| O21 | Next `<Link>` automatic product prefetch | RESOLVED: KEEP | Primary cross-browser route warming mechanism; P2 must determine why cold PDP still requires ~0.5–1.1 s. |
| O22 | Chromium PDP Speculation Rules prerender | RESOLVED: REMOVED | R010 removed duplicate full-document work. |
| O23 | Category/product Speculation Rules rule | RESOLVED: INERT/REMOVE CLEANUP | No longer injected; delete source during cleanup only. |
| O24 | Sharp build-time image ingestion | KEEP | Supplies stable hashed sources and P1's exact 1600 WebP hero source. |
| O25 | Seven widths x AVIF + WebP | TEST LATER | Prune only after source/transform usage evidence. |
| O26 | Content-hashed product asset paths | KEEP | Enables immutable source caching and clean invalidation. |
| O27 | One-year immutable cache for `/products/*` sources | KEEP | Correct for content-hashed source files. |
| O28 | Per-image LQIP + dominant colour | KEEP / PDP LQIP LATER | P1 fixed real image availability; using the real PDP LQIP is now a perceptual polish item, not the primary latency fix. |
| O29 | Full media manifest in client JS | RESOLVED: REMOVED STRONG | R001 removed ~53.8 KB parsed JS without payload relocation. |
| O30 | `next/image` on prepared assets | RESOLVED: KEEP NEXT IMAGE | R006 showed direct delivery nearly doubled viewport image bytes. P1 proves Next candidates can be prewarmed exactly without bypassing the optimizer. |
| O31 | 31-day transformed-image TTL | KEEP | Useful with Next Image and P1 prewarming. |
| O32 | Broad Next image qualities/device sizes | TEST LOW PRIORITY | Not the current bottleneck. |
| O33 | ProductImage Client Component for error fallback | LATER TEST | Not current bottleneck. |
| O34 | PDP main image eager/high priority | KEEP | P1 shows the problem was discovery timing, not lack of priority after discovery. |
| O35 | PDP lightbox dynamic import | KEEP | Rare interaction; sensible deferral. |
| O36 | Homepage Unsplash hero | SIMPLIFY LATER | Separate from PDP critical path. |
| O37 | Native CSS carousel | KEEP | Runtime Swiper already absent. |
| O38 | `swiper` package / old CSS | REMOVE CLEANUP | Cleanup only. |
| O39 | Native carousel dynamic import | RESOLVED: KEEP STATIC | R005 made featured cards ~135 ms earlier. |
| O40 | Featured outer data Suspense | PARTLY RESOLVED | Only revisit with evidence. |
| O41 | Mobile `content-visibility:auto` | KEEP / VERIFY | Low priority. |
| O42 | React Compiler + `memo(ProductCard)` | TEST LOW PRIORITY | Not current bottleneck. |
| O43 | Whole PDP `ProductDetails` client boundary | LATER | P1 shows route/data, not post-render hydration, is the immediate dominant delay. |
| O44 | In-memory serverless BFF cart `Map` | SIMPLIFY / CORRECTNESS RISK | Persistence issue for real deployment; outside current PDP performance focus. |
| O45 | Legacy Spree cart orchestration | LATER CLEANUP | S8 removed the measured refresh/polling waste; broader cart rewrite is not justified by current latency evidence. |
| O46 | `router.refresh()` after cart mutation | RESOLVED: REMOVED | R011 cuts mutation bytes ~19–32% with no correctness loss. |
| O47 | Re-fetch cart on pathname change | RESOLVED: REMOVED | R011 drops ordinary navigation cart reads to zero. |
| O48 | Cart drawer opens immediately | KEEP | Good instant acknowledgement. |
| O49 | Vercel Analytics + Speed Insights | KEEP | Measurement tooling justified during research. |
| O50 | GTM optional | KEEP OFF FOR CONTROL TESTS | Avoid third-party noise in benchmarks. |
| O51 | Lighthouse budgets / CI | KEEP | Regression guard only. |
| O52 | Old benchmark JSON | HISTORICAL ONLY | Pre-serverless baseline. |
| O53 | HTTP-only harness | KEEP AS SERVER TOOL | Not a substitute for visible browser milestones. |
| O54 | Stale Render redirects | CLEANUP | Repository hygiene only. |
| O55 | Stale architecture docs | UPDATE | Documentation should match active architecture. |
| O56 | Payment/checkout/wholesale surface | SCOPE CLEANUP | Prune only with bundle/runtime or project-scope evidence. |
| O57 | Exact PDP hero intent prewarm | RESOLVED: KEEP STRONG | R012 starts the exact responsive Next Image candidate ~0.47–1.16 s earlier, reuses it 60/60 with zero duplicate bytes, and collapses title-to-hero lag to ~2 ms. |
| O58 | Public DTC PDP product resolution through request/cache/SDK machinery | TEST NEXT / P2 | P1 leaves ~0.48–0.83 s median cold title latency and up to ~1.1 s observed response time. Audit whether local static product data can bypass locale/auth/remote-cache/SDK work. |

## Current execution queue

1. **P2 — Cold public DTC PDP route/data path:** trace the exact server request graph and compare the current generic `getCachedProduct/getProduct/use cache: remote/SDK` path against a direct local static DTC product resolution while preserving wholesale/private behavior. Keep P1 enabled and explicitly control for its desktop route-timing anomaly.
2. **P3 — PDP perceptual polish only after P2:** feed the real generated product LQIP/dominant colour into the PDP hero if a visible placeholder gap remains. Do not confuse this with network latency reduction.
3. **Later:** PDP client-boundary/hydration work only if post-P2 traces show JavaScript/hydration is the next dominant delay; otherwise move to the next measured UX bottleneck.

## Measurement notes / known facts

- R012 changes the PDP image problem from a serial waterfall into parallel work: exact hero preload begins on intent and is reused by the eventual Next `<Image>` with zero duplicate requests. The remaining dominant user-visible delay is cold route/data resolution.
- R012 desktop immediate-click/title timing was noisy and sometimes worse; P2 must retain a baseline control and report whether high-priority image prewarm competes with the RSC on near-zero-dwell clicks.
- R011 removes redundant cart refresh/polling: mutation responses are authoritative client state; routine navigation no longer performs cart reads.
- R010 closes the navigation scheduler audit: keep Next Link + manual intent prefetch; remove Chromium full-document speculation.
- R009 moved static category navigation into initial PPR Chunk 0, ~346–608 ms earlier.
- R008 resolved listing strategy: 12 products critical, one deferred remainder request; continuous scroll reaches 38/38.
- R006 proved Next Image should remain the final responsive optimizer despite pre-generated source variants.
- R005 proved the native carousel should remain statically imported.
- Edge-cache state can hide server inefficiency; distinguish HIT from application-executed results.

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
