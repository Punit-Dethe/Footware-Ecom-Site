# Footware E-Commerce

## Final Research-Level Performance Engineering Plan

## 1. Project objective

This project is not primarily an ecommerce implementation.

The ecommerce workload exists to provide a realistic environment in which to research, implement, measure and compare advanced web-performance techniques.

The long-term objective is:

> Make a realistic ecommerce storefront behave as close to a native application as possible while preserving web fundamentals: accessibility, SEO, correctness, cache freshness, security and maintainability.

The optimization process must remain open-ended:

**Measure → identify bottleneck → form hypothesis → implement → benchmark → compare → keep/revert → repeat.**

Do not declare the website "fully optimized."

---

# 2. Freeze the target architecture

Use one stable production topology so infrastructure changes do not contaminate performance comparisons.

```text
                         USER
                           │
                           ▼
                    Vercel CDN
                           │
                           ▼
                Next.js 16 Storefront
                  React 19 / RSC
                  Cache Components
                  PPR / Suspense
                           │
                   cache miss / mutation
                           │
                           ▼
                 Fly.io Mumbai API
                    1+ warm Machine
                           │
                           ▼
                 Supabase PostgreSQL
                     Mumbai region


PRODUCT MEDIA

Original upload
      │
      ▼
Image preprocessing
      │
      ├── thumbnail
      ├── card variants
      ├── PDP variants
      ├── zoom variants
      ├── AVIF
      └── WebP fallback
      │
      ▼
Supabase Storage
public product-media bucket
      │
      ▼
Supabase CDN
      │
      ▼
Browser
```

The current Vercel-hosted mock Spree-compatible backend can remain available as a development/control implementation, but it should not be mixed randomly with Fly measurements.

The repository documentation currently describes Fly.io as the intended backend while the latest benchmark experiment deployed the mock backend to Vercel. Reconcile these into one documented target.

---

# 3. Phase P0 — Correct the foundation first

These are not experiments. They are correctness/security/measurement fixes required before further performance claims are trusted.

### P0.1 Rotate the exposed database credential

A Supabase database credential has been committed as a fallback in the public repository.

Treat it as compromised.

Actions:

* rotate the database password/credential;
* remove the hardcoded fallback;
* require environment variables;
* inspect Git history and remove the leaked value from history where practical;
* verify no other secrets exist in previous commits.

Performance testing on an insecure production environment is not acceptable.

---

### P0.2 Remove `.git_backup`

Remove the committed nested Git backup and add it to `.gitignore` and build-ignore rules.

It is irrelevant runtime content and should not be part of repository/build contexts.

---

### P0.3 Make architecture documentation truthful

Update:

* `docs/ARCHITECTURE.md`
* `infra/README.md`
* `docs/PERFORMANCE.md`

to distinguish:

1. current development architecture;
2. research production architecture;
3. alternative comparison architectures.

Never let documentation say Fly is serving production while measurements are actually coming from a Vercel serverless mock API.

---

### P0.4 Centralize cache policy

The same route-level Cache-Control philosophy currently exists in both middleware and `next.config.ts`.

Create one canonical policy module.

For example:

```text
cache-policy.ts

stableCatalog()
catalog()
privateSession()
asset()
```

Middleware/configuration should derive behavior from the same source wherever technically possible.

Goal:

* prevent policy drift;
* prevent accidental private caching;
* simplify experiments;
* make cache behavior independently testable.

---

### P0.5 Fix benchmark routes

Lighthouse CI currently references a stale category route.

Replace it with actual production routes.

Benchmark at minimum:

```text
/
products
category
PDP
search
cart
```

using real Mirza catalog routes.

---

### P0.6 Make performance budgets enforceable

The repository already contains strong budgets, but Lighthouse CI does not enforce most of them.

Connect the budget definition to CI.

Start with warning mode for noisy measurements.

After variance is understood, fail PRs for reliable regressions such as:

