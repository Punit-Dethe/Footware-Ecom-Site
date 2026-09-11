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
| R002 | Bypass same-app public HTTPS/BFF calls for server-side catalog reads | 1-4 recursive HTTP calls per render removed; latency neutral because Vercel caching hid most warm cost; RSC/HTML shrank ~1.3-2.2% | KEEP SIMPLIFICATION | Removing architectural indirection can improve reliability/complexity without producing a headline latency win when edge caches already mask the cost. |
| R003 | Replace root `<Suspense fallback={null}>` with granular PPR boundaries | Visible shell ~248-408 ms earlier depending on route; category blank-after-TTFB ~463 -> ~54 ms; PDP ~320 -> ~38 ms | KEEP STRONG | A single blanket Suspense boundary can erase the benefit of otherwise fast streaming/PPR by hiding the whole shell behind one slow subtree. |
| R004 | Fix homepage featured-products Resume Data Cache / RSC stream abort | Featured products render reliably in 100% of measured runs; PPR and edge caching preserved | KEEP CORRECTNESS | Performance work exposed a correctness interaction: public-route cookie access and swallowed Next dynamic exceptions can corrupt PPR resume behavior. |
| R005 | Stop dynamically importing a now-lightweight native carousel | First real featured card ~135 ms earlier; skeleton duration roughly halved; parsed JS unchanged | KEEP STRONG | Dynamic import can become an anti-optimization after a heavy dependency is replaced by tiny native code. Re-audit historical optimizations after architecture changes. |
| R006 | Bypass `next/image` and directly serve pre-generated AVIF/WebP variants | First-viewport image bytes 77.7 KB -> 149.3 KB (+92%); PLP first-image +96 ms, first-row +143 ms, homepage featured image +150 ms | REVERT / KEEP NEXT IMAGE | "Double optimization" looked redundant in theory, but Next's responsive transform produced materially smaller assets. Empirical browser bytes beat architectural intuition. |
| R007 | Render all 38 products initially instead of 12 + incremental loading | Desktop roughly neutral, but mobile first-card +223 ms and LCP +234 ms; payload +270 KB HTML / +167 KB RSC | REJECT CURRENT ALL-38 | Simplifying pagination by rendering the full catalog can move too much work into the critical mobile path even when desktop tolerates it. |
| R008 | Keep 12 initial products, then fetch all remaining products once after 1200 ms | Desktop neutral; mobile first-card +37 ms, LCP +32 ms; old 75% continuous-scroll stall rate becomes 0%; net -69 lines | KEEP STRONG | Hybrid scheduling preserved the small critical payload while removing observer/page-state complexity and reliability failures. |
| R009 | Remove public storefront `connection()` around static category taxonomy | Nav readiness improves ~346-608 ms; category subtree moves into PPR Chunk 0; request-time category executions drop to 0 | KEEP PERFORMANCE | Explicitly marking static public data as request-dynamic can force unnecessary stream chunks and delay navigation chrome by hundreds of milliseconds. |
| R010 | Remove Chromium Speculation Rules while keeping Next Link + manual intent prefetch | Hover work 19 req / 39.6 KB -> 7 req / 20.1 KB; mobile useful PDP +36 ms but inside threshold; desktop immediate and Firefox results neutral/better | KEEP | Layering multiple navigation accelerators can duplicate work. Cross-browser Next prefetch + lightweight intent warming retained most benefit without full-document prerender duplication. |
| R011 | Remove redundant cart `router.refresh()` and pathname-driven cart polling | Mutation bytes: Add -19.5%, Update -31.4%, Remove -32.4%; 5-route navigation cart refetches 5 -> 0; full correctness matrix passed | KEEP BOTH | Mutation responses already contained the authoritative cart. Extra RSC refreshes and route-change polling created large cascades without improving UI correctness. |

## Detailed negative and counter-intuitive results

### Direct prepared images lost to Next Image

The pre-generated image pipeline already produced multiple AVIF/WebP widths, so bypassing `/_next/image` appeared likely to remove redundant transformation. The opposite happened in production: direct delivery nearly doubled first-viewport image bytes and delayed product-grid/home image completion. This is an important negative result because it demonstrates that platform image optimization can remain useful even when a build-time image pipeline already exists.

The PDP route showed a seemingly favorable ~150-160 ms route-level movement in the direct-image variant, but the product title moved by almost the same amount while the mobile direct-image request itself became much slower. That makes the PDP route result a timing/cache confound rather than evidence for a hybrid direct-delivery policy.

### Rendering all products was simpler but too expensive on mobile

Rendering all 38 products removed the pagination state machine and made every item immediately reachable, but increased initial HTML/RSC substantially and regressed mobile first-card/LCP by ~223-234 ms. The follow-up S6B experiment retained the best property (reliable access to all products) while moving the remainder fetch after the critical paint.

### Same-app HTTP removal produced no meaningful warm latency win

