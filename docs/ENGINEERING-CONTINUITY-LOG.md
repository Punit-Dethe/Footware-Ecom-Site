# Engineering Continuity Log

> Durable handoff/state document for the Mirza Footwear storefront migration and performance program.
>
> **Purpose:** preserve current architecture, exact phase state, accepted audit findings, temporary compatibility choices, performance invariants, important SHAs, and the immediate next action so a new engineering/audit chat can continue without reconstructing this work from conversation history.
>
> **Update rule:** update this file whenever a backend phase is accepted/merged, an audit changes the plan, a temporary compatibility decision is introduced/removed, or the immediate next action changes. Keep it concise enough to scan but complete enough to resume work.

---

## 1. Current snapshot

**Snapshot date:** 2026-09-12

**Repository:** `Punit-Dethe/Footware-Ecom-Site`

**Production storefront:** `https://storefront-three-tau.vercel.app`

### Canonical application state before this documentation commit

B4 production merge `main`:

```text
410823430d585c093c41433707f6089f5149abfe
```

Accepted B4 branch tip:

```text
e472c3ee999a7987c2838e8ef8e8c794dbf29a41
```

B1 through B4 are **COMPLETE**.

Immediate next implementation phase:

```text
B5 — Orders + Order History
```

This continuity-log update itself creates a docs-only commit after `41082343...`; always fetch current `origin/main` before creating B5.

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
- saved addresses
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

## 3. Migration operating model

A strong coding agent could rewrite much of the stack faster in one pass. The project intentionally trades some wall-clock speed for confidence because:

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
→ targeted production verification
```

Do not repeat huge unrelated test matrices merely as ritual. Scrutiny should be strongest where identity, ownership, persistence, caching, or public performance can change.

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

B2 merge commit:

```text
36aadc404e6aa7555fd20f7c463ff807551d8ff8
```

Capabilities:

- signup
- email confirmation
- login
- verified current user/session
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

Initial merge:

```text
0e67a2ac3fb5c99ae4164cdf93809dde15810a17
```

B3.2 production Route Handler fix:

```text
b0638658882ca63e46c75ef84bce178d8934dfc4
```

Final B3 merge before continuity-doc commit:

```text
ce14189d879d19a05a2a3775a0fbd3c7f1ecb6fe
```

### Migration

```text
storefront/supabase/migrations/20260912153000_persistent_carts.sql
```

Key behavior:

- `carts.surface` supports `dtc | wholesale`
- one active authenticated cart per `(user_id, surface)`
- `cart_items.variant_sku` is the temporary stable catalog bridge
- `variant_id` remains nullable until B6
- unique `(cart_id, variant_sku)`
- RLS remains enabled
- browser roles remain denied direct table access

### Security / ownership model

Guest carts use:

- random 256-bit bearer token
- raw bearer only in secure HttpOnly cookie
- SHA-256 hash stored in DB
- cart UUID alone is never authorization

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
unknown persisted SKU    → error; never $0/substitute/delete silently
```

### Important audit findings already closed

B3.1 removed:

- legacy Spree cart-read fallback / same-app recursion
- auth infrastructure failures becoming anonymous
- compatibility mutation URL cart-ID bypass
- unknown SKU `$0` fallback
- concurrent duplicate user-cart race

B3.2 fixed production Route Handler crashes caused by dead `updateTag()` calls reachable outside Server Actions. Audit found no real cache consumers for those cart tags, so the invalidations were removed instead of replaced.

Final validation baseline after B3.2:

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

B4 initial implementation:

```text
f7689737450ab0da02a7b132fc361ea71662fab7
```

B4.1 audit closure:

```text
e472c3ee999a7987c2838e8ef8e8c794dbf29a41
```

Production merge:

```text
410823430d585c093c41433707f6089f5149abfe
```

B4 branch was merged cleanly with `7de6bdd4...` as merge base.

### Profile ownership

Identity/email remain Supabase Auth-owned.

`public.profiles` owns:

```text
first_name
last_name
phone
role
```

`role` remains immutable to ordinary customer updates.

Email mutation remains Supabase Auth-controlled with current-password reauthentication.

B4 added phone update support to the first-party profile path.

### Saved-address backend

Saved addresses are now first-party PostgreSQL only:

```text
public.addresses
```

Repository:

```text
storefront/src/lib/db/address.ts
```

Compatibility adapter:

```text
storefront/src/lib/data/address-adapter.ts
```

Spree customer-address calls remaining:

```text
0
```

No Spree fallback and no dual-write.

Every address read/update/delete binds ownership in SQL with the verified Supabase `claims.sub`; address UUID alone is not authorization.

### Forward migration

```text
storefront/supabase/migrations/20260912180000_addresses_state_abbr.sql
```

Adds:

- `public.addresses.state_abbr`
- `idx_addresses_user_defaults`
- reasserted RLS/revocation

### Address compatibility behavior

Database state stores the normalized display state plus optional abbreviation.

The adapter preserves the current UI's Spree-shaped address contract, including derived fields such as:

```text
full_name
country_name
state_name
state_abbr
state_text
```

This is a transitional adapter, not evidence that Spree remains the address backend.

### B4.1 audit findings already closed

Initial B4 broadly wrapped address reads in `withFallback()`, which could turn Supabase/PostgreSQL outages into a fake empty-address state. B4.1 removed that behavior.

Accepted read semantics:

```text
no auth cookie           → list {data: []}, single null, 0 auth calls
normal invalid session   → list {data: []}, single null
auth infrastructure fail → throw / fail closed
PostgreSQL failure       → throw / fail closed
foreign address          → null/denied via ownership SQL
```

B4.1 also aligned auth-cookie detection with the hardened B3 behavior so Supabase chunked cookies such as `...-auth-token.0` are recognized before verified `getClaims()` is attempted.