* client JS increase;
* total transfer increase;
* LCP regression;
* CLS regression;
* accessibility failure;
* oversized LCP asset.

---

# 4. Experiment 009 — Finalize product-image architecture

This is the highest-priority new performance experiment.

Compare three architectures.

## A — Current

```text
Supabase/AWS original
        ↓
Vercel /_next/image
        ↓
runtime transform on MISS
        ↓
Vercel cache
```

## B — Supabase transformation

```text
Supabase original
        ↓
Supabase Image Transformation
        ↓
Supabase CDN
```

Supabase supports on-demand image transformations.

## C — Pre-generated assets

```text
upload
 ↓
Sharp preprocessing
 ↓
finished AVIF/WebP variants
 ↓
Supabase Storage CDN
 ↓
browser
```

Architecture C is the expected winner for this particular project because it removes transformation work from the request path, but this must be demonstrated experimentally.

Measure:

* cold-image TTFB;
* warm-image TTFB;
* LCP;
* bytes;
* first full-grid render;
* CPU cost;
* CDN hit ratio;
* operational cost;
* cache invalidation behavior.

Do not compare only warm cache hits.

---

# 5. Experiment 010 — Pre-generated responsive media variants

If Experiment 009 confirms the hypothesis, implement an ingestion pipeline.

Suggested initial widths:

```text
96
160

320
480
640

960
1280
1600
```

Not every width must exist for every image role.

Define semantic classes:

```text
thumbnail
card
hero
pdp
zoom
```

Generate:

```text
AVIF
WebP
```

and retain the original upload separately.

Do not send a 1280-pixel product image into a 240-pixel card.

---

# 6. Experiment 011 — Content-addressed image URLs

Product assets should use immutable/versioned keys.

Instead of:

```text
/products/oxford/main.avif
```

prefer something equivalent to:

```text
/products/oxford/a81c94f2/main-640.avif
```

When the image changes, the URL changes.

Then use long browser caching.

Supabase Smart CDN automatically invalidates edge cache when an object changes, but its documentation still recommends changing asset paths when browser cache freshness must be guaranteed.

This permits very aggressive:

```text
Cache-Control:
public, max-age=31536000, immutable
```

for versioned product images.

---

# 7. Experiment 012 — Public product-media bucket

Use a public Supabase Storage bucket for public product photography.

Do not generate fresh signed URLs for publicly visible catalog images.

Supabase documents that public buckets achieve better cache reuse, while separately generated signed URLs create separate cache keys.

Private storage remains appropriate for genuinely private customer assets.

Product photography is not private customer data.

---

# 8. Experiment 013 — Replace generic LQIP with image-specific placeholders

Current product imagery uses a generic neutral placeholder.

Generate at ingestion time:

* dominant color;
* tiny 8–16px blurred representation;
* optional BlurHash/ThumbHash equivalent.

Store the placeholder metadata with the image record.

Compare:

```text
gray placeholder
vs
dominant color
vs
tiny real LQIP
```

Measure:

* perceived image completion;
* placeholder bytes;
* decode cost;
* CLS;
* subjective UX ratings.

This is mainly a perceived-performance experiment rather than raw LCP optimization.

---

# 9. Experiment 014 — Correct LCP image priority

The current ProductCard logic effectively promotes the first four cards to high priority even when callers specify fewer.

Remove implicit `index < 4` behavior from the reusable card.

The parent route should explicitly decide what is important.

Test:

```text
1 high-priority image
2
3
4
```

for each viewport.

The likely optimum will differ between:

* 390px mobile;
* tablet;
* desktop grid.

Do not assume more high-priority requests are faster.

Also update for Next.js 16 semantics: `priority` is now deprecated in favor of the clearer `preload` option.

Only the actual LCP candidate should normally receive preload/high fetch priority.

---

# 10. Experiment 015 — Image-CDN connection warming

Once product imagery moves to Supabase Storage/AWS, reconsider the current browser preconnect.

Today the document preconnects to the Spree API origin.

