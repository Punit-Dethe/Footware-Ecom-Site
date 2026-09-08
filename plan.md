# High-Performance Ecommerce Storefront Engineering Plan

## 1. Project Mission

Build an extremely fast, app-like ecommerce storefront whose primary engineering objective is web performance.

This is **not an ecommerce-platform development project**.

We are deliberately using Spree Commerce to avoid spending project effort implementing:

* product CRUD
* product/variant schemas
* inventory
* customers
* authentication
* checkout
* orders
* payments
* admin panels
* promotions
* basic commerce APIs

Treat Spree as an external commerce engine.

The work of this project begins at the delivery/performance layer:

**Spree → Next.js → cache/CDN → browser → user interaction**

The desired subjective result is:

> Pages appear immediately, navigation feels native, interactions acknowledge instantly, imagery appears without jank, and the user rarely waits on the backend.

Performance must remain an ongoing engineering discipline rather than a one-time optimization sprint.

---

# 2. Core Architecture

Use:

### Storefront

* Official Spree Next.js Storefront as the starting point
* Next.js 16+
* React 19+
* TypeScript
* App Router
* React Server Components
* Server Actions
* Tailwind CSS
* `@spree/sdk`

Do not create a new ecommerce frontend from scratch.

Fork the official Spree storefront so upstream improvements can still be merged later.

### Commerce backend

Use standard Spree Commerce.

Do not rewrite its business logic unless an actual measured frontend/backend bottleneck requires a targeted change.

For local development, use the official Spree Docker/starter configuration.

For production, deploy Spree as a persistent container/application.

Preferred deployment for an India-focused benchmark:

**Fly.io Mumbai (`bom`)**

Alternative persistent Docker hosts are acceptable if they can be placed close to the database.

### Database

Use:

**Supabase PostgreSQL — Mumbai / `ap-south-1`**

Supabase is only the managed PostgreSQL host.

Do NOT create a second product/customer/order schema using Supabase APIs.

Spree owns the database schema.

The data path must remain:

Browser
→ Next.js
→ Spree API
→ PostgreSQL

Never:

Browser
→ Supabase product tables

The Next.js storefront should not know or care what the underlying Spree database schema looks like.

### PostgreSQL connections

Spree is a persistent backend.

Therefore prefer a persistent/direct PostgreSQL connection from Spree to Supabase.

If networking requires a pooler, use the appropriate persistent/session connection mode.

Do not configure the database like a serverless Next.js database because Next.js is not directly querying PostgreSQL.

### Frontend deployment

Preferred:

**Vercel**

Target Mumbai compute when appropriate.

Static/cached assets should remain globally CDN-delivered.

Do not force every route to execute in Mumbai merely because the database is there. Cached/static content should be served through the CDN nearest the visitor.

### Images

Product images must not live as binary data inside PostgreSQL.

Use:

Spree image metadata
→ object storage
→ Next/Vercel image optimization
→ Vercel CDN
→ browser

Object storage can be S3-compatible storage such as R2/S3 or another compatible service.

Use `next/image` as the default presentation layer.

---

# 3. Fundamental Performance Rule

Do not ask:

> How do we make PostgreSQL answer every request faster?

Ask:

> Why is this user waiting for PostgreSQL at all?

The database remains the source of truth.

It should not be on the critical path for the majority of anonymous catalog browsing.

Architecture should progressively eliminate unnecessary origin work:

Database
→ Spree
→ Next cache
→ CDN
→ browser cache
→ client/router cache

The closer data gets to the user, the less often the deeper layers should execute.

---

# 4. Rendering Model

Use **Server Components by default**.

A component should only become a Client Component when it genuinely requires:

* browser APIs
* event handling
* transient interactive state
* optimistic interaction
* other client-only behavior

Do not make entire pages client components for convenience.

Keep `"use client"` boundaries as low in the component tree as practical.

A typical product page should conceptually look like:

Server / cached:

* navigation
* breadcrumbs
* product name
* description
* specifications
* product media metadata
* category information

Dynamic or interactive islands:

* cart control
* variant selector where necessary
* live availability
* personalized state
* account state

Do not hydrate static product descriptions, headers, category lists or decorative UI merely because they appear next to interactive elements.

---

# 5. Next.js Cache Components

Enable Next.js Cache Components.

Use Partial Prerendering semantics rather than categorizing an entire page as either static or dynamic.

Think of every route as:

STATIC SHELL
+
CACHED DATA
+
SMALL DYNAMIC ISLANDS

Example PDP:

Product shell
Product title
Description
Images
Specifications
Related category
↓
immediately available

Live inventory
Personal cart state
Delivery estimate
↓
stream / resolve separately

Slow dynamic information must not block the initial useful page.

