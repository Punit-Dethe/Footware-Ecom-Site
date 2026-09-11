# Performance Research Paper Evidence

> Paper-oriented evidence log derived from controlled storefront experiments. This complements `PERFORMANCE-RESEARCH-LEDGER.md`: the ledger is the engineering source of truth; this file is organized for methodology, results, negative findings, discussion, and threats-to-validity sections.

## Experimental method

- One primary performance variable per experiment whenever possible.
- Correctness fixes are separated from performance changes when they would otherwise contaminate A/B comparisons.
- Browser-visible milestones are preferred over HTTP-only timing for user-facing claims.
- Production Vercel previews are compared with alternating runs where practical.
- Median is the default summary statistic; p75 is included when tail behavior matters.
- Changes are classified as KEEP, KEEP SIMPLIFICATION, REVERT, or correctness-only.
- Failed optimizations are retained as research evidence rather than discarded.
- Approximate acceptance rule for visible latency: a repeatable >=50 ms or >=5-10% win is meaningful; results inside noise favor the simpler implementation.

## Evidence matrix

| ID | Experiment / hypothesis | Main measured result | Decision | Research takeaway |
|---|---|---|---|---|
| R001 | Remove the full product-media manifest from client JS and serialize only per-product media | ~53.3 KB parsed client JS removed per major route; ~9 KB compressed shared-chunk impact removed; no equivalent RSC/HTML relocation | KEEP STRONG | Large global metadata objects can quietly become client-bundle tax even when each visible card needs only a few hundred bytes of that metadata. |
| R002 | Bypass same-app public HTTPS/BFF calls for server-side catalog reads | Recursive HTTP work removed on audited render paths; latency neutral because Vercel caching hid most warm cost; RSC/HTML shrank ~1.3-2.2% | KEEP SIMPLIFICATION | Removing architectural indirection can improve reliability/complexity without producing a headline latency win when edge caches already mask the cost. |
| R003 | Replace root `<Suspense fallback={null}>` with granular PPR boundaries | Visible shell ~248-408 ms earlier depending on route; category blank-after-TTFB ~463 -> ~54 ms; PDP ~320 -> ~38 ms | KEEP STRONG | A single blanket Suspense boundary can erase the benefit of otherwise fast streaming/PPR by hiding the whole shell behind one slow subtree. |
| R004 | Fix homepage featured-products Resume Data Cache / RSC stream abort | Featured products render reliably in 100% of measured runs; PPR and edge caching preserved | KEEP CORRECTNESS | Performance work exposed a correctness interaction: public-route cookie access and swallowed Next dynamic exceptions can corrupt PPR resume behavior. |
| R005 | Stop dynamically importing a now-lightweight native carousel | First real featured card ~135 ms earlier; skeleton duration roughly halved; parsed JS unchanged | KEEP STRONG | Dynamic import can become an anti-optimization after a heavy dependency is replaced by tiny native code. Re-audit historical optimizations after architecture changes. |
| R006 | Bypass `next/image` and directly serve pre-generated AVIF/WebP variants | First-viewport image bytes 77.7 KB -> 149.3 KB (+92%); PLP first-image +96 ms, first-row +143 ms, homepage featured image +150 ms | REVERT / KEEP NEXT IMAGE | "Double optimization" looked redundant in theory, but Next's responsive transform produced materially smaller assets. Empirical browser bytes beat architectural intuition. |
| R007 | Render all 38 products initially instead of 12 + incremental loading | Desktop roughly neutral, but mobile first-card +223 ms and LCP +234 ms; payload +270 KB HTML / +167 KB RSC | REJECT CURRENT ALL-38 | Simplifying pagination by rendering the full catalog can move too much work into the critical mobile path even when desktop tolerates it. |
| R008 | Keep 12 initial products, then fetch all remaining products once after 1200 ms | Desktop neutral; mobile first-card +37 ms, LCP +32 ms; old 75% continuous-scroll stall rate becomes 0%; net -69 lines | KEEP STRONG | Hybrid scheduling preserved the small critical payload while removing observer/page-state complexity and reliability failures. |
| R009 | Remove public storefront `connection()` around static category taxonomy | Nav readiness improves ~346-608 ms; category subtree moves into PPR Chunk 0; request-time category executions drop to 0 | KEEP PERFORMANCE | Explicitly marking static public data as request-dynamic can force unnecessary stream chunks and delay navigation chrome by hundreds of milliseconds. |
| R010 | Remove Chromium Speculation Rules while keeping Next Link + manual intent prefetch | Hover work 19 req / 39.6 KB -> 7 req / 20.1 KB; mobile useful PDP +36 ms but inside threshold; desktop immediate and Firefox results neutral/better | KEEP | Layering multiple navigation accelerators can duplicate work. Cross-browser Next prefetch + lightweight intent warming retained most benefit without full-document prerender duplication. |
| R011 | Remove redundant cart `router.refresh()` and pathname-driven cart polling | Mutation bytes: Add -19.5%, Update -31.4%, Remove -32.4%; 5-route navigation cart refetches 5 -> 0; full correctness matrix passed | KEEP BOTH | Mutation responses already contained the authoritative cart. Extra RSC refreshes and route-change polling created large cascades without improving UI correctness. |
| R012 | Start the exact responsive PDP hero image on ProductCard intent instead of waiting for PDP render | Hero request begins ~469-1161 ms earlier; desktop 250 ms hover hero -469 ms; mobile tap hero -550 ms; title-to-hero lag collapses to ~2 ms; 60/60 preload reuse, 0 duplicate requests, 0 byte increase | KEEP STRONG | Resource-discovery latency can dominate even when the image itself is optimized. Starting the exact eventual image request in parallel with navigation removes a serial waterfall without bypassing Next Image. |

