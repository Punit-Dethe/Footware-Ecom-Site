# Engineering Continuity Log

> Durable handoff/state document for the Mirza Footwear storefront migration and performance work.
>
> **Purpose:** preserve project state, architecture decisions, rationale, accepted audit findings, temporary compromises, performance invariants, exact SHAs, and the immediate next action so a new engineering/audit chat can continue without reconstructing this work from conversation history.
>
> **Update rule:** update this file whenever a backend phase is accepted/merged, an audit changes the plan, a temporary compatibility decision is introduced/removed, or the immediate next action changes. Keep exact SHAs and status current. Do not turn this into a raw activity transcript.

---

## 1. Current snapshot

**Snapshot date:** 2026-09-12

**Repository:** `Punit-Dethe/Footware-Ecom-Site`

**Production storefront:** `https://storefront-three-tau.vercel.app`

### Canonical state before this documentation commit

B3 production-closeout `main`:

```text
ce14189d879d19a05a2a3775a0fbd3c7f1ecb6fe
```

That merge contains B3.2 fix commit:

```text
b0638658882ca63e46c75ef84bce178d8934dfc4
```

B3/B3.1/B3.2 are **COMPLETE**.

Immediate next implementation phase:

```text
B4 — Profiles + Addresses
```

Before starting B4, fetch current `origin/main` because this continuity document itself adds a docs-only commit after `ce14189...`.

---

## 2. Target architecture

The project is becoming a real customer-facing ecommerce store, not only a benchmark/demo.

Target:

```text
Browser / Next.js UI
        ↓
Next.js Server Components / Server Actions / server-only DAL
        ↓
Supabase Auth + managed PostgreSQL
        ↓
Object/media storage where needed
```

Runtime/hosting direction:

- Next.js / React storefront on Vercel
- Supabase managed Postgres
- Supabase Auth
- first-party server-only data-access layer
- no browser-side direct domain-table access
- lightweight first-party admin after catalog migration
- eventual zero runtime dependency on Spree / Render / Rails

The current Spree-shaped API/BFF and SDK types are transitional compatibility surfaces only.

### Product scope

The real store needs:

- catalog/search/filter/sort
- products, variants, sizes, stock
- cart
- auth
- customer profile
- addresses
- orders and order history
- admin for products/categories/variants/prices/stock/descriptions/images
- basic admin visibility into users/orders as needed

Deferred unless separately scheduled:

- payment gateway integration
- courier/fulfillment tracking
- warehouse-management system
- complex tax engine
- complex refunds

---

## 3. Why migration is incremental

A strong coding agent could rewrite much of the stack faster in one pass. The project intentionally trades wall-clock speed for confidence because:

1. identity/cart/order ownership bugs matter in a real store;
2. substantial storefront performance work already exists and can be silently regressed by backend migration.

Operating model:

```text
plan
→ executor implementation
→ tests/build
→ independent code audit
→ bounded closure pass if needed
→ merge
→ production verification
```

This has already paid for itself. Initial B3 was reported complete, but audit found a real legacy Spree cart-read fallback that could recurse through the same compatibility BFF and weaken the new authorization boundary. B3.1 removed it before merge. Production verification then found a Next.js Route Handler `updateTag()` crash; B3.2 removed the dead invalidation path and added a regression test.

Rule: apply heavy scrutiny where identity, ownership, persistence, caching, or public performance can be affected; do not repeat unrelated tests merely as ritual.

---

## 4. Clean Supabase environment

First-party project:

```text
hkncfdsvgjopkujmmxem
```

Region:

```text
ap-south-1 / Mumbai
```

Public URL:

```text
https://hkncfdsvgjopkujmmxem.supabase.co
```

Pooler host:

```text
aws-0-ap-south-1.pooler.supabase.com:6543
```