Use `<Suspense>` around genuinely dynamic subtrees.

Do not add Suspense boundaries merely to create skeleton animations.

---

# 6. Explicit Data Freshness Classes

Every Spree read introduced into the storefront must belong to a freshness class.

Do not fetch data without deciding how fresh it needs to be.

Suggested starting model:

### Class A — extremely stable

Examples:

* global navigation
* taxonomy
* category descriptions
* static site content

Strategy:

* long-lived cache
* event-based invalidation

### Class B — catalog content

Examples:

* product name
* description
* specifications
* media metadata
* category membership

Strategy:

* cached aggressively
* invalidate when Spree changes the product

### Class C — commercial data

Examples:

* price
* promotion information

Strategy:

* cache carefully
* short lifetime or event-driven invalidation
* correctness beats an extra 50 ms

### Class D — volatile

Examples:

* exact inventory
* cart
* account state
* order state

Strategy:

* dynamic/private
* never place user-specific data in shared CDN cache

Prefer event-driven invalidation over arbitrary short TTLs whenever possible.

Use Spree webhooks to invalidate appropriate Next.js cache tags after product/catalog changes.

Example conceptual tags:

product:123
category:tools
taxonomy:main
catalog
pricing:123

Invalidate the narrowest reasonable scope.

---

# 7. Navigation: Make Browsing Feel Native

Product browsing is one of the highest-priority experiences.

Use Next.js client navigation and preserve layouts.

Do not trigger document reloads for internal navigation.

### Default strategy

Start with Next.js's built-in `<Link>` prefetch behavior.

Measure it.

### Dense product grids

A PLP may display dozens of links.

Do not blindly prefetch 50–100 complete product pages.

Implement an intent-aware product link if measurement shows default prefetching wastes bandwidth.

Possible signals:

Desktop:

* mouse hover
* pointer trajectory
* short dwell

Mobile:

* links closest to viewport
* highest click-probability first products
* touch/pointer-down as an intent signal

Use `router.prefetch()` where appropriate.

Maintain a small prefetch budget.

Cancel/avoid low-probability speculative work.

The objective is:

User expresses intent
→ route/data becomes warm
→ click
→ immediate transition

Not:

Page opens
→ download the entire catalog in the background.

---

# 8. Speculative Navigation Research Track

After normal Next.js prefetching has been measured and understood, create an isolated experiment using the browser Speculation Rules API.

Do not enable it blindly on top of existing aggressive prefetching.

Compare:

A. Default Next prefetch
B. Hover-only Next prefetch
C. Speculation Rules prerender
D. Hybrid strategy

Test separately on desktop and mobile.

Important journey:

PLP
→ PDP
→ back to PLP
→ another PDP

Also preserve eligibility for browser bfcache.

Avoid:

* unnecessary `unload` handlers
* `Cache-Control: no-store` everywhere
* browser features that make pages unnecessarily ineligible for bfcache

Treat back navigation as a first-class performance scenario.

---

# 9. Image Pipeline

Images are a primary performance subsystem.

Every product image must:

* have known dimensions or aspect ratio
* reserve its layout space before loading
* use responsive sizes
* use modern compressed formats where appropriate
* avoid downloading desktop-sized imagery on mobile
* avoid cumulative layout shift

### Above the fold

Do not lazy-load the true LCP image.

Identify the likely LCP image explicitly.

Use appropriate priority/fetch-priority mechanisms only for genuinely critical imagery.

Do NOT mark every product thumbnail as high priority.

### Below the fold

Lazy load normally.

### Product grids

Generate/request only sizes appropriate for card dimensions.

Do not ship 1500×1500 source images to 220×220 product cards.

### Image experiments

Keep the architecture open for future comparisons of:

* AVIF vs WebP
* image quality levels
* responsive breakpoints
* CDN strategies
* image preloading
* image placeholders
* compression approaches
* third-party image CDN vs Vercel optimizer

Measurements decide which stays.

---

# 10. CSS

Use Tailwind/static CSS already provided by the Spree storefront.

Avoid runtime CSS-in-JS systems unless there is a compelling measured reason.

Keep global CSS extremely small.

Avoid importing large generic UI frameworks.

Above-the-fold content must not depend on animation completion before becoming visible.

Do not use opacity/fade/slide animations that delay the LCP element.

Animations are acceptable only when they:

* do not block rendering
* do not delay content visibility
* do not create layout shifts
* respect reduced-motion preferences

---

# 11. JavaScript Budget

JavaScript is treated as a cost, not a free resource.

Every new client dependency must answer:

1. Why must this execute in the browser?
2. Can a Server Component replace it?
3. Can native browser functionality replace it?
4. Can it load only after interaction?
5. What does it add to the route bundle?