## Detailed negative and counter-intuitive results

### Direct prepared images lost to Next Image

The pre-generated image pipeline already produced multiple AVIF/WebP widths, so bypassing `/_next/image` appeared likely to remove redundant transformation. The opposite happened in production: direct delivery nearly doubled first-viewport image bytes and delayed product-grid/home image completion. This is an important negative result because it demonstrates that platform image optimization can remain useful even when a build-time image pipeline already exists.

The PDP route showed a seemingly favorable ~150-160 ms route-level movement in the direct-image variant, but the product title moved by almost the same amount while the mobile direct-image request itself became much slower. That makes the PDP route result a timing/cache confound rather than evidence for a hybrid direct-delivery policy.

### Rendering all products was simpler but too expensive on mobile

Rendering all 38 products removed the pagination state machine and made every item immediately reachable, but increased initial HTML/RSC substantially and regressed mobile first-card/LCP by ~223-234 ms. The follow-up S6B experiment retained the best property (reliable access to all products) while moving the remainder fetch after the critical paint.

### Same-app HTTP removal produced no meaningful warm latency win

Direct in-process catalog access simplified the architecture, but application-executed and warm-cache route latency remained essentially neutral. The infrastructure/cache layer had already hidden most of the recursive-call overhead. The change is still kept because it reduces failure surface and serialization overhead. P1 later exposed that the current public PDP helper still contains request/cache-oriented SDK machinery and therefore deserves a dedicated cold-route experiment rather than assuming the earlier result generalized forever.

### Speculation Rules were not the universal winner

The original product-card path stacked Next viewport/eager prefetch, manual intent prefetch, and Chromium full-document prerendering. Hovering one card could warm the same PDP through both RSC prefetch and document prerender. Removing the Speculation Rules layer cut per-hover work materially while keeping mobile navigation within the project's acceptance limit and retaining cross-browser behavior.

## Cart audit (R011) — detailed paper evidence

**Baseline:** S7B `fb72be58d8d40074f1e257e453d3bf2722dfe6d4`.

**S8A:** `ebf8549461b384021a0dafbc9c723f89b879f438` — remotely verified.

**S8B:** `6749369baec9349e2d21b337d54ff478646a969a` — remotely verified.

The earlier evidence draft carried an executor-reported S8B SHA that was not yet reachable remotely. After synchronization, both accepted S8 commits were verified in the repository and the corrected S8B SHA above is the reproducible reference.

### Baseline mutation graph

Add/update/remove each returned the full updated cart to the client and immediately updated React context, but then also called `router.refresh()`. That refresh caused extra RSC work and large link-prefetch/revalidation cascades. No subsequent `getCart()` was needed for mutation correctness because the mutation response already contained the authoritative cart.

### S8A — remove mutation `router.refresh()`

- Add bytes: 569,677 -> 458,498 B (-111,179 B, -19.5%).
- Update bytes: 286,968 -> 196,998 B (-89,970 B, -31.4%).
- Remove bytes: 693,405 -> 468,906 B (-224,499 B, -32.4%).
- Quantity update: ~737 -> ~670.5 ms (-66.5 ms).
- Add line update: ~889.5 -> ~860.5 ms (-29 ms).
- Remove empty-state update: ~738.5 -> ~718 ms (-20.5 ms).
- Header count, drawer contents, subtotal, quantity, removal, post-navigation state, and hard-refresh persistence all passed.