But most Spree traffic is initiated by the Next server, not directly by the browser.

A cross-origin image CDN may be more valuable to preconnect to.

Compare:

```text
no preconnect

image-CDN dns-prefetch

image-CDN preconnect
```

Do not add preconnects indiscriminately; unnecessary ones consume connection resources.

---

# 11. Experiment 016 — Turn ProductImage into a server-first component

Current `ProductImage` becomes a Client Component mainly to maintain error state.

Research and implement a server-first replacement.

Potential architecture:

```text
Server ProductImage
    │
    ├── picture
    ├── srcset
    ├── sizes
    ├── placeholder
    └── dimensions
```

Only introduce a tiny client error-boundary component where an actual runtime fallback is necessary.

Goal:

reduce:

* hydration count;
* JS execution;
* client component graph;
* memory.

---

# 12. Experiment 017 — Decompose the PDP client boundary

The current entire ProductDetails tree is a Client Component.

This means static content such as:

* product name;
* description;
* SKU;
* specifications;
* price text;
* product metadata

participates in a client boundary because nearby controls require interactivity.

Refactor into:

```text
PDP — SERVER

Product title
Description
Metadata
Specifications
Static media shell

        │
        ├───────────────┐
        ▼               ▼

GalleryClient       PurchaseClient
small island        small island

variant switching   quantity
zoom/swipe           add to cart
```

Next's production guidance explicitly recommends Server Components by default because they do not add client-side rendering JavaScript.

Measure:

* PDP JS;
* hydration time;
* long tasks;
* INP;
* memory;
* total RSC/client payload.

---

# 13. Experiment 018 — Replace Swiper with native scrolling

The featured carousel currently loads Swiper dynamically.

Test replacing it with:

```text
CSS scroll-snap
overflow-x
native touch scrolling
minimal arrow-controller JS
```

Modern browser scrolling may eliminate an entire substantial client library.

Compare:

* route JS;
* hydration;
* INP;
* carousel UX;
* accessibility;
* CLS.

If the native implementation is equivalent, remove Swiper.

---

# 14. Experiment 019 — Navigation prefetch coordinator

Current product navigation can involve:

1. Next Link automatic prefetch;
2. manual `router.prefetch()`;
3. Chromium Speculation Rules prerender.

That is too many independent schedulers.

Next explicitly supports disabling automatic prefetch with:

```text
prefetch={false}
```

when custom scheduling is desired.

Build a single experiment matrix:

### A

Next automatic prefetch only.

### B

Next disabled + pointer-intent `router.prefetch`.

### C

Speculation Rules moderate prerender only.

### D

Coordinated hybrid:
cheap Next prefetch earlier,
full prerender only after stronger intent.

Measure:

* navigation latency;
* wasted bytes;
* CPU;
* memory;
* number of unused speculations;
* current-page LCP interference;
* mobile data usage.

Chrome explicitly warns against excessive speculation because prerender consumes bandwidth, memory and CPU.

---

# 15. Experiment 020 — Intent dwell threshold

Pointer-enter is a weak signal.

Test:

```text
0 ms
75 ms
125 ms
200 ms
pointerdown only
```

before initiating expensive speculation.

Chrome's `moderate` prerender behavior effectively uses stronger intent such as approximately 200ms pointer hover or pointer-down.

Determine the best threshold using actual storefront behavior rather than copying a fixed number.

---

# 16. Experiment 021 — bfcache as a first-class ecommerce feature

The core journey:

```text
PLP
→ PDP
→ Back
→ PLP
→ next PDP
```

should be explicitly benchmarked.

Instrument:

```text
pageshow.persisted
PerformanceNavigationTiming
```

Measure:

* back-navigation latency;
* bfcache hit rate;
* reasons for ineligibility.

Treat any change that significantly reduces bfcache hit rate as a potential regression.

This is especially important for ecommerce because product comparison involves frequent back navigation.

---

# 17. Experiment 022 — Fully optimistic cart state