Relevant env var names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
DATABASE_URL
SUPABASE_DB_CA_CERT_BASE64
```

Do not put raw credentials/secrets into prompts, docs, tests, or logs.

Legacy Spree/Supabase project:

```text
nmddtxibpsbtswxnienm.supabase.co
```

It must remain untouched unless a later retirement/migration task explicitly says otherwise.

---

## 5. B1 — Persistence foundation — COMPLETE

Initial schema migration:

```text
storefront/supabase/migrations/20260911000000_init_ecommerce_schema.sql
```

Domain tables:

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

`auth.users` remains Supabase-owned. Do not duplicate password/session/reset infrastructure.

Important B1 decisions:

- RLS enabled on domain tables
- anon/authenticated browser roles do not directly operate domain tables
- application domain access stays server-side
- strict PostgreSQL TLS using Supabase CA
- `rejectUnauthorized: true`
- serverless `pg` pool intentionally small

Representative B1 main lineage included:

```text
b24cadec3e385f312fc97ef6cbfc66980b3dad4b
```

B1 is closed.

---

## 6. B2 — Real auth — COMPLETE

Accepted B2 SHA:

```text
d2e1a6ddb901852b4b5f04bed5d3692a2b31d497
```

B2 merge commit:

```text
36aadc404e6aa7555fd20f7c463ff807551d8ff8
```

Capabilities:

- signup
- email confirmation flow
- login
- verified current user/session
- refresh/rotation
- logout
- forgot/reset password
- basic profile identity
- protected account routing

Role authority is strictly:

```text
public.profiles.role
```

Never infer admin from email strings, client metadata, signup metadata, demo tokens, or legacy Spree JWTs.

Fresh anonymous public pages must remain:

```text
homepage: 0 auth requests / 0 profile queries
PLP:      0 auth requests / 0 profile queries
PDP:      0 auth requests / 0 profile queries
```

Launch dependency remains:

```text
CUSTOM SMTP REQUIRED BEFORE PUBLIC CUSTOMER LAUNCH
```

---

## 7. B3 — Persistent carts — COMPLETE

### Lineage

Initial B3:

```text
9a70b039893a8a0a47ad3358f8c0cad1216531cd
```

B3.1 security/authorization closure:

```text
ddcfdf61d9323d04c89c3e205b3ec8fa601e2f3c
```

Initial B3 merge into main:

```text
0e67a2ac3fb5c99ae4164cdf93809dde15810a17
```

B3.2 production Route Handler fix:

```text
b0638658882ca63e46c75ef84bce178d8934dfc4
```

Final B3.2 merge/main before this docs commit:

```text
ce14189d879d19a05a2a3775a0fbd3c7f1ecb6fe
```

### Migration

```text
storefront/supabase/migrations/20260912153000_persistent_carts.sql
```

Key schema behavior:

- `carts.surface` supports `dtc | wholesale`
- one active authenticated cart per `(user_id, surface)`
- `cart_items.variant_sku` is the temporary stable catalog bridge
- `variant_id` is nullable until B6 database-catalog migration
- unique `(cart_id, variant_sku)`
- RLS remains enabled
- browser roles remain denied direct table access

### Why SKU bridge exists

Current authoritative public catalog is still static TypeScript with string variant IDs, while future DB `variants.id` is UUID. B3 intentionally did not pull B6 into the cart phase.

During B3:

```text
cart storage identity = stable SKU
product/price/presentation = current static catalog
```

B6 can later reconnect rows to real variant UUIDs.

### Guest security model

Guest carts use:

- cryptographically random 256-bit bearer token
- raw bearer only in secure HttpOnly cookie
- SHA-256 hash stored in `guest_token_hash`
- cart UUID is never authorization by itself

Guest access requires active cart + correct surface + matching bearer hash.

The raw token must never be stored in DB, logged, or serialized in cart DTO/RSC/JSON.

### Authenticated ownership / login merge

Authenticated ownership uses verified Supabase `claims.sub` plus surface.

Logout intentionally clears browser access but leaves the user cart active in PostgreSQL. Same user can recover it on later login; another user must not inherit it.

Guest→user behavior is per-surface:

- guest only → claim same cart ID, set `user_id`, clear guest hash
- user only → keep user cart
- both → merge quantities by SKU, abandon guest cart, clear guest hash

Concurrency is guarded by the partial unique user/surface index plus `ON CONFLICT`.

### B3.1 findings that must stay fixed

B3.1 removed:

- legacy Spree cart-read fallback / same-app recursion path
- auth transport failure becoming anonymous
- compatibility mutations ignoring URL cart ID
- unknown persisted SKU becoming a `$0` item
- duplicate active user-cart race

Accepted semantics:

```text
no auth cookie           → anonymous, 0 remote auth calls
normal invalid session   → anonymous
transport/server failure → fail closed
foreign cart UUID        → denied
wrong guest token        → denied
cart UUID alone          → denied
unknown persisted SKU    → error; never $0/substitute/delete silently
```

### B3.2 production finding

Production verification found `updateTag()` was executed from cart functions that were also invoked by App Router Route Handlers. Next.js allows `updateTag()` only from Server Actions, causing `POST /api/v3/store/carts` to fail in production.

Audit found no active cache consumers for the cart/checkout tags used by `cart.ts`, so B3.2 removed those dead invalidations rather than adding unnecessary cache machinery.

B3.2 also added a Route Handler integration regression test that uses the real `cart.ts` module while mocking only lower-level DB/cookie/auth dependencies.

### B3 final validation reported

```text
42 suites passed
362 tests passed
typecheck PASS
lint PASS (4 baseline warnings)
build PASS
104/104 generated pages
```

Production guest create/add/read/update/remove passed. Guest→user claim/merge passed. Security checks for foreign UUID, UUID-only, wrong token, and raw-token response passed.

### S8 cart UX invariant

Preserve:

- one initial CartProvider hydration
- zero reads on ordinary navigation
- mutation response updates React state directly
- no `router.refresh()` cascade after cart mutation
- no pathname cart polling
- exactly one auth-transition cart resync/claim

---

## 8. Backend roadmap

```text
B1  persistence foundation              COMPLETE
B2  real auth                           COMPLETE
B3  persistent carts                    COMPLETE
B4  profiles + addresses                NEXT
B5  orders + order history
B6  authoritative catalog + admin/read model
B7  media management/publishing
B8  remove fake Spree SDK/BFF after parity
B9  remove Render/Rails legacy
B10 cleanup / dead compatibility / naming / stale config
```

### B4 — Profiles + Addresses

Expected to be comparatively straightforward account-domain CRUD.

Use existing B1 `profiles` and `addresses` tables and B2 verified identity. Preserve current auth/cache/public-page behavior. Do not pull B5 orders or B6 catalog into B4.

### B5 — Orders + Order History

Create real durable customer order/history behavior using existing B1 order tables. Payments/fulfillment remain deferred unless separately scheduled.

### B6 — Authoritative Catalog + Admin

This is the next large architectural phase.

It moves products/variants/categories/prices/inventory metadata from static TypeScript into PostgreSQL and adds first-party admin/read-model behavior.

Performance constraint: current static lookups are extremely cheap. Do not naïvely add live DB queries to every anonymous render. Preferred direction is operational Postgres + server-only writes/admin + prepared/cacheable public read model while preserving PPR and existing public caching.

B6 is where `variant_sku` can be reconciled/backfilled to real DB variant UUIDs.

### B7–B10

B7: media management/publishing.

B8/B9: remove compatibility Spree SDK/BFF and Render/Rails only after parity.

B10: dead compatibility, naming, stale config, cleanup.

---

## 9. Performance program

Detailed measured evidence lives in:

```text
docs/PERFORMANCE-RESEARCH-LEDGER.md
docs/PERFORMANCE-PAPER-EVIDENCE.md
```

Accepted high-level sequence through P1/R012:

- R001 remove client media manifest — KEEP STRONG
- R002 direct in-process catalog reads — KEEP SIMPLIFICATION
- R003 granular PPR / remove root null Suspense — KEEP STRONG
- R004 fix featured-products PPR stream abort — KEEP correctness
- R005 static native ProductCarousel — KEEP STRONG
- R006 direct images — REVERT; Next Image wins
- R007 render all 38 immediately — REJECT mobile regression
- R008 12 initial + one deferred remainder request — KEEP STRONG
- R009 remove public category `connection()` — KEEP
- R010 remove Speculation Rules — KEEP
- R011 remove cart `router.refresh()` + pathname polling — KEEP
- R012 / P1 exact responsive PDP hero prewarm — KEEP STRONG

Accepted P1 SHA:

```text
7173c5d440d977a1dc0ec771c1fccd8a8b7a0ab
```

P2 = cold public PDP route/data path. It remains paused/reassessable around the backend/catalog migration. Do not invent an R-number for B1/B2/B3 architecture work.

Only create an R-series entry for a controlled performance hypothesis with before/after evidence and a keep/revert/simplify decision.

---

## 10. Public storefront regression guards

For fresh anonymous homepage/PLP/PDP preserve:

```text
- no unnecessary auth request
- no profile query
- no empty cart DB row created merely by reading
- PPR/cacheability where present
- optimized Next Image behavior
- P1 exact-image intent prewarm
```

PLP behavior to preserve:

```text
12 products initial payload
one delayed bulk remainder request
```

Do not assume moving data into Postgres is automatically faster than static catalog lookup.

---

## 11. Known unrelated baseline

Lighthouse CI has a pre-existing cart SEO assertion:

```text
/us/en/cart
SEO = 0.63
required = 0.90
```

It predates B3. Do not misclassify the identical result as a backend regression or opportunistically fix it inside unrelated phases.

---

## 12. Executor / audit rules

### Implementation

- one backend phase at a time
- branch from verified current `origin/main`
- no silent scope expansion
- no force push/rebase of accepted history unless explicitly requested
- no hidden production patch during verification; report unexpected bugs

### Audit

Do not accept `COMPLETE` summaries blindly. For security/architecture work inspect the actual pushed SHA and verify the important claims.

Especially check:

- branch lineage / merge-base
- authorization source
- fallback paths bypassing new architecture
- cache policy changes
- accidental public auth/database calls
- cookie/token exposure
- ownership/path-ID checks
- concurrency assumptions
- whether the old fake implementation still remains as a second source of truth

Do not over-test unrelated systems.

### Browser verification policy

Prefer token-efficient deterministic automation:

```text
1. direct Node/fetch/SQL checks
2. scripted headless Playwright only when browser behavior is required
3. traces/screenshots only on failure
4. visual LLM-driven browser control only for exceptional visual/interaction diagnosis
```

Do not spend model context repeatedly observing Chrome when a deterministic script can assert the same behavior.

---

## 13. Temporary compatibility decisions

### Spree types / BFF

Some UI/data code still uses `@spree/sdk` types and Spree-shaped DTOs. This is compatibility, not backend ownership.

After B3, PostgreSQL is the active cart source of truth.

### Legacy-named cart cookies

Some `_spree_*` cart names remain temporarily. Do not infer backend ownership from the names. Cleanup belongs later, likely B8/B10.

### Static catalog

Static TypeScript catalog remains authoritative until B6. Do not migrate it opportunistically in B4/B5.

### Checkout

Checkout still has transitional Spree-shaped/legacy paths. B3 does not make payments, fulfillment, discounts, gift cards, or shipping production-ready.

---

## 14. Migration/performance hindsight

A cleaner greenfield sequence might have been:

```text
find suitable optimized open-source commerce base
→ establish final backend
→ perform deep performance work once
```

Instead, this project optimized a transitional storefront and then migrated the backend while preserving those gains. That duplicated some effort, but it also produced detailed empirical knowledge of PPR, image delivery, prefetch, pagination, cart synchronization, cache interactions, and actual latency bottlenecks.

Current strategy:

> finish backend migration without regressing accepted user-facing performance, then establish a fresh final-architecture performance baseline and optimize only what remains measurable.

---

## 15. Security/operations note

During B3 production verification, an external executor transcript printed sensitive production credential material into its own command/log history. Do not copy those values into this document or future prompts.

Rotate any exposed database/password or deployment-bypass credential before treating the environment as launch-ready, and keep future scripts reading secrets from environment/config without echoing them.

This is operational hygiene, not a B3 architecture failure.

---

## 16. Continuation checklist for a new chat

Read, in order:

1. `docs/ENGINEERING-CONTINUITY-LOG.md`
2. `docs/PERFORMANCE-RESEARCH-LEDGER.md`
3. `docs/ARCHITECTURE.md` as older reference only
4. current GitHub `main` SHA and active branch

Then verify this snapshot is still current.

Current continuation:

```text
1. Fetch current origin/main (it includes this docs commit after ce14189...).
2. B3 is COMPLETE.
3. Rotate any credentials exposed by B3 verification logs if not already rotated.
4. Start B4 — Profiles + Addresses on a fresh branch from verified main.
5. Preserve B2/B3 authorization and public-performance invariants.
6. Do not start B5/B6 until B4 is audited and accepted.
```

---

## 17. Rolling change log

### 2026-09-12 — B3 complete

Recorded:

- B3 initial implementation and B3.1 audit closure
- production merge `0e67a2ac...`
- production-only Route Handler `updateTag()` bug
- B3.2 fix `b063865...`
- final B3 merge/main `ce14189...`
- 42 suites / 362 tests / 104 pages
- persistent guest/auth cart verification
- browser automation policy: deterministic HTTP/headless scripts first
- B4 is next

### 2026-09-12 — Initial continuity log

The first version was created on `docs/engineering-continuity-log` while B3 merge/production closeout was in flight. This main-branch version supersedes that snapshot.