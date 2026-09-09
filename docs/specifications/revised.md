# Footware E-Commerce — Revised Speed-First Plan

## Objective

Ignore marginal optimizations for now.

The only goal is:

> The storefront should show useful content immediately, product/category navigation should feel nearly instantaneous, and users should almost never sit staring at product skeletons or waiting for images.

Wave 0 is complete.

Everything below Wave 0 from the previous plan is replaced by this plan.

---

# Wave 1 — Remove the visible waiting

This is the highest priority.

## 1. Stop blanking the entire application during initial load

### Current problem

The localized root layout currently wraps the entire application in:

```tsx
<Suspense fallback={null}>
  <CountryLocaleLayoutContent />
</Suspense>
```

Inside that suspended subtree it waits for market resolution and then loads the locale messages before returning the actual document/storefront.

This means an initial uncached request can present essentially nothing while those dependencies resolve.

### Change

The document and visible shell must not depend on commerce API market resolution.

Restructure the root so:

```text
REQUEST
   │
   ▼
HTML / body / visual shell
   │
   ├────────────── immediately stream
   │
   ▼
market/provider information
   │
   ▼
non-critical dynamic pieces
```

The user should never receive:

```text
blank
blank
blank
full website
```

Prefer:

```text
header / hero / page shell
↓
products appear
↓
secondary controls appear
```

### Also remove non-visual dependencies from the critical path

`resolveCurrency()` calls `getMarkets()`, which is a commerce API operation, even though the resulting currency is frequently used mostly for analytics metadata.

Do not make homepage/category visual rendering wait for analytics currency resolution.

Visible content comes first.

Analytics can receive the currency from already-resolved store state afterward.

### Success condition

There should be **no blank initial page** under normal conditions.

Even on a backend/cache miss, the user should immediately receive useful visual structure.

---

# Wave 2 — Make products appear without waiting for filters

## 2. Separate product loading from filter loading

This is probably one of the clearest causes of the wireframe behavior.

Current PLP logic does:

```ts
await Promise.all([
  fetchProducts(),
  fetchFilters(),
])
```

and that entire operation is inside one `ProductListingSkeleton` Suspense boundary.

Therefore:

```text
products finish in 100 ms
filters finish in 600 ms

USER WAITS 600 ms
```

even though the products could have appeared at 100 ms.

That is exactly backwards for this project.

### Change

Split them.

Conceptually:

```text
PRODUCT LISTING
│
├── PRODUCTS
│      │
│      └── highest priority
│
└── FILTERS
       │
       └── separate Suspense
```

Result:

```text
products ready
↓
SHOW PRODUCTS IMMEDIATELY

filters still loading
↓
show lightweight filter placeholder

filters arrive
↓
replace filter placeholder
```

Do not block the product grid on:

* facets;
* counts;
* sort metadata;
* analytics;
* secondary controls.

### Apply this once

Because both:

```text
All Products
Categories
Search results
```

share `ProductListing`, fixing the shared component fixes several of the problems at once.

### Success condition

The main product grid should no longer remain as a full-page collection of wireframes because filter data hasn't returned.

---

# Wave 3 — Make infinite scrolling load before the user reaches it

## 3. Start the next page much earlier

Current infinite scrolling only starts fetching when the sentinel is within roughly:

```text
200 px
```

of the viewport.

200px is nowhere near enough time for:

```text
browser
↓
server action
↓
Next
↓
commerce API/cache
↓
response
↓
React state
↓
new cards
↓
image requests
↓
image decode
```

So the user reaches the bottom first and sees:

```text
Loading...
```

That delay is expected from the current architecture.

### Change

For a catalog of only ~70 products, be much more aggressive.

Start loading the next page approximately **one viewport before it is needed**.

For example, experimentally start around:

```text
800–1200 px
```

rather than 200px.

Even better:

### Page 2

After page 1 becomes stable, begin loading page 2 in the background.

The catalog is small enough that this is cheap.

### Later pages

Prefetch when the user approaches roughly one viewport from the end.

The desired flow becomes:

```text
USER SCROLLING PAGE 1

          │
          │ still plenty of products remaining
          ▼
     fetch page 2
          │
          ▼
      page 2 ready


USER REACHES END
          │
          ▼
products already there
```

Not:

```text
USER REACHES END
          │
          ▼
start network request
          │
          ▼
spinner
          │
          ▼
wait
          │
          ▼
products
```

### Do not virtualize

There are only ~70 products.