The current cart opens immediately, but actual cart contents/count still wait for the authoritative response.

Move from:

```text
optimistic drawer
```

to:

```text
optimistic cart model
```

Immediately update:

* count;
* line item;
* quantity;
* subtotal where safely calculable.

Then reconcile with the backend.

On failure:

```text
rollback
+
toast
```

Do not optimistically claim:

* payment succeeded;
* order exists;
* inventory is guaranteed.

---

# 18. Experiment 023 — Remove unnecessary router.refresh()

Cart mutations currently reconcile the returned cart and then trigger `router.refresh()`.

Measure whether this refresh causes avoidable:

* RSC traffic;
* server rendering;
* API reads;
* CPU;
* cache operations.

If the mutation response already contains authoritative cart state, prefer targeted state reconciliation.

Only refresh the server tree when some server-rendered part genuinely requires it.

---

# 19. Experiment 024 — Eliminate cart refetch-on-navigation where possible

The CartProvider currently refreshes on pathname changes.

Investigate a persistent session cart model where navigation itself does not trigger redundant cart reads.

Possible refresh signals:

* cart mutation;
* checkout completion;
* explicit stale timestamp;
* visibility/focus after long inactivity;
* session-token change.

Measure origin request reduction.

---

# 20. Experiment 025 — Search cancellation and short-term query cache

Current search correctly debounces and ignores stale responses.

Next improvement:

### Cancellation

Abort obsolete requests rather than merely ignoring their result where the API path allows it.

### Micro-cache

Keep recent normalized searches:

```text
"ox"
"oxf"
"oxfo"
```

for a short lifetime.

This can avoid repeated round trips when users backspace/retype.

Measure:

* request count;
* server work;
* suggestion latency;
* hit rate;
* memory.

---

# 21. Experiment 026 — Long-list rendering containment

Infinite scroll continually grows the rendered product list.

Test applying:

```css
content-visibility: auto;
contain-intrinsic-size: ...
```

to below-viewport product groups.

The project already successfully uses `content-visibility` for featured products.

Measure:

* style/layout time;
* paint time;
* scroll smoothness;
* memory;
* accessibility/search effects.

---

# 22. Experiment 027 — Windowing very long PLPs

Only pursue this if Experiment 026 is insufficient.

After perhaps hundreds of products, DOM accumulation may become significant.

Compare:

```text
normal infinite DOM

content visibility

windowed/virtualized list
```

Virtualization can harm:

* accessibility;
* browser find;
* SEO assumptions;
* scroll restoration.

Therefore it is not the default.

It must earn its complexity with measurements.

---

# 23. Experiment 028 — Hot-route cache warming

A CDN/cache system can still have cold misses.

After deployments or product invalidations, optionally warm:

* homepage;
* highest-traffic categories;
* top PDPs;
* critical image variants.

Do not warm the entire catalog blindly.

Use traffic data or a deterministic small hot set.

Measure:

* first-user latency after deploy;
* cache-fill cost;
* unnecessary requests.

---

# 24. Experiment 029 — Fly.io always-warm commerce backend

If speed is the research objective, do not allow the only commerce backend machine to routinely stop.

Configure:

```text
primary_region = Mumbai
min_machines_running = 1
```

Fly documents that `min_machines_running=1` keeps a machine running in the primary region when autostop is enabled.

Configure HTTP load around **requests**, not blindly around connection counts, because Fly recommends request-based concurrency for HTTP services.

Then tune `soft_limit` empirically.

Measure:

* p50/p75/p95 API latency;
* cold-start incidence;
* throughput;
* CPU saturation;
* cost.

---

# 25. Experiment 030 — Correct Supabase connection strategy

For the final Fly persistent backend:

Prefer:

```text
Direct PostgreSQL
```

when networking permits.

Otherwise:

```text
Supavisor session mode
```

for a persistent IPv4 application.

Supabase explicitly recommends:

* direct connection for long-lived backends;
* session pooler for persistent IPv4-only clients;
* transaction pooler for serverless/ephemeral workloads.

Do not use the same configuration for both Fly and Vercel functions.

If the Vercel mock backend remains for experiments, it should use transaction pooling with a deliberately small application-side pool.

---

# 26. Experiment 031 — Database profiling before indexing

Do not invent indexes.

Enable and use:

```text
pg_stat_statements
```

to identify queries with high:

* frequency;
* total execution time;
* mean time;
* max latency.

Supabase specifically provides `pg_stat_statements` for this purpose.

Then inspect candidate queries with:

```text
EXPLAIN ANALYZE
```

Use Supabase's `index_advisor` only as supporting evidence, not as an automatic decision maker.

Optimize only demonstrated bottlenecks.

---

# 27. Experiment 032 — Pagination database strategy

As the synthetic catalog grows, compare:

```text
OFFSET pagination
```

against:

```text
cursor/keyset pagination
```

for deep pages.

Measure:

* PostgreSQL execution time;
* rows scanned;
* API latency;
* index behavior;
* consistency during concurrent catalog changes.

Do not replace pagination prematurely for a 30-product dataset.

Test when catalog scale becomes meaningful.

---

# 28. Experiment 033 — Search backend scaling

Keep existing search until it becomes measurable as a bottleneck.

At increasing catalog sizes compare:

```text
simple PostgreSQL search

PostgreSQL trigram/full-text index

external search engine
```

Do not introduce Meilisearch/Elasticsearch simply because ecommerce architectures often contain them.

Relevant thresholds must come from your own data.

---

# 29. Experiment 034 — Server-Timing observability

Current benchmarks can tell us:

```text
request took 500ms
```

but not sufficiently:

```text
where the 500ms went
```

Instrument response timing.

Example conceptual output:

```text
Server-Timing:
next;dur=8,
spree;dur=29,
postgres;dur=4,
cache;desc="HIT"
```

Record:

* Next render duration;
* commerce API duration;
* database duration;
* cache lookup;
* serialization.

This allows research to identify the actual bottleneck layer.

---

# 30. Experiment 035 — Browser-level performance harness

The custom benchmark currently measures HTTP response timing and bytes, not browser rendering.

Retain it for server benchmarking.

Add a second Playwright/WebPageTest-style harness that measures actual user journeys.

Capture:

* LCP;
* INP;
* CLS;
* FCP;
* TTFB;
* long tasks;
* JS execution;
* image timings;
* total transfer;
* request count;
* navigation timing;
* bfcache status;
* cache hit/miss state.

---

# 31. Experiment 036 — Performance attribution

Raw CWV values are insufficient for research.

Record attribution.

For LCP:

```text
element
URL
resource timing
TTFB
load delay
load duration
render delay
```

For INP:

```text
interaction target
input delay
processing duration
presentation delay
```

For CLS:

```text
shifted elements
previous/new rectangles
```

The project should eventually be able to answer:

> Why did LCP regress by 180ms?

rather than merely:

> LCP is worse.

---

# 32. Experiment 037 — Research-grade mobile test matrix

Desktop Lighthouse cannot be the primary research environment.

Use representative India-focused profiles.

Example classes:

```text
Budget Android
Midrange Android
Desktop
```

Network profiles:

```text
fast Wi-Fi
good 5G
4G
constrained 4G
high latency
packet-loss experiment
```

CPU profiles:

```text
native
4× throttle
6× throttle
```

Important journeys:

```text
cold homepage
PLP
PLP → PDP
PDP → Back
search
add to cart
quantity update
infinite scroll
repeat visit
```

---

# 33. Experiment 038 — Statistical benchmark discipline

Do not report a single Lighthouse run as evidence.

For important experiments:

* warm infrastructure first where appropriate;
* separate cold and warm cache conditions;
* execute repeated runs;
* preserve raw results;
* report median and p75;
* report p95 where enough samples exist;
* show variance;
* use identical device/network conditions;
* change one primary variable at a time.