Install Next bundle analysis from the beginning.

Track client JS per major route.

Important routes:

* homepage
* product listing
* product detail
* search
* cart

Do not import an entire icon/component/utility package for one feature.

Prefer browser-native APIs and small focused components.

Third-party scripts are performance debt.

Do not add:

* chat widgets
* heatmaps
* A/B frameworks
* multiple analytics SDKs
* unnecessary trackers

during the initial optimization work.

---

# 12. Instant Interaction Model

Network round trips must not delay obvious visual acknowledgement.

Example: Add to cart.

Bad:

click
→ Spree request
→ database update
→ response
→ cart counter changes

Desired:

click
→ button/cart UI acknowledges immediately
→ optimistic cart count/state updates
→ server mutation runs
→ reconcile result
→ rollback only if necessary

Target perceived acknowledgement: next frame whenever reasonable.

Apply the same philosophy to:

* quantity changes
* variant selection
* filters
* wish-like local interactions
* UI toggles

Do NOT fake success for actions where doing so could mislead the user about payment/order completion.

---

# 13. Search

Do not begin the project by adding Elasticsearch/Meilisearch.

Use Spree's existing/default search initially.

Search becomes its own optimization track only after measurement demonstrates a bottleneck.

Possible future work:

* faster search provider
* Meilisearch
* cached common queries
* server streaming
* client query cancellation
* predictive results
* index changes

Do not introduce search infrastructure just to make the architecture look sophisticated.

---

# 14. Redis and Additional Infrastructure

Do not add Redis merely because high-performance architecture diagrams often contain Redis.

Use the current Spree starter's recommended queue/cache configuration.

If the selected Spree version runs without a separate Redis requirement, keep it that way initially.

Introduce Redis/Valkey only when:

* Spree caching measurements justify it
* queue architecture requires it
* load testing demonstrates a measurable benefit

Every infrastructure component must solve an observed problem.

---

# 15. Performance Observability From Day One

Performance measurement is part of the architecture.

Enable:

* Vercel Speed Insights
* Core Web Vitals reporting
* Lighthouse
* Lighthouse CI
* Next bundle analyzer
* browser Performance panel workflow
* server/API timing logs

Record at minimum:

### User metrics

* LCP
* INP
* CLS

### Loading

* TTFB
* FCP
* LCP
* transferred bytes
* request count

### JavaScript

* JS transferred
* route JS
* long tasks
* hydration/execution cost

### Images

* total image bytes
* LCP image bytes
* image request count

### Navigation

* click → first visible response
* click → useful product content
* prefetched navigation time
* non-prefetched navigation time
* back-navigation time

### Server

* Next cache hit/miss
* Spree request duration
* Spree → PostgreSQL latency where observable
* cache invalidations
* API request count per page

Metrics must be separated by:

* desktop/mobile
* cold/warm navigation
* cache hit/cache miss
* network quality

---

# 16. Performance Budgets

Create budgets early, but refine them as the real baseline becomes known.

Google's Core Web Vitals thresholds are the minimum acceptable standard, not this project's target.

Internal stretch targets for core browsing flows should aim roughly toward:

* LCP: around or below 1.2 s at p75 where practical
* INP: below 100 ms at p75 where practical
* CLS: as close to zero as possible; target below 0.03
* immediate interaction feedback: next frame or near-next-frame
* cached navigation: perceived as effectively instantaneous

Do not distort the UI merely to achieve a synthetic score.

Performance budgets should also protect resource growth.

Example philosophy:

If a pull request adds 70 KB of client JavaScript, it must provide a strong reason.

Do not permit unnoticed performance regression.

---

# 17. CI Performance Gates

Add Lighthouse CI to GitHub Actions.

Run against representative production builds, not `next dev`.

Use repeated measurements to reduce noise.

Initially treat regression detection as warnings while establishing stable baselines.

Later convert reliable budgets to blocking checks.

Track results over time.

Important benchmark routes:

/
PLP
PDP
search
cart

Never benchmark optimization claims using development mode.

Always use:

`next build`
+
production server/deployment

---

# 18. Realistic Dataset

The store must contain enough data to produce realistic behavior.

Do not optimize an empty demo store.

Use Spree sample data as the starting point, then generate additional synthetic catalog data through Spree's existing interfaces/seeds.

Aim initially for enough products to create:

* multiple categories
* realistic pagination
* dense PLPs
* many product URLs
* product variants
* substantial image traffic

The exact catalog size should be configurable.

Do not manually create new commerce database tables.

A seed/generator script should be reproducible.

---

# 19. Repository Structure

Keep performance work clearly separated from commerce internals.

Suggested conceptual structure:

project/
storefront/
perf/
lighthouse/
budgets/
benchmarks/
scripts/
docs/
PERFORMANCE.md
BASELINE.md
EXPERIMENTS.md
ARCHITECTURE.md
infra/
production notes/config

Do not bury performance benchmarks inside random application folders.

Maintain `PERFORMANCE.md` as a living document.

---

# 20. Experiment Log

Every meaningful optimization gets an experiment entry.

Use:

## Experiment

What is being changed?

## Hypothesis

Why should it improve performance?

## Benchmark

What exact journey/device/network was tested?

## Before

## After

## Side effects

Bandwidth?
CPU?
Cache freshness?
Complexity?
Cost?

## Decision

Keep / revert / investigate further.

This makes the project open-ended.

There is no final "optimization complete" state.

The workflow remains:

measure
→ identify bottleneck
→ form hypothesis
→ implement
→ benchmark
→ compare
→ retain/revert
→ repeat

---

# 21. Rules for Optimization Work

Never perform optimizations based purely on intuition when measurement is possible.

Do not:

* rewrite Spree without evidence
* replace PostgreSQL because another DB sounds faster
* introduce microservices
* introduce Kubernetes
* build custom authentication
* build custom inventory
* duplicate Spree data into a second product database
* use client rendering for everything
* prefetch the entire catalog
* lazy-load the LCP image
* add service workers before baseline measurement
* add Redis/Meilisearch simply because they sound performant
* optimize only Lighthouse's headline score

Prefer removing work over making unnecessary work faster.

---

# 22. Initial Deployment Topology

For an India-focused deployment:

Vercel:

* Next.js storefront
* Node runtime
* prefer Mumbai compute where applicable

Fly.io:

* Spree application/container
* Mumbai region

Supabase:

* PostgreSQL
* Mumbai / ap-south-1

Object storage:

* S3-compatible product image originals

Vercel:

* image transformation/cache
* global CDN

Do not use Next.js Edge Runtime merely because "edge sounds faster."

Use the normal Node runtime required by the chosen Next.js caching architecture and locate dynamic compute near the backend/database.

The CDN, not arbitrary edge execution, should handle the majority of anonymous cached delivery.

---

# 23. Baseline Must Remain Reproducible

Before optimization:

1. Fork/setup the official Spree storefront.
2. Start a stock Spree backend.
3. Load realistic data.
4. Connect them.
5. Deploy a production build.
6. Verify every major route works.
7. Do not redesign.
8. Do not optimize.
9. Benchmark.
10. Tag this revision.

Create:

`baseline-v1`

Document all measurements.

Never lose the ability to compare optimized code with the original baseline.

---

# 24. First Optimization Areas

Once baseline data exists, investigate in approximately this order, but allow measurement to override priority:

Critical rendering path
→ LCP image discovery/priority
→ unnecessary client JS
→ caching/data freshness boundaries
→ product navigation/prefetch
→ optimistic interaction
→ streaming/Suspense
→ image sizing/compression
→ API waterfall elimination
→ backend/database bottlenecks
→ advanced speculative navigation
→ service-worker/repeat-visit experiments
→ search architecture if needed

Do not treat this sequence as a finite checklist.

It is simply the initial search order.

---

# 25. Immediate Task — Start Here

Do not begin by modifying the UI.

First establish the foundation.

### Task 1

Fork the official Spree Next.js storefront.

Preserve an `upstream` remote so updates from Spree can be merged later.

### Task 2

Set up the current official Spree backend/starter locally using Docker.

Do not customize Rails business logic.

### Task 3

Load sample data and verify:

* homepage
* product listing
* PDP
* search
* cart
* checkout shell

### Task 4

Create a production-like local storefront build.

### Task 5

Create the initial performance infrastructure:

* `PERFORMANCE.md`
* `BASELINE.md`
* Lighthouse configuration
* Lighthouse CI
* bundle analyzer
* performance budgets file
* initial benchmark script/configuration

### Task 6

Measure the untouched storefront.

Record results.

### Task 7

Commit and tag:

`baseline-v1`

Only after this point begin optimization work.

---

# 26. Definition of Success

The goal is not:

"Lighthouse says 100."

The goal is:

A realistic ecommerce browsing workload that behaves more like a native application than a conventional web store while retaining standard web architecture, accessibility, SEO and ecommerce correctness.

A user should be able to:

open the site
→ see meaningful content immediately
→ browse products without waiting
→ enter PDPs with near-instant transitions
→ go backward instantly
→ manipulate the cart with immediate acknowledgement
→ browse repeatedly without unnecessary origin/database work

while the system remains understandable and continuously measurable.

The project's long-term architectural principle is:

**Do less work, do it earlier when intent is predictable, cache it at the nearest safe layer, and never make the user wait for work that does not need to block them.**