Rendering 70 cards is not a DOM scalability problem worth introducing virtualization for.

### Success condition

During normal scrolling, the user should almost never see the `loadingMore` indicator.

---

# Wave 4 — Fix the product-image pipeline

This is the largest asset-related piece of work and should be done once, properly.

## 4. Stop using remote stock-image origins through runtime transformation

Use the current stock images to build the **same architecture that the eventual 100–120 real images will use**.

Do it now rather than waiting for the photographer.

### Final flow

```text
SOURCE IMAGE
     │
     ▼
Sharp ingestion
     │
     ├── thumbnail
     ├── card
     ├── PDP
     └── large PDP
     │
     ├── AVIF
     └── WebP
     │
     ▼
Supabase Storage
     │
     ▼
Supabase CDN
     │
     ▼
browser
```

Do not make normal storefront images follow:

```text
browser
↓
Vercel image endpoint
↓
fetch Supabase/AWS original
↓
resize
↓
encode
↓
cache
↓
browser
```

when we already know all the sizes in advance.

### Keep the pipeline small

We do not need seven or ten variants.

Start with approximately:

```text
160 px  thumbnail/search
480 px  normal product card
640 px  high-density product card
960 px  PDP/mobile
1280 px PDP/desktop
```

That is enough initially.

Generate the variants automatically.

Do not manually compress 120 images.

### Keep originals

```text
catalog-source/
```

contains the originals.

```text
catalog-public/
```

contains the generated delivery files.

### Use immutable URLs

Image change:

```text
old:
/oxford/a81cf9/640.avif

new:
/oxford/f813aa/640.avif
```

Then the generated assets can be cached extremely aggressively.

### Fix image priority at the same time

The current infinite list explicitly marks the first three cards high priority.

But `ProductCard` also internally infers high priority from its index, so priority logic is not owned cleanly by the page.

Remove that implicit behavior.

The route/grid should decide which image is genuinely important.

Usually:

```text
likely LCP image → high

other immediately visible cards → normal

below fold → lazy
```

Do not make four images fight for highest priority simply because they are the first four products.

### Success condition

Warm product images should effectively appear immediately from the CDN.

Cold images should require:

```text
CDN → browser
```

rather than transformation work.

The gray wireframe should also stop hanging around while image processing occurs.

---

# Wave 5 — Pre-render the catalog

## 5. Exploit the fact that this is only ~70 products

This is one of the biggest simplifications available to us.

We are not dealing with:

```text
5 million Amazon SKUs
```

We're dealing with roughly:

```text
70 products
+
a handful of categories
+
1–2 markets/locales
```

That is tiny.

Pre-render/cache the stable public catalog.

At deployment time, prepare:

```text
Homepage

All Products

Category A
Category B
Category C
...

PDP 1
PDP 2
PDP 3
...
PDP 70
```

or ensure all of those routes are warmed immediately after deployment.

The stable catalog portions should already exist in Next/Vercel caching before a real visitor asks for them.

Keep only genuinely volatile information dynamic:

```text
cart
account
checkout
live inventory where required
customer-specific price state
```

### Why this matters

Right now the first uncached visitor can effectively cause:

```text
click
↓
Next
↓
commerce API
↓
database/cache
↓
render
↓
browser
```

For an already prepared catalog page:

```text
click
↓
Vercel
↓
prepared RSC/page
```

This is much closer to the behavior we want.

### Category routes too

Category content and page 1 should be cached/prepared together.

The user should not click:

```text
Formal Shoes
```

and then discover that route for the first time.

### Success condition

A public product/category route should almost never require an origin commerce call before the user can begin viewing it.

---

# Wave 6 — Make product clicks feel instant

## 6. Simplify and coordinate product navigation

Do this after Waves 1–5.

At that point:

* PDP route is already cached/pre-rendered;
* product images are already CDN-ready;
* current PLP isn't waiting on unnecessary operations.

Then make navigation predictable.

### Remove overlapping speculation systems

Do not simultaneously rely on:

```text
Next automatic Link prefetch
+
manual router.prefetch
+
Speculation Rules prerender
```

for the same card.

That makes it hard to know what is competing for bandwidth.

For now use one cross-browser strategy.

### Recommended simple version

For the immediately visible product cards:

```text
prefetch PDP route
```

For the rest:

```text
pointer intent / viewport proximity
↓
prefetch PDP route
```

Since the PDP itself has already been pre-rendered, this prefetch becomes cheap.

### Next step if images are still noticeable

On genuine product intent:

```text
hover / touch intent
        │
        ├── prefetch PDP route
        │
        └── prefetch PDP primary image
```

Then clicking becomes:

```text
route already available
+
hero image already warm
↓
click
↓
paint
```

That is the closest we can get to native-feeling product navigation without wastefully downloading the entire catalog.

### Success condition

A product clicked after being visible/hovered should feel effectively immediate.

No prolonged product-page skeleton.

No noticeable wait before the main product photograph begins painting.

---

# Execution order

Do these sequentially:

```text
1. ROOT INITIAL LOAD
   Remove blank root blocking
   Remove currency/analytics from critical rendering

                ↓

2. PRODUCT LISTING
   Separate products from filters

                ↓

3. INFINITE SCROLL
   Fetch subsequent pages before they are needed

                ↓

4. IMAGES
   Supabase CDN + pre-generated variants
   Correct priority

                ↓

5. PUBLIC PAGE PREPARATION
   Pre-render/warm ~70 PDPs + categories

                ↓

6. NAVIGATION
   One coordinated prefetch system
   Optional intent-based PDP hero warming
```

Do not work on the next item until the previous one is measured.

---

# What is removed from the old roadmap

For now, remove all of these:

```text
Service Worker
103 Early Hints
McMaster sprite/atlas experiment
virtualized PLP
database cursor pagination
external search engine experiments
advanced PostgreSQL index research
search micro-cache
full optimistic cart work
cart router.refresh investigation
third-party script research
advanced Server-Timing infrastructure
large statistical testing framework
complex PR performance reports
Fly concurrency tuning
cache warming of arbitrary resources
advanced RUM attribution work
PDP Server/Client decomposition
Swiper replacement
content-visibility experiments
```

None of those is the thing currently causing the user to stare at a blank page or product wireframes.

They can be reconsidered later **only if measurements show that one of them has become the next actual bottleneck**.

---

# Do not optimize the PDP client boundary yet

The PDP currently has a broad client boundary and could eventually be reduced.

But don't touch it now.

First fix:

```text
route availability
+
data availability
+
image availability
```

If, after those fixes, the PDP HTML appears immediately but the browser still spends significant time hydrating/executing JavaScript, then splitting `ProductDetails` becomes justified.

Until then it is secondary work.

---

# One hosting caveat

If the backend is running on a free host that sleeps when idle, no amount of frontend optimization can make an **uncached origin request to a sleeping backend** instantaneous.

Therefore the public storefront architecture must make ordinary catalog browsing depend primarily on:

```text
Vercel cache/pre-render
+
Supabase image CDN
```

not on waking the commerce backend.

The commerce origin should mostly matter for:

```text
cache misses
mutations
checkout
account operations
catalog updates
```

not every public product click.

---

# The only metrics we need during this phase

Do not build another giant observability system.

For every change check:

```text
Initial page:
time until useful content appears

PLP/category:
click → first real products visible

PDP:
click → useful PDP visible
click → primary image visible

Infinite scroll:
did user see loading indicator?

Images:
cold load
warm load

Browser:
LCP
INP
CLS
```

Plus DevTools Network to determine what actually caused a delay.

That is enough.

---

# Desired user experience

## Homepage

```text
click/open
↓
shell + hero immediately visible
↓
products stream in quickly
```

Never:

```text
blank page
↓
wait
↓
whole website suddenly appears
```

---

## All Products

```text
open
↓
real first product row appears quickly
↓
filters may finish separately
```

Never:

```text
12 wireframes
↓
wait
↓
everything suddenly swaps
```

---

## Category

```text
click category
↓
cached route responds immediately
↓
first products already available
↓
images come directly from CDN
```

---

## Infinite scroll

```text
scroll
↓
next products already fetched offscreen
↓
continue scrolling normally
```

The user should not know pagination occurred.

---

## PDP

```text
intent/prefetch
↓
click
↓
cached PDP RSC
+
CDN product image
↓
visible almost immediately
```

That is the target architecture.

---

# Definition of success

Don't move back to exotic optimization research until these four observations are true:

1. **Opening the site never leaves the user staring at a blank page.**
2. **PLP/category routes don't sit on full product skeleton grids while secondary data loads.**
3. **Infinite scrolling normally happens without a visible loading pause.**
4. **Prefetched product clicks feel approximately instantaneous and the primary image appears without a noticeable second-stage delay.**

Once those are true, profile the application again.

Whatever is then the largest measurable delay becomes the next research problem.

Nothing else from the old roadmap is required right now.
s