For small/noisy changes, use enough repetitions to establish that the difference exceeds run-to-run variance.

Do not claim a 5ms optimization from a benchmark whose natural variance is ±30ms.

---

# 34. Experiment 039 — PR performance regression reporting

Every meaningful PR should be able to show something equivalent to:

```text
Client JS      -12 KB
LCP            -84 ms
Requests       -3
Image bytes    -96 KB
Server calls   unchanged
CLS            unchanged
```

or:

```text
Client JS      +37 KB ⚠
LCP            +110 ms ⚠
```

Use bundle analyzer data plus repeatable browser benchmarks.

The existing budgets are already a strong foundation.

---

# 35. Experiment 040 — Third-party JavaScript accounting

Treat every third-party script as a measurable performance dependency.

Current integrations include Vercel Analytics/Speed Insights and optional GTM.

For each third-party integration measure:

* downloaded JS;
* parse/execute time;
* long tasks;
* network requests;
* effect on INP/LCP.

Do not install:

* chat widgets;
* heatmaps;
* multiple analytics SDKs;
* A/B testing frameworks

without measuring their cost.

---

# 36. Experiment 041 — Service Worker, research only

Do NOT install a service worker in the default architecture yet.

Run it as an isolated experiment after ordinary HTTP caching/bfcache/prefetching are well understood.

Potential targets:

* static shell assets;
* fonts;
* immutable product imagery;
* recently viewed PDP assets.

Measure:

* repeat-navigation latency;
* offline behavior;
* stale-content risk;
* update bugs;
* complexity.

Keep it only if gains justify the additional cache state machine.

---

# 37. Experiment 042 — 103 Early Hints / earlier critical discovery

Investigate platform support for sending critical resource hints before the full response headers.

Candidate assets:

* critical font;
* unique hero/LCP image;
* critical cross-origin CDN connection.

Do not assume support or improvement.

A/B measure:

```text
normal response
vs
Early Hints / equivalent platform behavior
```

and inspect actual browser waterfall timing.

This is a research track, not a default requirement.

---

# 38. Experiment 043 — Image atlas / McMaster-Carr experiment

Reproduce McMaster-Carr's philosophy as an explicit academic comparison.

For one dense PLP compare:

```text
12 independent optimized images
```

against:

```text
one generated image atlas/sprite
```

Measure:

* request count;
* transfer size;
* decode time;
* memory;
* LCP;
* time until all thumbnails appear;
* cache invalidation granularity.

Modern HTTP/2/3 and responsive image requirements may make independent files superior.

That is fine.

A negative result is still meaningful research:

> Historical sprite-sheet techniques were reproduced and evaluated against a modern HTTP/3 responsive-image pipeline.

---

# 39. Architecture rules that should remain permanent

### Do not optimize by adding infrastructure.

Do not automatically add:

```text
Redis
Meilisearch
Elasticsearch
Kafka
Kubernetes
extra databases
microservices
```

A new component must solve a measured problem.

---

### Prefer removing work.

The preferred optimization hierarchy is:

```text
don't perform work
        ↓
perform it once
        ↓
perform it before the user needs it
        ↓
cache it near the user
        ↓
only then make the work itself faster
```

---

### Do not double-transform images.

Avoid:

```text
Supabase resize
→ Vercel resize again
```

or:

```text
CloudFront image transform
→ next/image transform
```

Choose a single transformation owner for each experiment.

---

### Don't prefetch everything.

Prefetching is useful only while:

```text
probability of use × latency saved
```

is greater than:

```text
wasted bandwidth + CPU + memory + resource contention.
```

---

### Don't optimize only Lighthouse.

Lighthouse is a diagnostic tool.

The project must prioritize:

```text
real navigation
real devices
real interaction
real cache states
RUM
```

alongside lab scores.

---

# 40. Recommended execution sequence

Do not implement all experiments simultaneously.