**Decision:** KEEP SIMPLIFICATION & PERFORMANCE.

### S8B — stop pathname-based cart polling

Baseline ordinary navigation executed `refreshCart()` after every pathname change, causing a Server Action plus cart API read even when the in-memory cart had not changed. S8B changed the model to one initial hydration on provider mount plus mutation-driven state, while preserving the explicit order-placed reset.

Across a five-route navigation sequence:

- `getCart` calls: 5 -> 0.
- Cart API calls: 5 -> 0.
- Cart bytes: ~3,165 B -> 0 B.
- Useful navigation timing moved 359 ms median / 379 ms p75 -> 402 ms median / 440 ms p75; this was not considered a cart-specific regression because the removed work was post-navigation polling rather than a required destination dependency, and correctness remained intact.
- Initial load with existing cookie: PASS.
- Add -> navigate: PASS.
- Update -> navigate: PASS.
- Remove -> navigate: PASS.
- Reload: PASS.
- New tab: PASS.
- Order-placed reset: PASS.
- Login/logout: not required for the catalog-navigation validation; dedicated auth actions own token transitions.

**Decision:** KEEP.

## PDP image discovery experiment (R012 / P1) — detailed paper evidence

**Baseline:** accepted S8B `6749369baec9349e2d21b337d54ff478646a969a`.

**P1:** `7173c5d440d977a1dc0ec771c1fccd8a8b7a0aab` — remotely verified.

### Baseline serial waterfall

On cold PDP navigation, the browser started the navigation RSC almost immediately (~18-22 ms after click), but the main image was not discovered until the PDP data/title arrived:

- Desktop RSC response/title: roughly 0.6-1.1 s after click in observed cold traces.
- Desktop hero request start: ~592-1098 ms after RSC request start.
- Desktop hero visible: ~1.4-2.1 s after click in the sampled cold traces, often ~790-991 ms after title.
- Mobile hero request start: ~476-479 ms after RSC start.
- Mobile hero visible: ~987-1131 ms after click, ~187-637 ms after title.
- Warm revisit: title and hero both collapse to roughly 20-27 ms, showing that the major first-visit cost is cold route/resource availability rather than expensive DOM rendering.

### P1 implementation

The ProductCard's existing `pointerenter`/`touchstart` intent event was extended to preload exactly one PDP hero image while preserving the existing route prefetch. `getImageProps` generated the same responsive Next Image candidate set used by the PDP (`sizes="(max-width: 768px) 100vw, 50vw"`, quality 75) from the product's `zoom-1600.webp` source.

Measured selected transformed candidates were:

- Desktop: `/_next/image?...zoom-1600.webp&w=640&q=75`.
- Mobile: `/_next/image?...zoom-1600.webp&w=1200&q=75`.

A document-level dedupe set prevents repeated preload elements for the same hero source.

### P1 result

- Hero request starts ~469-1161 ms earlier depending on scenario.
- Desktop 250 ms hover: hero visible 1141.1 -> 672.3 ms (-468.8 ms); title-to-hero delay 464.2 -> 2.1 ms.
- Desktop 500 ms hover: hero can complete before the click; title and image then arrive together.
- Mobile normal tap: hero visible 1034.1 -> 483.8 ms (-550.3 ms); title-to-hero delay 558.8 -> 2.0 ms.
- Preload reuse: 60/60 measured runs.
- Duplicate hero requests: 0/60.
- Desktop hero bytes: 18,893 -> 18,893 B.
- Mobile hero bytes: 48,514 -> 48,514 B.
- Client bundle cost: ~+180 B transfer / +480 B parsed.
- HTML/RSC delta: 0.

**Decision:** KEEP STRONG.

### P1 caveats / confounds

Desktop route/title timing was not perfectly stable. In the immediate-click sample, title moved 858.7 -> 1384.6 ms; in the 500 ms-hover sample, 676.6 -> 829.4 ms. The latter occurred even though the hero had already completed before click, so concurrent image bandwidth cannot fully explain the difference. Cold route/cache state is therefore a material confound and must be controlled in the next PDP-data experiment.

The mobile cache-status distribution also differed between A and B in one set (A included optimizer MISSes while B was all HIT). The strongest P1 claim therefore does not rely on cache-header comparisons; it relies on direct request-start ordering, exact URL/candidate reuse, zero duplicate bytes, and the disappearance of the post-title serial image gap.

## Confirmed architectural lessons

