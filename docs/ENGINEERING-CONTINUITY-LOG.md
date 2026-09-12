# Engineering Continuity Log

> Durable handoff/state document for the Mirza Footwear storefront migration and performance work.
>
> **Purpose:** preserve the decisions, rationale, current state, known caveats, accepted experiment results, and next actions that would otherwise live only in a long chat. A new engineering/audit session should be able to read this file plus the performance ledger and continue without reconstructing the project from scratch.
>
> **Update rule:** update this file whenever a backend phase is accepted/merged, an audit changes the plan, a temporary compatibility decision is introduced/removed, or the immediate next action changes. Keep exact SHAs and status current. Do not turn this into a raw activity dump.
>
> **Reasoning policy:** record conclusions, design rationale, tradeoffs, audit findings, and future plans. Do not attempt to preserve private chain-of-thought or verbose scratch reasoning.

---

## 1. Current snapshot

**Snapshot date:** 2026-09-12

**Repository:** `Punit-Dethe/Footware-Ecom-Site`

**Production storefront:** `https://storefront-three-tau.vercel.app`

**Current canonical `main` at the time this log was created:**

```text
36aadc404e6aa7555fd20f7c463ff807551d8ff8
```

That `main` already contains:

- the accepted performance work through P1,
- B1 persistence foundation,
- B2 real-auth migration,
- the performance-ledger alignment commit,
- but **not yet B3**.

**B3 branch:** `backend/b3-persistent-carts`

**Accepted B3.1 closure SHA:**

```text
ddcfdf61d9323d04c89c3e205b3ec8fa601e2f3c
```

B3/B3.1 has been independently audited and is **accepted for merge**, but at the moment this document was created the merge/production-closeout result had not yet returned.

**Immediate next action:** finish B3 merge + production validation. Only after that is complete should backend work advance to **B4 — Profiles + Addresses**.

Do not assume B3 is on `main` until the remote `main` SHA and production deployment have been verified.

---

## 2. Product and architecture intent

This is intended to become a **real customer-facing ecommerce store**, not a benchmark-only demo.

The target architecture is intentionally simple:

```text
Browser / Next.js UI
        ↓
Next.js Server Components / Server Actions / server-only DAL
        ↓
Supabase Auth + managed PostgreSQL
        ↓
Object/media storage where needed
```

Runtime/hosting target:

- Next.js 16 / React 19
- Vercel for the storefront/serverless runtime
- Supabase managed Postgres
- Supabase Auth
- first-party server-only database/data-access layer
- no browser-side direct domain-table access
- lightweight first-party admin rather than a large commerce framework once migration is complete

The end state should have **no runtime dependency on Spree/Render/Rails** for the first-party store.

The old Spree-shaped API/BFF remains only as a temporary compatibility layer while dependent code is migrated incrementally.

### Product scope to build

The real store needs:

- catalog/search/filter/sort
- products/variants/sizes/stock
- cart
- signup/signin/logout/reset
- customer profile
- addresses
- orders and order history
- admin management for products, categories, variants, prices, stock, descriptions, and images
- basic admin visibility into users/orders as needed

### Explicitly deferred for now

Do not pull these into backend phases unless intentionally scheduled:

- payment gateway integration
- delivery/fulfillment/courier tracking
- warehouse-management backend
- complex tax engine
- complex refunds
- inventory reservation system beyond what the current store needs

The store can become structurally production-ready before payments/fulfillment are added.

---

## 3. Why the migration is deliberately incremental

A strong coding agent could rewrite much of this system faster in one large pass. We are intentionally trading wall-clock speed for confidence because two properties matter:

1. the application is intended to become a real store, so auth/cart/order ownership bugs matter;
2. substantial storefront performance work already exists and can be silently destroyed by a backend migration.

The current workflow therefore separates implementation from audit:

```text
plan → executor implementation → tests/build → independent code audit
→ closure pass if needed → merge → production verification
```

This is slower than a big-bang rewrite, especially because current coding agents implement quickly and test/build/deploy time becomes the dominant wall-clock cost.

That cost has already found real issues. Example: initial B3 was reported complete, but independent review discovered a legacy Spree cart-read fallback that could recurse through the same compatibility BFF and weaken the intended authorization boundary. B3.1 removed it before merge.

The goal is not maximal ceremony. The rule is:

> apply heavy scrutiny where identity, ownership, persistence, caching, or public performance can be affected; do not repeat irrelevant tests just for ritual.

---

## 4. Clean Supabase environment

The new first-party ecommerce database/auth project is:

```text
hkncfdsvgjopkujmmxem
```

Region:

```text
ap-south-1 / Mumbai
```

Public project URL:

```text
https://hkncfdsvgjopkujmmxem.supabase.co
```

Pooler host used by the app:

```text
aws-0-ap-south-1.pooler.supabase.com:6543
```

Expected database username shape:

```text
postgres.hkncfdsvgjopkujmmxem
```

Relevant environment variable names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
DATABASE_URL
SUPABASE_DB_CA_CERT_BASE64
```

Do not put raw secrets/passwords into docs, prompts, logs, tests, or chat.

The legacy Supabase/Spree project is:

```text
nmddtxibpsbtswxnienm.supabase.co
```

It must remain untouched unless a later explicitly approved retirement/migration task says otherwise.

---

## 5. Database foundation — B1 COMPLETE

B1 established the first-party ecommerce persistence layer and production DB connectivity.

### Core schema

The B1 schema contains 11 application-domain tables:

```text
profiles
addresses
categories
products
product_categories
variants
product_images
carts
cart_items
orders
order_items
```

Supabase `auth.users` remains provider-owned. Do not create duplicate custom password/session/reset user tables.

Initial migration:

```text
storefront/supabase/migrations/20260911000000_init_ecommerce_schema.sql
```

Key design choices:

- RLS enabled on all domain tables.
- `anon` and `authenticated` browser roles do not receive direct domain-table access.
- application domain reads/mutations are server-side.
- `profiles.id` extends `auth.users(id)`.
- `variants` owns inline simple inventory fields.
- orders/order-items are designed as durable purchase records/snapshots.
- initial cart schema was deliberately present before B3 but runtime cart migration was deferred to B3.

### Strict database TLS

B1.3 hardened PostgreSQL connectivity:

- official Supabase CA stored through `SUPABASE_DB_CA_CERT_BASE64`
- `rejectUnauthorized: true`
- cloud `DATABASE_URL` is rejected if it embeds conflicting `sslmode`, `sslcert`, `sslkey`, or `sslrootcert` parameters
- Supabase incoming SSL enforcement enabled
- non-SSL rejected
- application connects through the existing server-only `pg` pool
- serverless pool size is intentionally small (`max: 1` per function instance)

Do not regress this to `rejectUnauthorized: false` or permissive TLS.

### B1 merge lineage

Pre-doc B1 main included:

```text
b24cadec3e385f312fc97ef6cbfc66980b3dad4b
```

B1.3 branch tip included:

```text
3bb6c6d433fc5c7959addc0dab45dabdffdb8072
```

Production DB connectivity was verified from Vercel; representative warm DB health latency was around the low tens of milliseconds.

B1 is closed.

---

## 6. Real authentication — B2 COMPLETE

B2 replaced fake/demo auth trust with Supabase Auth and `public.profiles` identity data.

Accepted B2 final branch SHA:

```text
d2e1a6ddb901852b4b5f04bed5d3692a2b31d497
```

B2 was merged to `main` in merge commit:

```text
36aadc404e6aa7555fd20f7c463ff807551d8ff8
```

The previous docs-only performance-ledger commit was preserved during the merge.

### B2 capabilities

B2 covers:

- signup
- email confirmation flow
- login
- current verified session/user
- session refresh/rotation
- logout
- forgot/reset password flow
- basic profile identity
- protected account routing

B2 does not own carts, addresses, orders, catalog/admin, payments, or delivery.

### Authorization model

Role authority is strictly:

```text
public.profiles.role
```

Never infer admin from:

- email strings
- client metadata
- user-controlled signup metadata
- demo tokens
- legacy Spree JWTs

### SSR/session behavior

The accepted implementation uses `@supabase/ssr` and correctly propagates rotated cookies through middleware/proxy response reconstruction.

Important invariants:

- request cookies are updated before downstream response construction when Supabase rotates them;
- rotated cookies reach the browser;
- account/checkout/authenticated wholesale responses are private/non-cacheable;
- anonymous wholesale may retain public catalog cache behavior;
- protected routes fail closed during auth infrastructure failures;
- a transient auth outage must not be misinterpreted as a definite logout.

### Public-performance auth invariant

Fresh anonymous:

```text
homepage: 0 auth requests / 0 profile queries
PLP:      0 auth requests / 0 profile queries
PDP:      0 auth requests / 0 profile queries
```

Do not introduce a global auth/profile fetch into public catalog rendering.

### Email launch dependency

Supabase's built-in auth mailer is not suitable as the permanent customer-facing mail infrastructure.

Current launch note:

```text
CUSTOM SMTP REQUIRED BEFORE PUBLIC CUSTOMER LAUNCH
```

Confirmation/recovery delivery can also hit the built-in project mail rate limit during testing. This is not a B2 code blocker, but it remains a public-launch dependency.

---

## 7. Persistent carts — B3 ACCEPTED FOR MERGE, production closeout pending

B3 replaces the old process-local cart implementation with durable PostgreSQL carts.

### Original problem

The compatibility BFF previously contained:

```text
const CARTS = new Map(...)
```

This meant cart state was process-local and unreliable across serverless instances/restarts. It also had demo behavior such as `cart_mirza_demo` and an invalid-variant fallback that could silently use the first product.

Those behaviors are not acceptable for a real store.

### B3 branch lineage

Initial B3 implementation:

```text
9a70b039893a8a0a47ad3358f8c0cad1216531cd
```

B3.1 closure:

```text
ddcfdf61d9323d04c89c3e205b3ec8fa601e2f3c
```

The branch is/was exactly two commits ahead of `36aadc404...` when accepted for merge.

### B3 migration

Migration:

```text
storefront/supabase/migrations/20260912153000_persistent_carts.sql
```

It adds/changes:

- `carts.surface` with `dtc | wholesale`
- one active authenticated cart per `(user_id, surface)`
- `cart_items.variant_sku` as the transitional stable catalog bridge
- `variant_id` becomes nullable until B6 database-catalog migration
- uniqueness becomes `(cart_id, variant_sku)`
- RLS remains enabled
- browser roles remain denied direct table access

### Why the SKU bridge exists

At B3 time, the authoritative public catalog is still static TypeScript and uses string IDs such as `var_...`, while B1's future database `variants.id` is UUID.

We deliberately did **not** pull B6 catalog migration into B3 merely to satisfy a foreign key.

During B3:

```text
cart storage identity = stable SKU
product/price/presentation source = current static catalog
```

Later B6 can backfill real database variant UUIDs without redesigning cart ownership.

### Current currency compromise

The static live catalog currently exposes USD prices. B1 schema defaults were designed around future INR use.

B3 explicitly preserves current storefront behavior and creates carts as USD rather than silently changing user-visible prices during a persistence migration.

Currency/market policy should be intentionally reconciled later, preferably during the authoritative catalog/market migration. Do not treat the database default as permission to silently convert the storefront.

### Guest security model

Guest carts use:

- 256-bit cryptographically random raw bearer token
- raw bearer token only in secure HttpOnly browser cookie
- SHA-256 hash stored in `carts.guest_token_hash`
- cart UUID is never authorization by itself

A guest cart read/mutation requires:

```text
active cart
+ matching surface
+ SHA256(raw browser token) == guest_token_hash
```

The raw bearer token must never be:

- stored in the database
- logged
- serialized into the cart DTO
- exposed in RSC/HTML/JSON

### Authenticated ownership

Authenticated carts are owned by verified Supabase `claims.sub` and surface.

Logout behavior is intentionally:

```text
browser loses cart/session access
but authenticated cart remains active in PostgreSQL
```

The same user can restore the cart after logging in again. Another user on the same browser must not inherit it.

### Guest → user behavior

Per surface (`dtc` and `wholesale` independently):

- guest cart + no user cart → claim same cart, retain cart ID, set `user_id`, clear guest-token hash
- existing user cart + no guest cart → use user cart
- guest cart + existing user cart → merge by SKU, add quantities, abandon guest cart, clear guest-token hash

Merge is transactional and idempotent.

User-cart creation is protected by the partial unique index plus `ON CONFLICT`, preventing duplicate active carts under concurrent resolution.

### B3 audit finding and B3.1 closure

The first B3 implementation was not merged because independent audit found a real issue:

`getCart()` could fall back from the new PostgreSQL authorization path into `getClientForSurface(...).carts.get(...)`.

Because that Spree client could point back to the same Vercel compatibility route, the fallback created a potential recursion path and undermined the rule that PostgreSQL authorization is authoritative.

B3.1 removed that fallback completely.

B3.1 also closed:

- transient `getClaims()` transport/server failure being treated as anonymous
- compatibility mutation URLs ignoring their `/carts/:cartId/...` cart ID
- persisted unknown SKU being adapted as a $0 line item
- concurrent authenticated cart creation race

Accepted B3.1 semantics now are:

```text
no auth cookie          → anonymous, 0 remote auth calls
normal invalid session  → anonymous
transport/server failure→ throw/fail closed
foreign cart UUID       → denied
wrong guest token       → denied
cart UUID alone         → denied
unknown persisted SKU   → fail adaptation; never $0/substitute/delete silently
```

Compatibility POST/PATCH/DELETE cart routes must bind the path cart ID to the caller's authorized cart.

### S8 cart UX invariant

Previous cart performance work remains important:

- CartProvider hydrates once on mount
- ordinary route navigation performs zero cart reads
- add/update/remove mutation response becomes authoritative React state
- no `router.refresh()` cascade after each cart mutation
- no pathname-based cart polling
- anonymous→authenticated transition triggers exactly one cart resync/claim
- logout clears client-visible cart immediately

Do not regress this while later checkout/order work is added.

### B3 pre-merge verification reported

B3.1 closure reported:

```text
41 test suites
360 tests
TypeScript PASS
lint PASS
build PASS
104/104 generated pages
```

Warm connected action-path medians reported:

```text
getCart          ~9.3 ms
addToCart       ~18.5 ms
updateCartItem  ~20.8 ms
removeCartItem  ~20.6 ms
```

Treat these as sanity measurements, not an R-series performance experiment.

### B3 next step

At the time of this snapshot, the executor had been instructed to:

1. merge `ddcfdf61...` into `main` with a non-fast-forward merge;
2. run merged-main validation;
3. verify the migration state in clean Supabase;
4. deploy production;
5. sanity-check guest persistence, authenticated persistence, guest→user merge, security, compatibility routes, public-performance invariants, and production action latency;
6. stop before B4.

After the merge result returns, independently verify the new `main` SHA and production state before marking B3 fully merged/closed.

---

## 8. Backend migration roadmap

The intended sequence is:

```text
B1  persistence foundation              COMPLETE
B2  real auth                           COMPLETE
B3  persistent carts                    ACCEPTED; merge/prod closeout pending
B4  profiles + addresses                NEXT after B3 closeout
B5  orders + order history
B6  authoritative catalog + admin/read model
B7  media management/publishing
B8  remove fake Spree SDK/BFF after parity
B9  remove Render/Rails legacy
B10 cleanup / dead compatibility / naming / stale config
```

### B4 — Profiles + Addresses

Expected to be comparatively straightforward CRUD/account-domain work.

Use existing `profiles` and `addresses` tables. Preserve the B2 authorization model. Do not mix B5 orders or B6 catalog into it.

### B5 — Orders + Order History

Create real durable order/account history behavior using existing B1 order tables.

Payments and fulfillment are still deferred unless separately scheduled.

### B6 — Authoritative Catalog + Admin

This is the next large architectural phase after B3.

It will move products/variants/categories/prices/inventory metadata from the static TypeScript catalog to PostgreSQL and introduce the first-party admin/read model.

This phase must be performance-sensitive because current static object lookups are effectively free. A naive database query on every anonymous page could make the public storefront slower.

Preferred direction:

- operational catalog in Postgres
- server-only writes/admin
- prepared/cacheable public read model
- avoid auth/profile work on public catalog routes
- preserve PPR and current caching behavior
- measure rather than assume database migration is faster

B6 is also where the transitional B3 `variant_sku` bridge can reconnect to real DB variant UUIDs.

### B7 — Media

Move product image/media management into the final first-party flow while preserving the existing image optimization lessons.

### B8/B9

Once parity exists, remove compatibility machinery instead of carrying it forever:

- Spree SDK usage
- fake Spree-shaped BFF routes
- compatibility cookies/naming where no longer useful
- Render/Rails dependencies
- legacy environment/config paths

Only remove after all real first-party consumers are identified.

---

## 9. Performance program — source of truth and accepted results

Detailed experiment evidence belongs in:

```text
docs/PERFORMANCE-RESEARCH-LEDGER.md
docs/PERFORMANCE-PAPER-EVIDENCE.md
```

Do not duplicate all raw tables here. This section exists so a new session understands what must not be accidentally undone.

### Accepted R-series results

Current accepted experiment sequence through P1/R012:

- **R001:** remove full media manifest from client JS — KEEP STRONG
- **R002:** bypass same-app HTTP for server catalog reads — KEEP SIMPLIFICATION
- **R003:** remove whole-page null Suspense blocker; granular PPR — KEEP STRONG
- **R004:** fix featured-products PPR/RSC stream abort — KEEP correctness
- **R005:** static import native ProductCarousel — KEEP STRONG
- **R006:** direct prepared images vs Next Image — REVERT; Next Image wins
- **R007:** render all 38 products immediately — REJECT because mobile regressed materially
- **R008:** 12 initial + one deferred remainder load — KEEP STRONG
- **R009:** remove public category `connection()` — KEEP performance
- **R010:** remove Chromium Speculation Rules; retain Next/manual intent prefetch — KEEP
- **R011:** remove cart `router.refresh()` and pathname polling — KEEP
- **R012 / P1:** exact responsive PDP hero image intent prewarm — KEEP STRONG

### P1 key result

Accepted P1 SHA:

```text
7173c5d440d977a1dc0ec771c1fccd8a8b7a0ab
```

P1 starts the exact responsive Next Image hero candidate earlier on intent. Representative benefits included hundreds of milliseconds of earlier image start on hover/tap, with no duplicate image transfer and no image-byte increase.

Remaining PDP bottleneck after P1 was primarily cold route/data work rather than image discovery.

### P2 status

P2 was defined as investigation of the cold public PDP route/data path.

It was paused while backend/auth stabilization proceeded. Do not silently mark P2 complete.

Because B6 will replace the transitional catalog/data architecture, reassess whether P2 should run before or after final catalog migration. Avoid spending large effort optimizing a path that B6 will delete unless it remains a meaningful user-visible bottleneck during the migration window.

### Performance measurement rule

Architecture phases B1/B2/B3 do **not** automatically receive R-numbers.

Only create an R-series entry when there is a controlled performance hypothesis, before/after measurement, and an evidence-based keep/revert/simplify decision.

A backend migration can improve architecture or remove failure surfaces without proving a latency win.

---

## 10. Public storefront invariants

The public catalog is already highly optimized. Backend work must treat the following as regression guards:

```text
homepage / PLP / PDP:
- no unnecessary auth request for anonymous users
- no profile query for anonymous users
- no cart DB row creation from merely reading an empty cart
- preserve PPR/cacheability where currently present
- preserve optimized Next Image behavior
- preserve P1 intent prewarm
```

PLP behavior to preserve:

```text
12 products in initial payload
one delayed bulk remainder request
no fragile multi-page IntersectionObserver pagination state machine
```

Cart behavior to preserve is described in B3/S8 above.

Do not assume moving data into Postgres is automatically a public-page performance improvement. Current static catalog lookup is extremely cheap; B6 must use prepared/cached reads appropriately.

---

## 11. Known baseline issue that is not part of the backend migration

Current Lighthouse CI has a known pre-existing cart SEO assertion failure:

```text
/us/en/cart
SEO score = 0.63
required threshold = 0.90
```

This existed before B3.

Do not misclassify the identical failure as a B3/B4 regression, and do not opportunistically fix it inside unrelated backend phases. Schedule it separately when appropriate.

An empty GitHub combined-status response is not proof that CI passed; inspect actual workflow runs/jobs when authoritative CI evidence is needed.

---

## 12. Executor / audit operating model

Implementation executor is expected to be fast. The planning/audit layer owns architecture, scope boundaries, migration ordering, and independent acceptance.

### Implementation rules

- one backend phase at a time
- branch from verified canonical main
- no silent scope expansion
- no force push/rebase of accepted history unless explicitly requested
- no production bug patch hidden inside a merge/verification step
- stop and report if an unexpected conflict or architecture dependency appears

### Audit rules

Do not accept executor summaries just because they say `COMPLETE`.

For security/architecture work, independently inspect the pushed SHA and verify the important claims in code.

Examples of things worth independently checking:

- branch lineage / merge-base
- authorization source
- fallback paths that bypass new architecture
- cache policy changes
- accidental public auth/database calls
- compatibility routes that ignore path ownership
- cookie/token exposure
- concurrency assumptions
- old fake implementation still remaining as a second source of truth

Do not over-test unrelated systems. The goal is evidence, not bureaucracy.

### Performance documentation discipline

Preserve failed experiments as evidence.

Do not rewrite historical experiment results merely because architecture changes later. Add scope/context instead.

`PERFORMANCE-RESEARCH-LEDGER.md` is engineering truth for measured performance decisions; this continuity log is engineering truth for project state/migration intent.

---

## 13. Important temporary compatibility decisions

These are intentional transitional compromises and should not be mistaken for final architecture:

### Spree types / compatibility BFF

Some UI/data code still uses `@spree/sdk` types and Spree-shaped DTOs.

B3 adapts first-party persistent carts into the existing shape to minimize UI churn.

This does **not** mean Spree remains the cart backend.

After B3, PostgreSQL is the active cart source of truth; Spree compatibility is only an adapter surface for code not yet migrated.

### Legacy-named cart cookies

Some `_spree_*` cart cookie names may remain temporarily even though their semantics are now first-party.

Do not infer backend ownership from the cookie name. Naming cleanup belongs later, likely B8/B10.

### Static catalog

The static TypeScript catalog remains authoritative until B6.

Do not migrate product data opportunistically in B4/B5.

### Checkout

Checkout still contains transitional Spree-shaped/legacy functionality.

B3 changed cart source-of-truth and surface verification only where necessary. It did not make payments, fulfillment, discount codes, gift cards, or shipping infrastructure production-ready.

Do not claim otherwise.

---

## 14. Migration/performance hindsight and current strategy

In hindsight, a cleaner greenfield sequence might have been:

```text
start from a suitable optimized open-source commerce implementation
→ establish final backend architecture
→ then perform deep performance work once
```

Instead, this project optimized a transitional storefront, then began backend migration while preserving those gains.

This created some duplicated effort.

However, it also produced unusually deep knowledge of the application's latency paths and failure modes. We now have empirical evidence for:

- PPR/Suspense placement
- catalog payload/pagination behavior
- image delivery choices
- prefetch behavior
- cart client synchronization
- cache interactions
- where theoretical simplifications do and do not produce actual latency wins

That knowledge should now be used to make the final architecture efficient rather than discarded.

Current strategy:

> finish the backend migration without regressing accepted user-facing performance, then establish a fresh final-architecture performance baseline and optimize only what remains measurable.

This is where duplicated optimization work should stop.

---

## 15. Continuation checklist for a new chat/session

A new session should read, in order:

1. `docs/ENGINEERING-CONTINUITY-LOG.md` — current state and decisions
2. `docs/PERFORMANCE-RESEARCH-LEDGER.md` — accepted/rejected performance experiments
3. `docs/ARCHITECTURE.md` — older architecture reference; validate against this log because migration may have advanced
4. current GitHub `main` SHA and the active backend branch before issuing any implementation prompt

Then verify whether the snapshot in Section 1 is stale.

At the time this log was first written, the exact continuation was:

```text
1. Wait for B3 MERGE & PRODUCTION RESULT.
2. Verify remote main SHA and that ddcfdf61... is actually merged.
3. Verify production deployment and critical B3 invariants.
4. If clean, mark B3 COMPLETE in this file.
5. Reconcile the performance ledger wording so B2/B3 status is no longer stale; do not invent an R-number.
6. Start B4 — Profiles + Addresses on a fresh branch from verified main.
7. Do not begin B5/B6 until B4 is audited/accepted.
```

If B3 merge validation reports a new bug, fix it as a bounded B3 closure before B4.

---

## 16. Rolling change log

### 2026-09-12 — Initial continuity log created

Captured:

- target Vercel + Supabase architecture
- B1/B2 accepted state
- B3/B3.1 accepted-for-merge state
- clean/legacy Supabase boundaries
- migration roadmap B1–B10
- performance experiment state through P1
- P2 paused status
- public storefront regression guards
- known Lighthouse cart SEO baseline
- executor/audit workflow
- temporary compatibility decisions
- migration hindsight and final-performance strategy

Created on dedicated branch:

```text
docs/engineering-continuity-log
```

This was intentional so the document would not move `main` while B3 merge/production closeout was in flight.

After B3 closes, merge/rebase this documentation state onto the then-current `main`, update Section 1, and keep this file as the durable rolling handoff source.
