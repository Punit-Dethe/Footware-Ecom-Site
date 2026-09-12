# Engineering Continuity Log

> Durable handoff/state document for the Mirza Footwear storefront migration and performance program.
>
> **Purpose:** preserve current architecture, accepted audit findings, temporary compatibility choices, performance invariants, important SHAs, and the immediate next action so a fresh chat can continue without reconstructing this work from conversation history.
>
> **Update rule:** update this file whenever a backend phase is accepted/merged, an audit changes the plan, a temporary compatibility decision is introduced/removed, or the immediate next action changes.

---

## 1. Current snapshot

**Snapshot date:** 2026-09-12

**Repository:** `Punit-Dethe/Footware-Ecom-Site`

**Production storefront:** `https://storefront-three-tau.vercel.app`

### Canonical application state before this documentation commit

B5 production merge `main`:

```text
d24c41ab87cab41050ef84d2d68d71870ef83ba0
```

Accepted B5 branch tip:

```text
15c42e841f0a72868d4f583663aa54fdae1d3f28
```

B1 through B5 are **COMPLETE**.

Immediate next implementation phase:

```text
B6 — Authoritative Catalog + Admin / Public Read Model
```

This continuity-log update itself creates a docs-only commit after `d24c41ab...`; always fetch current `origin/main` before creating B6.

Important repository event during B5:

- unrelated cart SEO commit `06cce6a64f211ac0f53a72fe61726655f46cd52e` was pushed directly to `main` by another contributor
- it broke the cart Server/Client Component boundary and failed production build
- it was explicitly rejected and reverted by `714b638e0c91910b34724cc65795cc8535200723`
- the integration/reconciliation branch created while auditing it was **not merged**
- final B5 merge `d24c41ab...` has parents `714b638e...` and `15c42e84...`
- final B5 merge tree equals the accepted B5.1 tree; the rejected cart changes are absent from current code

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

Runtime direction:

- Next.js / React storefront on Vercel
- Supabase managed Postgres
- Supabase Auth
- first-party server-only data-access layer
- no browser-side direct domain-table access
- lightweight first-party admin
- cacheable/prepared public catalog read model
- eventual zero runtime dependency on Spree / Render / Rails

The remaining Spree-shaped API/BFF and SDK types are transitional compatibility surfaces only.

Real store scope includes:

- catalog/search/filter/sort
- products, variants, sizes, stock
- carts
- auth
- customer profile
- saved addresses
- orders/history
- admin for products/categories/variants/prices/stock/descriptions/images
- basic admin visibility into users/orders as needed

Deferred unless separately scheduled:

- full payment gateway migration
- courier/fulfillment tracking
- warehouse-management system
- complex tax engine
- complex refunds

---

## 3. Migration operating model

A strong coding agent could rewrite much of the stack faster in one pass. The project intentionally trades some wall-clock speed for confidence because identity/cart/order ownership bugs matter in a real store and substantial storefront performance work can be silently regressed.

Operating model:

```text
plan
→ executor implementation
→ tests/build
→ independent code audit
→ bounded closure pass if needed
→ merge
→ targeted production verification
```

Do not repeat huge unrelated test matrices as ritual. Scrutiny should be strongest where identity, ownership, persistence, caching, or public performance can change.

Browser verification policy:

```text
1. direct Node/fetch/SQL checks first
2. scripted headless Playwright only when actual browser behavior is required
3. traces/screenshots only on failure
4. visual LLM-driven Chrome only for exceptional visual/interaction diagnosis
```

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