## Wave 0 — Integrity

```text
P0 security
repository cleanup
architecture documentation
benchmark correctness
```

## Wave 1 — Media pipeline

```text
009 image architecture comparison
010 responsive pre-generation
011 immutable image URLs
012 public CDN strategy
013 product LQIPs
014 priority correction
015 CDN connection warm-up
```

This is probably the largest remaining LCP/visual-loading opportunity.

## Wave 2 — Browser/React work

```text
016 ProductImage serverization
017 PDP boundary decomposition
018 Swiper replacement
019 speculation coordinator
020 intent threshold
021 bfcache
```

Main target:

```text
less JS
less hydration
faster navigation
less wasted network
```

## Wave 3 — Interaction model

```text
022 full optimistic cart
023 remove unnecessary refresh
024 cart request reduction
025 smarter search
```

Main target:

**INP and perceived latency.**

## Wave 4 — Long-page scalability

```text
026 render containment
027 optional virtualization
```

## Wave 5 — Origin/backend

```text
028 cache warming
029 Fly tuning
030 Supabase connections
031 query profiling/indexes
032 pagination
033 search scaling
```

Do this after browser/cache improvements because most public browsing should avoid the database anyway.

## Wave 6 — Research infrastructure

```text
034 Server-Timing
035 browser benchmark harness
036 attribution
037 India/mobile matrix
038 statistical rigor
039 PR regressions
040 third parties
```

## Wave 7 — Advanced research

```text
041 service worker
042 Early Hints
043 McMaster image atlas
```

These should remain experiments until evidence supports keeping them.

---

# 41. Expected eventual image architecture

If the research confirms the current hypothesis, the final image path should become:

```text
                   PRODUCT CREATED
                         │
                         ▼
                    source image
                         │
                         ▼
                  preprocessing job
                         │
         ┌───────────────┼────────────────┐
         │               │                │
      thumbnail         card             PDP
      96/160          320/480/640     640/960/1280
         │               │                │
         └───────────────┼────────────────┘
                         │
                    AVIF + WebP
                         │
                  content hash/version
                         │
                         ▼
                  Supabase Storage
                    public bucket
                         │
                         ▼
                    global CDN
                         │
                         ▼
                    Browser chooses
                  correct srcset asset
```

User request path:

```text
Browser
↓
CDN
↓
finished image
```

Not:

```text
Browser
↓
server
↓
fetch original
↓
decode
↓
resize
↓
re-encode
↓
cache
↓
browser
```

---

# 42. Expected eventual PDP architecture

```text
                        PDP
                         │
             ┌───────────┴───────────┐
             │                       │
       SERVER CONTENT          CLIENT ISLANDS
             │                       │
      product title             variant selector
      description               media controls
      specifications            quantity control
      breadcrumbs               cart action
      structured data
      static image shell
```

The target is not "zero JavaScript."

The target is:

> zero unnecessary JavaScript.

---

# 43. Expected eventual navigation architecture

```text
User sees PLP

      │
      ▼
critical current-page images win network priority

      │
      ▼
user shows product intent

      │
      ▼
one speculation coordinator decides:

low confidence
→ do nothing

medium confidence
→ lightweight route prefetch

high confidence
→ prerender

      │
      ▼
CLICK

      │
      ▼
near-instant PDP

      │
      ▼
BACK

      │
      ▼
bfcache-restored PLP
```

---

# 44. Final research principle

The project should not become a collection of performance tricks.

Every retained optimization should have:

```text
mechanism
+
hypothesis
+
before measurement
+
after measurement
+
trade-offs
+
decision
```

Some experiments should fail.

That is desirable.

A high-level research project is stronger when it can demonstrate:

> We tested this widely recommended optimization under our architecture and found that it produced no statistically meaningful improvement, so we reverted it.

than when it simply accumulates every optimization found online.

The end goal is therefore not the greatest number of optimizations.

It is the smallest, clearest architecture that produces the fastest measurable user experience.