Direct in-process catalog access removed public Vercel HTTPS recursion and simplified the architecture, but application-executed and warm-cache route latency remained essentially neutral. The infrastructure/cache layer had already hidden most of the recursive-call overhead. The change is still kept because it reduces failure surface and serialization overhead.

### Speculation Rules were not the universal winner

The original product-card path stacked Next viewport/eager prefetch, manual intent prefetch, and Chromium full-document prerendering. Hovering one card could warm the same PDP through both RSC prefetch and document prerender. Removing the Speculation Rules layer cut per-hover work materially while keeping mobile navigation within the project's acceptance limit and retaining cross-browser behavior.

## Cart audit (R011) — detailed paper evidence

**Baseline:** S7B `fb72be58d8d40074f1e257e453d3bf2722dfe6d4`.

**Executor-reported S8A:** `ebf8549461b384021a0dafbc9c723f89b879f438`.

**Executor-reported S8B:** `6749369f65aafeaa2662057cf017c66cb17c76ba`.

At the time this evidence file was written, the connected GitHub remote could not resolve the S8B SHA, so the S8 SHAs are recorded as executor-reported pending remote synchronization.

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

## Confirmed architectural lessons

1. **Critical-path bytes matter more than total eventual bytes.** S6B succeeds by keeping 12 products in the initial payload even though it still transfers the remainder later.
2. **Streaming boundaries are part of performance architecture.** PPR only helps when useful shell content is not trapped behind blanket or unnecessary dynamic boundaries.
3. **Historical optimizations must be re-evaluated after simplification.** The carousel dynamic import became harmful after Swiper runtime disappeared.
4. **Platform optimizers should be measured, not assumed redundant.** Next Image beat direct delivery despite existing build-time variants.
5. **Prefetch mechanisms need a budget.** Multiple schedulers can fetch overlapping representations of the same destination.
6. **Mutation responses should be treated as state updates.** Re-fetching or refreshing after receiving complete authoritative state often creates redundant RSC/network work.
7. **Small-catalog architecture should be optimized for its actual scale.** Elaborate observer/page machinery was less reliable and more complex than one deferred remainder fetch.
8. **Edge caching can hide server architectural inefficiency.** A simplification can be worth keeping even when end-user latency does not move because it removes recursion/failure modes.
9. **Negative results are research results.** Several intuitive optimizations failed and materially changed the final design.

## Remaining engineering findings / cleanup backlog

These are preserved for completeness but are not part of the completed broad audit phase unless future evidence elevates them:

- `use cache: remote` wrappers over now-local static catalog reads: simplify/test later.
- Public catalog cache keys segmented by user token: likely unnecessary; simplify later.
- One high-priority product-card image: verify actual LCP candidate when doing new delivery work.
- Seven generated image widths x AVIF/WebP: prune only after observing source/transform usage.
- `ProductImage` client boundary used mainly for error fallback: later test.
- PDP `ProductDetails` broad client boundary: potential hydration target in improvement phase.
- Homepage remote Unsplash hero: candidate for local/source-delivery redesign.
- Swiper dependency / obsolete `.swiper-*` CSS: cleanup only; no runtime Swiper chunk was observed.
- Unused/inert `SpeculationRules.tsx`: cleanup only after R010 removed its injection.
- Old Render `/admin` redirects and stale architecture documentation: repository hygiene updates.
- Payment/checkout/wholesale feature surface exceeds the research storefront's required scope; prune only where bundle/runtime evidence or project scope justifies it.
- Serverless in-memory cart `Map`: correctness/persistence risk for a real multi-instance deployment; not changed during S8 because persistence architecture was intentionally out of scope.

## Phase boundary

**Broad audit phase: COMPLETE through R011 / S8.**

The next phase should no longer ask, "Which old optimization should be removed?" as the default question. It should ask, "What new architecture or delivery technique can measurably improve native-feeling navigation, interaction latency, PDP transitions, critical-path delivery, and perceived responsiveness?"

Future work should still use controlled experiments, but the research direction changes from cleanup/audit to proactive performance design.

## Threats to validity to preserve for the paper

- Vercel edge-cache state can hide server execution cost; HIT and application-executed/BYPASS results must be distinguished.
- Browser timing has run-to-run variance; medians and p75s are more reliable than single traces.
- Some route-level timing changes can be confounded by cache state or unrelated streamed content (as seen in the S5 PDP anomaly).
- Chromium-only APIs cannot be generalized to Firefox/Safari without cross-browser controls.
- The current real catalog is 38 products; synthetic 70-product probes are scale evidence, not production results.
- Serverless preview behavior and network geography may differ from eventual production traffic distributions.
- Uncompressed HTML/RSC byte counts are useful for relative comparisons but are not identical to transferred compressed bytes.
- The project intentionally excludes real payment/order/fulfillment complexity, so findings should be framed as storefront/delivery performance results rather than a complete commerce-platform benchmark.