1. **Critical-path bytes matter more than total eventual bytes.** S6B succeeds by keeping 12 products in the initial payload even though it still transfers the remainder later.
2. **Streaming boundaries are part of performance architecture.** PPR only helps when useful shell content is not trapped behind blanket or unnecessary dynamic boundaries.
3. **Historical optimizations must be re-evaluated after simplification.** The carousel dynamic import became harmful after Swiper runtime disappeared.
4. **Platform optimizers should be measured, not assumed redundant.** Next Image beat direct delivery despite existing build-time variants.
5. **Prefetch mechanisms need a budget.** Multiple schedulers can fetch overlapping representations of the same destination.
6. **Mutation responses should be treated as state updates.** Re-fetching or refreshing after receiving complete authoritative state often creates redundant RSC/network work.
7. **Small-catalog architecture should be optimized for its actual scale.** Elaborate observer/page machinery was less reliable and more complex than one deferred remainder fetch.
8. **Edge caching can hide server architectural inefficiency.** A simplification can be worth keeping even when end-user latency does not move because it removes recursion/failure modes.
9. **Resource discovery can matter more than resource transfer.** P1 did not shrink the hero image at all; it made the existing exact image request start hundreds of milliseconds earlier and thereby removed a serial waterfall.
10. **Negative and anomalous results are research results.** Route-timing variance and cache-state differences are preserved explicitly instead of being removed from the narrative.

## Remaining engineering findings / cleanup backlog

These are preserved for completeness but are not part of the completed broad audit phase unless future evidence elevates them:

- Public DTC PDP product resolution still flows through generic request/cache-oriented helpers (`getLocaleOptions`, access-token lookup, `use cache: remote`, SDK client) before local/static fallback; P2 is now the highest-priority experiment.
- Public catalog cache keys segmented by user token may be unnecessary for DTC and may inhibit static preparation/reuse.
- One high-priority product-card image: verify actual PLP LCP candidate only after the PDP critical path is solved.
- Seven generated image widths x AVIF/WebP: prune only after observing source/transform usage.
- `ProductImage` client boundary used mainly for error fallback: later test.
- PDP `ProductDetails` broad client boundary: potential hydration target only if post-P2 traces show hydration dominates.
- Real generated PDP LQIP/dominant colour is available but the PDP still uses a generic placeholder; this is perceptual polish after P2, not the current latency bottleneck.
- Homepage remote Unsplash hero: candidate for local/source-delivery redesign.
- Swiper dependency / obsolete `.swiper-*` CSS: cleanup only; no runtime Swiper chunk was observed.
- Unused/inert `SpeculationRules.tsx`: cleanup only after R010 removed its injection.
- Old Render `/admin` redirects and stale architecture documentation: repository hygiene updates.
- Payment/checkout/wholesale feature surface exceeds the research storefront's required scope; prune only where bundle/runtime evidence or project scope justifies it.
- Serverless in-memory cart `Map`: correctness/persistence risk for a real multi-instance deployment; not changed during S8 because persistence architecture was intentionally out of scope.

## Phase boundary

**Broad audit phase: COMPLETE through R011 / S8.**

**Proactive improvement phase: STARTED with R012 / P1.**

P1 removes the visible post-title image waterfall. The immediate next research question is no longer image compression or image priority; it is why a cold public PDP still needs roughly half a second to over a second for route/data resolution when the underlying DTC catalog is static and previously visited routes are effectively instantaneous.

## Threats to validity to preserve for the paper

- Vercel edge-cache state can hide server execution cost; HIT and application-executed/BYPASS results must be distinguished.
- Browser timing has run-to-run variance; medians and p75s are more reliable than single traces.
- Some route-level timing changes can be confounded by cache state or unrelated streamed content (as seen in the S5 PDP anomaly and P1 desktop title variance).
- P1 cache-status populations were not perfectly balanced in all scenarios; claims should emphasize exact request ordering/reuse and no-byte duplication rather than attribute all visible improvement to CDN HIT rate.
- Soft-navigation LCP instrumentation can be misleading because standard LCP is page-lifecycle oriented; title/hero-visible milestones are more reliable for PDP transition comparisons.
- Chromium-only APIs cannot be generalized to Firefox/Safari without cross-browser controls.
- The current real catalog is 38 products; synthetic 70-product probes are scale evidence, not production results.
- Serverless preview behavior and network geography may differ from eventual production traffic distributions.
- Uncompressed HTML/RSC byte counts are useful for relative comparisons but are not identical to transferred compressed bytes.
- The project intentionally excludes real payment/order/fulfillment complexity, so findings should be framed as storefront/delivery performance results rather than a complete commerce-platform benchmark.