### B4 production validation

Reported and accepted:

```text
44 suites passed
400 tests passed
typecheck PASS
lint PASS (4 pre-existing warnings)
build PASS
104/104 pages
```

Production checks passed for:

- profile name update
- phone update
- immutable role
- Supabase-owned email mutation
- address create/list/reload/update/delete
- cross-user address isolation
- B3 cart sanity
- homepage/PLP/PDP: 0 address/profile calls

---

## 9. Backend roadmap

```text
B1  persistence foundation              COMPLETE
B2  real auth                           COMPLETE
B3  persistent carts                    COMPLETE
B4  profiles + addresses                COMPLETE
B5  orders + order history              NEXT
B6  authoritative catalog + admin/read model
B7  media management/publishing
B8  remove fake Spree SDK/BFF after parity
B9  remove Render/Rails legacy
B10 cleanup / dead compatibility / naming / stale config
```

### B5 — Orders + Order History

Next phase.

Goal: make durable orders and customer order history first-party using the existing B1 `orders` / `order_items` schema, while keeping payments and fulfillment explicitly out of scope unless a required compatibility seam must remain temporarily.

Important concerns for B5:

- verified ownership for customer order reads
- durable immutable purchase snapshots
- guest-vs-authenticated order access semantics
- transition from active cart to converted/placed order
- idempotent order placement / duplicate-submit protection
- order number generation
- preserving checkout compatibility without pretending payment/shipping integration is complete
- no public catalog regression

Before issuing implementation instructions, audit the current `orders.ts`, checkout completion path, order-placed page, fake BFF order routes, and B1 order schema.

### B6 — Authoritative Catalog + Admin

This is the next large architectural phase after B5.

It moves products/variants/categories/prices/inventory metadata from static TypeScript into PostgreSQL and adds first-party admin/read-model behavior.

Performance constraint: current static lookups are extremely cheap. Do not naïvely add live DB queries to every anonymous render. Preferred direction is operational Postgres + server-only writes/admin + prepared/cacheable public read model while preserving PPR and existing public caching.

B6 is also where the B3 `variant_sku` bridge can reconnect to real DB variant UUIDs.

---

## 10. Performance program

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

P2 = cold public PDP route/data path. It remains paused/reassessable around the backend/catalog migration.

Do not invent R-numbers for B1–B5 architecture work. Only create an R-series entry for a controlled performance hypothesis with before/after evidence and a keep/revert/simplify decision.

---

## 11. Public storefront regression guards

For fresh anonymous homepage/PLP/PDP preserve:

```text
- no unnecessary auth request
- no profile/address/order query
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

## 12. Known unrelated baseline

Lighthouse CI has a pre-existing cart SEO assertion:

```text
/us/en/cart
SEO = 0.63
required = 0.90
```

It predates B3. Do not misclassify the identical result as a backend regression or opportunistically fix it inside unrelated phases.

---

## 13. Temporary compatibility decisions

### Spree types / BFF

Some UI/data code still uses `@spree/sdk` types and Spree-shaped DTOs. This is compatibility, not backend ownership.

Current first-party ownership already includes:

```text
auth      → Supabase Auth
profiles  → PostgreSQL
addresses → PostgreSQL
carts     → PostgreSQL
```

### Legacy-named cart cookies

Some `_spree_*` cart names remain temporarily. Do not infer backend ownership from the names. Cleanup belongs later, likely B8/B10.

### Static catalog

Static TypeScript catalog remains authoritative until B6. Do not migrate it opportunistically in B5.

### Checkout

Checkout still contains transitional Spree-shaped/legacy payment, fulfillment, discount, gift-card, and shipping paths. B5 must not claim those are production-ready merely because orders become first-party.

---

## 14. Security / operations note

During B3 production verification, an external executor transcript printed sensitive credential material into its command/log history.

Do not copy those values into this document or future prompts.

Any exposed database/password or deployment-bypass credential should be rotated before treating the environment as launch-ready. Future verification scripts should read secrets from environment/config without echoing them.

---

## 15. Continuation checklist for a new chat

Read, in order:

1. `docs/ENGINEERING-CONTINUITY-LOG.md`
2. `docs/PERFORMANCE-RESEARCH-LEDGER.md`
3. `docs/ARCHITECTURE.md` as older reference only
4. current GitHub `main` SHA and active branch

Then verify this snapshot is still current.

Current continuation:

```text
1. Fetch current origin/main; this docs update advances main after 41082343....
2. B1–B4 are COMPLETE.
3. Audit current order/checkout/order-history implementation before writing B5.
4. Start B5 — Orders + Order History from verified current main.
5. Preserve B2/B3/B4 ownership and public-performance invariants.
6. Do not start B6 until B5 is audited, merged, and production-verified.
```

---

## 16. Rolling change log

### 2026-09-12 — B4 complete

Recorded:

- B4 implementation `f768973...`
- B4.1 audit closure `e472c3ee...`
- B4 production merge `41082343...`
- PostgreSQL-only saved addresses
- state-abbreviation forward migration
- SQL ownership isolation
- profile phone support
- fail-closed address read semantics
- chunked Supabase auth-cookie recognition
- 44 suites / 400 tests / 104 pages
- B5 is next

### 2026-09-12 — B3 complete

Recorded:

- B3 initial implementation and B3.1 audit closure
- production merge `0e67a2ac...`
- production-only Route Handler `updateTag()` bug
- B3.2 fix `b063865...`
- final B3 merge `ce14189...`
- persistent guest/auth cart verification
- deterministic browser automation policy

### 2026-09-12 — Initial continuity log

The first version was created on `docs/engineering-continuity-log` while B3 merge/production closeout was in flight. The main-branch log supersedes that snapshot.