Relevant env names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
DATABASE_URL
SUPABASE_DB_CA_CERT_BASE64
```

Never place raw credentials/secrets into prompts, docs, tests, or logs.

Legacy Spree/Supabase project:

```text
nmddtxibpsbtswxnienm.supabase.co
```

It must remain untouched unless a later retirement task explicitly says otherwise.

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

`auth.users` remains Supabase-owned. No duplicate password/session/reset infrastructure.

Accepted decisions:

- RLS enabled on domain tables
- anon/authenticated browser roles do not directly operate domain tables
- application domain access stays server-side
- strict PostgreSQL TLS using Supabase CA
- serverless `pg` pool intentionally small

Representative lineage:

```text
b24cadec3e385f312fc97ef6cbfc66980b3dad4b
```

---

## 6. B2 — Real auth — COMPLETE

Accepted B2 SHA:

```text
d2e1a6ddb901852b4b5f04bed5d3692a2b31d497
```

B2 merge:

```text
36aadc404e6aa7555fd20f7c463ff807551d8ff8
```

Capabilities:

- signup / confirmation
- login / verified session
- refresh/rotation
- logout
- forgot/reset password
- protected account routing
- first-party profile identity

Role authority is strictly:

```text
public.profiles.role
```

Never infer admin from email, client metadata, signup metadata, demo tokens, or legacy Spree JWTs.

Fresh anonymous public pages must remain free of auth/profile work.

Launch dependency remains:

```text
CUSTOM SMTP REQUIRED BEFORE PUBLIC CUSTOMER LAUNCH
```

---

## 7. B3 — Persistent carts — COMPLETE

### Lineage

```text
initial:  9a70b039893a8a0a47ad3358f8c0cad1216531cd
B3.1:     ddcfdf61d9323d04c89c3e205b3ec8fa601e2f3c
merge:    0e67a2ac3fb5c99ae4164cdf93809dde15810a17
B3.2:     b0638658882ca63e46c75ef84bce178d8934dfc4
final:    ce14189d879d19a05a2a3775a0fbd3c7f1ecb6fe
```

Migration:

```text
storefront/supabase/migrations/20260912153000_persistent_carts.sql
```

Key behavior:

- `carts.surface`: `dtc | wholesale`
- one active authenticated cart per `(user_id, surface)`
- `cart_items.variant_sku` is the temporary catalog bridge until B6
- `variant_id` nullable until catalog migration reconnects real UUIDs
- unique `(cart_id, variant_sku)`
- RLS enabled, browser roles denied direct access

Guest security:

- random 256-bit bearer token
- raw bearer only in secure HttpOnly cookie
- SHA-256 hash in DB
- cart UUID alone never authorizes

Authenticated ownership uses verified Supabase `claims.sub` + surface.

Guest→user merge is transactional and per-surface.

Accepted failure semantics:

```text
no auth cookie           → anonymous, 0 remote auth calls
normal invalid session   → anonymous
transport/server failure → fail closed
foreign cart UUID        → denied
wrong guest token        → denied
cart UUID alone          → denied
unknown persisted SKU    → error; never $0/substitute silently
```

Closed B3 audit findings:

- removed recursive/legacy Spree cart fallback
- auth infrastructure failures no longer become anonymous
- compatibility mutation URL cannot bypass cart ownership
- unknown SKU `$0` fallback removed
- concurrent duplicate user-cart race closed
- dead `updateTag()` invalidations causing Route Handler production crash removed in B3.2

Final B3.2 validation baseline:

```text
42 suites
362 tests
104 pages
```

### S8 cart UX invariant

Preserve:

- one initial CartProvider hydration
- zero cart reads on ordinary navigation
- mutation response updates React state directly
- no `router.refresh()` cascade after cart mutation
- no pathname cart polling
- exactly one auth-transition cart resync/claim

---

## 8. B4 — Profiles + Addresses — COMPLETE

### Lineage

```text
initial: f7689737450ab0da02a7b132fc361ea71662fab7
B4.1:    e472c3ee999a7987c2838e8ef8e8c794dbf29a41
merge:   410823430d585c093c41433707f6089f5149abfe
```

Identity/email remain Supabase Auth-owned.

`public.profiles` owns:

```text
first_name
last_name
phone
role
```

`role` is immutable to ordinary customer updates. Email mutation remains Supabase Auth-controlled with current-password reauthentication.

Saved addresses are PostgreSQL-only:

```text
public.addresses
```

Repository / adapter:

```text
storefront/src/lib/db/address.ts
storefront/src/lib/data/address-adapter.ts
```

Spree customer-address calls remaining: `0`.

Forward migration:

```text
storefront/supabase/migrations/20260912180000_addresses_state_abbr.sql
```

Every address read/update/delete scopes ownership in SQL to verified `claims.sub`.

B4.1 fixed broad read fallbacks and chunked Supabase cookie detection.

Accepted read semantics:

```text
no auth cookie           → list empty / single null, 0 auth calls
normal invalid session   → list empty / single null
auth infrastructure fail → throw / fail closed
PostgreSQL failure       → throw / fail closed
foreign address          → null/denied via ownership SQL
```

Production validation:

```text
44 suites
400 tests
104 pages
```

---

## 9. B5 — Orders + Order History — COMPLETE

### Lineage

B5 implementation:

```text
e45ab761632f4b8d92a6dd2a46d7861ce96be057
```

B5.1 security closure:

```text
15c42e841f0a72868d4f583663aa54fdae1d3f28
```

Unrelated friend cart commit rejected:

```text
06cce6a64f211ac0f53a72fe61726655f46cd52e
```

Revert:

```text
714b638e0c91910b34724cc65795cc8535200723
```

Final B5 production merge:

```text
d24c41ab87cab41050ef84d2d68d71870ef83ba0
```

Final merge parents:

```text
714b638e0c91910b34724cc65795cc8535200723
15c42e841f0a72868d4f583663aa54fdae1d3f28
```

### Forward migrations

```text
storefront/supabase/migrations/20260912210000_orders_first_party.sql
storefront/supabase/migrations/20260912220000_orders_source_cart_id_not_null.sql
```

B5 schema adds/guarantees:

```text
orders.source_cart_id UUID NOT NULL UNIQUE
orders.surface dtc|wholesale
orders.completed_at TIMESTAMPTZ NOT NULL
carts.checkout_email
```

RLS remains enabled on orders/order_items; anon/authenticated browser roles remain revoked.

### First-party order ownership

Orders and order history are now PostgreSQL-owned:

```text
public.orders
public.order_items
```

Spree order reads remaining: `0`.

Spree order-history reads remaining: `0`.

No Spree order fallback or dual-read.

Order repository:

```text
storefront/src/lib/db/order.ts
```

Compatibility adapter:

```text
storefront/src/lib/data/order-adapter.ts
```

The adapter keeps existing Spree-shaped UI contracts temporarily; this does not mean Spree owns orders.

### Order placement semantics

`placeOrderFromCart()` is transactional:

```text
lock source cart
→ verify user/token ownership
→ verify surface
→ return existing order if source_cart_id already converted
→ require active cart for new conversion
→ resolve every SKU against authoritative current catalog
→ snapshot product/price/qty/address/email
→ insert order
→ insert order_items
→ mark source cart converted
```

Server-side price snapshots are authoritative. Unknown SKU fails placement; never substitute, drop, or price at zero.

Order numbers use collision-resistant `MRZ-XXXXXXXXXX` values, not COUNT/MAX sequencing.

`UNIQUE(source_cart_id)` + row locking enforce idempotent placement.

Converted guest carts retain `guest_token_hash` as the order-confirmation authorization anchor. Normal cart reads/mutations still target active carts only.

### B5.1 audit findings closed

Initial B5 had four blockers:

1. checkout shipping/billing/email state could be written by cart UUID before ownership proof;
2. cart surface and active-state were not sufficiently enforced at conversion;
3. offsite completion could return success with `order: null`;
4. `source_cart_id` was unique but nullable.

B5.1 fixed all four:

- checkout write SQL binds cart ID + surface + `status='active'` + verified `user_id` or matching guest hash
- first-party checkout write failures propagate; they are not swallowed
- new conversion requires correct surface + active cart
- converted cart with existing order returns that same order
- converted-without-order / abandoned / wrong-surface cart denied
- completed-order guest reads also enforce surface
- offsite completion only returns success when an authorized completed order exists
- DB/auth outage no longer becomes false success
- `source_cart_id` is NOT NULL

### Production validation

Reported and independently accepted:

```text
47 suites passed
440 tests passed
typecheck PASS
lint PASS (4 pre-existing warnings)
build PASS
104/104 pages
```

Production sanity passed for:

- authenticated checkout snapshot write
- durable order + order-item snapshots
- source cart conversion
- idempotent retry returns same order
- account history/detail
- foreign-user isolation
- guest placement and confirmation refresh
- wrong guest token denied
- UUID-only guest confirmation denied
- abandoned cart denied
- wrong-surface cart denied
- B3 cart sanity
- B4 profile/address sanity
- homepage/PLP/PDP: 0 order queries

---

## 10. Backend roadmap

```text
B1  persistence foundation                    COMPLETE
B2  real auth                                 COMPLETE
B3  persistent carts                          COMPLETE
B4  profiles + addresses                      COMPLETE
B5  orders + order history                    COMPLETE
B6  authoritative catalog + admin/read model  NEXT
B7  media management/publishing
B8  remove fake Spree SDK/BFF after parity
B9  remove Render/Rails legacy
B10 cleanup / dead compatibility / naming / stale config
```

### B6 — Authoritative Catalog + Admin / Read Model

This is the next major architectural phase.

Goals:

- move products, variants, categories, prices, stock/inventory metadata from static TypeScript into PostgreSQL
- add first-party admin CRUD with server-enforced admin authorization
- reconnect B3 `variant_sku` bridge to real DB variant UUIDs where safe
- provide a public catalog read path that preserves or improves current anonymous performance

Critical performance constraint:

Current static in-process catalog lookups are extremely cheap. Do **not** naïvely turn every anonymous homepage/PLP/PDP render into live PostgreSQL queries.

Preferred direction:

```text
PostgreSQL = operational source of truth
admin writes = server-only PostgreSQL
public reads = prepared/cacheable read model with explicit invalidation/publishing
```

B6 must preserve:

- PPR/static/cacheability where currently present
- 12-product initial PLP payload + one delayed remainder request
- Next Image behavior
- P1 exact responsive PDP hero prewarm
- zero unnecessary auth/profile/address/order work on anonymous pages

B6 is large enough that implementation should be broken into bounded substeps if that reduces risk, but do not split it merely for ceremony.

Before writing B6 implementation instructions, audit:

```text
storefront/src/lib/catalog/*
storefront/src/lib/data/products.ts
storefront/src/app/api/v3/store/[...spree]/route.ts
B1 products/categories/variants/product_images schema
existing admin/account role paths
all consumers of catalog repository APIs
```

---

## 11. Performance program

Detailed measured evidence:

```text
docs/PERFORMANCE-RESEARCH-LEDGER.md
docs/PERFORMANCE-PAPER-EVIDENCE.md
```

Accepted sequence through P1/R012:

- R001 remove client media manifest — KEEP STRONG
- R002 direct in-process catalog reads — KEEP SIMPLIFICATION
- R003 granular PPR / remove root null Suspense — KEEP STRONG
- R004 fix featured-products PPR stream abort — KEEP correctness
- R005 static native ProductCarousel — KEEP STRONG
- R006 direct images — REVERT; Next Image wins
- R007 render all products immediately — REJECT mobile regression
- R008 12 initial + one deferred remainder request — KEEP STRONG
- R009 remove public category `connection()` — KEEP
- R010 remove Speculation Rules — KEEP
- R011 remove cart `router.refresh()` + pathname polling — KEEP
- R012 / P1 exact responsive PDP hero prewarm — KEEP STRONG

Accepted P1 SHA:

```text
7173c5d440d977a1dc0ec771c1fccd8a8b7a0ab
```

P2 = cold public PDP route/data path. Reassess after/around B6 because catalog architecture is changing.

Do not create R-numbers for migration phases without controlled before/after performance evidence.

---

## 12. Public storefront regression guards

For fresh anonymous homepage/PLP/PDP preserve:

```text
- no unnecessary auth request
- no profile/address/order query
- no empty cart DB row created merely by reading
- PPR/cacheability where present
- optimized Next Image behavior
- P1 exact-image intent prewarm
```

PLP invariant:

```text
12 products initial payload
one delayed bulk remainder request
```

Do not assume moving catalog data into Postgres is automatically faster than static lookup.

---

## 13. Known unrelated baseline

Lighthouse CI has a pre-existing cart SEO assertion:

```text
/us/en/cart
SEO = 0.63
required = 0.90
```

It predates B3. Do not opportunistically fix it inside unrelated backend phases.

The attempted uncoordinated SEO fix `06cce6a...` was rejected/reverted because it broke the cart client boundary. If cart SEO is addressed later, use a dedicated scoped change with a Server metadata wrapper + Client interactive child or another correct Next.js boundary.

---

## 14. Temporary compatibility decisions

### Spree types / BFF

UI/data code still contains `@spree/sdk` types and Spree-shaped DTOs. This is compatibility, not backend ownership.

Current first-party ownership:

```text
auth      → Supabase Auth
profiles  → PostgreSQL
addresses → PostgreSQL
carts     → PostgreSQL
orders    → PostgreSQL
catalog   → static TypeScript until B6
```

### Legacy-named cart cookies

Some `_spree_*` names remain temporarily. Cleanup belongs later, likely B8/B10.

### Checkout

Payment-session, fulfillment, discount, gift-card, and shipping-rate paths remain transitional and must not be described as fully migrated just because order placement is first-party.

---

## 15. Security / operations note

Executor transcripts during migration printed sensitive credential material into command/log history more than once.

Do not copy those values into this document or future prompts.

Any exposed database/password or deployment-bypass credential should be rotated before launch. Future verification scripts must read secrets from environment/config without echoing them.

---

## 16. Continuation checklist for a fresh chat

Read, in order:

1. `docs/ENGINEERING-CONTINUITY-LOG.md`
2. `docs/PERFORMANCE-RESEARCH-LEDGER.md`
3. `docs/ARCHITECTURE.md` only as older reference
4. current GitHub `main` SHA and active branch

Then verify this snapshot against current GitHub.

Current continuation:

```text
1. Fetch current origin/main; this docs update advances main after d24c41ab....
2. B1–B5 are COMPLETE.
3. B5 production verification is accepted; do not reopen it without evidence.
4. Audit the current static catalog/admin/read paths.
5. Start B6 — Authoritative Catalog + Admin / Public Read Model from verified current main.
6. Treat public performance preservation as a first-class B6 requirement.
7. Do not start B7/B8 until B6 is audited, merged, and production-verified.
```

---

## 17. Rolling change log

### 2026-09-12 — B5 complete

Recorded:

- B5 implementation `e45ab761...`
- B5.1 security closure `15c42e84...`
- first-party transactional order placement/history
- guest/authenticated order authorization
- checkout-state IDOR closure
- idempotent source-cart conversion
- source-cart NOT NULL + unique invariant
- rejected/reverted uncoordinated cart SEO commit
- final B5 production merge `d24c41ab...`
- 47 suites / 440 tests / 104 pages
- B6 is next

### 2026-09-12 — B4 complete

Recorded PostgreSQL-only saved addresses, profile phone support, B4.1 fail-closed read semantics, and merge `41082343...`.

### 2026-09-12 — B3 complete

Recorded persistent carts, B3.1 security closure, B3.2 Route Handler cache fix, and deterministic browser policy.

### 2026-09-12 — Initial continuity log

Created to make project state durable across chat/context-window boundaries.
