# Engineering Continuity Log

> Durable handoff/state document for the Mirza Footwear storefront migration and performance program.
>
> Update whenever a backend phase is accepted/merged, an audit changes the plan, a compatibility seam changes, or the immediate next action changes.

---

## 1. Current snapshot

**Snapshot date:** 2026-09-13

**Repository:** `Punit-Dethe/Footware-Ecom-Site`

**Production:** `https://storefront-three-tau.vercel.app`

### Canonical application state before this documentation commit

Final B6A production merge:

```text
a7a57911b8eb80a91ee84daa6b330be6133d0257
```

Accepted B6A.2 closure:

```text
65c9c392a3b707492f08dc8e4cb634fa66b8b44c
```

B1 through B5 and B6A are **COMPLETE**.

Immediate next phase:

```text
B6B — First-Party Catalog Admin
```

B6B is the **last planned B6 phase**. After B6B is implemented, audited, merged, and production-verified, proceed to B7 unless a concrete B6B security/correctness closure is required.

Always fetch current `origin/main` before starting new work; this continuity update itself advances `main` after `a7a57911...`.

---

## 2. Target architecture

```text
Browser / Next.js UI
        ↓
Next.js Server Components / Server Actions / server-only DAL
        ↓
Supabase Auth + managed PostgreSQL
        ↓
Object/media storage where needed
```

Current ownership:

```text
auth       → Supabase Auth
profiles   → PostgreSQL
addresses  → PostgreSQL
carts      → PostgreSQL
orders     → PostgreSQL
catalog    → PostgreSQL + cached public read model
media      → existing static optimized manifest until B7
```

The remaining Spree-shaped SDK/BFF/types are compatibility surfaces, not catalog/cart/order ownership.

Target remains eventual zero runtime Spree/Render/Rails dependency.

---

## 3. Migration operating model

```text
plan
→ executor implementation
→ tests/build
→ independent code audit
→ bounded closure if evidence requires it
→ merge
→ targeted production verification
```

Do not run huge unrelated matrices as ritual. Scrutiny should be strongest around identity, authorization, ownership, persistence, cache invalidation, data integrity, and public performance.

Browser verification hierarchy:

```text
1. direct SQL / Node / fetch / unit-integration checks
2. scripted headless Playwright only for actual browser behavior
3. traces/screenshots on failure
4. visual LLM browser automation only for exceptional UI diagnosis
```

---

## 4. Clean Supabase boundary

First-party project:

```text
hkncfdsvgjopkujmmxem
```

Region: `ap-south-1 / Mumbai`

Relevant env names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
DATABASE_URL
SUPABASE_DB_CA_CERT_BASE64
```

Legacy project:

```text
nmddtxibpsbtswxnienm
```

The legacy project must remain untouched unless a later retirement task explicitly says otherwise.

Never place raw credentials/secrets into prompts, docs, tests, or logs. Earlier executor transcripts exposed sensitive values; rotate exposed credentials before launch and make scripts read secrets without echoing them.

---

## 5. Completed backend phases

### B1 — Persistence foundation — COMPLETE

Initial migration:

```text
storefront/supabase/migrations/20260911000000_init_ecommerce_schema.sql
```

Domain tables include profiles, addresses, categories, products, product_categories, variants, product_images, carts, cart_items, orders, order_items.

`auth.users` remains Supabase-owned. RLS is enabled on domain tables and browser roles do not directly operate domain data. Application domain access is server-side.

### B2 — Real auth — COMPLETE

Accepted SHA:

```text
d2e1a6ddb901852b4b5f04bed5d3692a2b31d497
```

Merge:

```text
36aadc404e6aa7555fd20f7c463ff807551d8ff8
```

Capabilities: signup/confirmation/login/session refresh/logout/forgot/reset/protected account/basic profile.

Admin/customer role authority is strictly:

```text
public.profiles.role
```

Never infer admin from email, signup metadata, client state, legacy tokens, or hard-coded identity.

Custom SMTP remains a launch dependency.

### B3 — Persistent carts — COMPLETE

Key lineage:

```text
B3.1: ddcfdf61d9323d04c89c3e205b3ec8fa601e2f3c
B3.2: b0638658882ca63e46c75ef84bce178d8934dfc4
final: ce14189d879d19a05a2a3775a0fbd3c7f1ecb6fe
```

Guest bearer security uses a random token in secure HttpOnly cookie and SHA-256 hash in DB. Cart UUID alone never authorizes. Authenticated ownership uses verified Supabase `claims.sub` + surface. Guest→user merge is transactional.

S8 cart UX invariant:

```text
one initial CartProvider hydration
zero cart reads on ordinary navigation
mutation response updates React state directly
no router.refresh cascade
no pathname cart polling
one auth-transition cart resync/claim
```

### B4 — Profiles + Addresses — COMPLETE

Accepted closure:

```text
e472c3ee999a7987c2838e8ef8e8c794dbf29a41
```

Merge:

```text
410823430d585c093c41433707f6089f5149abfe
```

Identity/email remain Supabase Auth-owned. `public.profiles` owns first_name/last_name/phone/role. Role is immutable to normal customer updates. Saved addresses are PostgreSQL-only with ownership bound in SQL.

### B5 — Orders + Order History — COMPLETE

Implementation:

```text
e45ab761632f4b8d92a6dd2a46d7861ce96be057
```

Security closure:

```text
15c42e841f0a72868d4f583663aa54fdae1d3f28
```

Production merge:

```text
d24c41ab87cab41050ef84d2d68d71870ef83ba0
```

Orders/order_items are PostgreSQL-owned. Spree order history/read fallback is gone. Placement is transactional and idempotent by `UNIQUE(source_cart_id)`; cart surface/ownership/active state are enforced; server-side snapshots own price/name/SKU/addresses/email. Converted guest carts retain guest hash for confirmation authorization.

Forward migrations:

```text
20260912210000_orders_first_party.sql
20260912220000_orders_source_cart_id_not_null.sql
```

Accepted production baseline: 47 suites / 440 tests / 104 pages.

---

## 6. B6A — Authoritative Catalog + Public Read Model — COMPLETE

### Lineage

Initial B6A:

```text
966581d65c18bbbe4508acbaada73936c31175ab
```

B6A.1 integrity closure:

```text
bab73c460fd4404c17b02d8b1556a973225ec5ec
```

Initial production merge:

```text
ac68598e11a0689c672212e23c2bf2426c5a103c
```

B6A.2 remaining catalog-read closure:

```text
65c9c392a3b707492f08dc8e4cb634fa66b8b44c
```

Final B6A production merge:

```text
a7a57911b8eb80a91ee84daa6b330be6133d0257
```

Final B6A merge parents:

```text
6592ada37ae9d5b17082d1dbd67c5906d28b5eb4
65c9c392a3b707492f08dc8e4cb634fa66b8b44c
```

### Database/catalog authority

Forward migration:

```text
storefront/supabase/migrations/20260913000000_catalog_authoritative.sql
```

Production catalog currently contains:

```text
2 categories
38 active products
152 variants
```

Authoritative operational catalog is PostgreSQL:

```text
public.categories
public.products
public.product_categories
public.variants
```

Static runtime product/category arrays are no longer an alternate source of truth.

`cart_items.variant_id` is restored as NOT NULL and authoritative; `variant_sku` remains compatibility/audit data. New cart writes persist both and reads fail closed if UUID/SKU disagree.

Order placement joins authoritative variant UUID inside the existing transaction and rejects SKU drift/inactive/out-of-stock non-backorderable variants. No global pool call is made from inside the order transaction.

### Public read model

Architecture:

```text
PostgreSQL source of truth
→ bounded 4-query snapshot load
→ Next.js remote cache tagged catalog-public
→ in-process filter/search/sort/lookups
→ compatibility DTOs
```

Accepted performance behavior:

```text
warm catalog snapshot DB queries = 0
cold snapshot queries = 4 bounded queries
N+1 = 0
```

All outer catalog caches also carry `catalog-public` so one admin publication invalidation can invalidate product/category/sitemap results.

No hidden hard-coded catalog fallback. Infrastructure failure fails visibly.

### B6A.1 findings closed

- UUID variant lookup now uses `v.id = $1::uuid` and SKU lookup uses `v.sku = $1`.
- guest→existing-user cart merge carries authoritative `variant_id`.
- cart/order treat variant UUID as authority and reject SKU mismatch.
- category membership is no longer guessed from slug prefixes.
- active products with zero active variants or invalid default variant state fail catalog integrity checks; no synthetic `$0` product.
- all dependent outer caches receive `catalog-public`.

### B6A.2 findings closed

Sitemap product/category counts/pages now read first-party catalog directly. Wholesale quick-order product-name/SKU search uses the cached snapshot; exact SKU resolution uses one bounded PostgreSQL lookup.

Runtime catalog ownership after B6A.2:

```text
Spree product reads  = 0
Spree category reads = 0
Spree variant reads  = 0
```

Allowed remaining non-catalog Spree compatibility includes auth refresh, gift cards, policies, markets, credit cards, countries/states, wholesale channel configuration, and payment/shipping seams.

### Final B6A production verification

```text
50 suites passed
496 tests passed
typecheck PASS
lint PASS
build PASS
104/104 pages
```

Production regression checks passed for homepage, PLP, PDP, cart UUID add/read/remove, order placement, sitemap, and catalog counts. PLP 12 + delayed 26 remainder remains preserved. P1 hero prewarm remains preserved.

Wholesale channel was disabled in production, so live wholesale quick-order verification was not applicable; deterministic tests cover it.

---

## 7. B6B — First-Party Catalog Admin — NEXT / FINAL B6 PHASE

B6B should create a lightweight first-party admin over the already-authoritative B6A catalog.

Required ownership/security:

```text
verified Supabase claims.sub
+ public.profiles.role = 'admin'
→ privileged catalog mutations
```

Never authorize admin based only on client-side `AuthContext`, email, metadata, route visibility, or legacy Spree credentials.

Current `/admin` behavior still redirects to the legacy Render/Spree admin and must be replaced. `next.config.ts` also contains legacy admin redirects; both must be removed in B6B.

Legacy seed/test scripts contain committed plaintext old admin credentials. B6B must remove/neutralize those scripts/credentials and must not reuse them for the first-party admin.

Catalog admin scope:

```text
products: list/create/edit/status/SEO/descriptions/category membership
variants: size/SKU/price/compare-at price/quantity/backorderable/default/active
categories: list/create/edit/order/parent where needed
cache invalidation: catalog-public + useful specific tags
```

Media upload/publishing is B7, not B6B. B6B may show current media but should not build the B7 image pipeline.

Important product integrity rules:

- unique product slug/SKU and variant SKU
- active product must have at least one active variant
- exactly one default active variant for a publishable active product
- no `$0` synthetic pricing
- archived/draft products absent from public catalog
- inactive variants not purchasable
- destructive changes must respect cart/order FK/history semantics
- historical order snapshots must never mutate with catalog edits

`description_html` is currently rendered through `dangerouslySetInnerHTML`. B6B must not accept arbitrary unsanitized HTML. Prefer editing plain text and generating escaped safe HTML, or use a strict server-side allowlist sanitizer if rich text is truly needed.

After each successful catalog mutation, invalidate `catalog-public` so public catalog, categories, filters, sitemap, wholesale quick-order snapshot, and related outer caches refresh coherently.

Do not turn admin mutations into direct browser table access; use Server Actions/server-only DAL.

B6B is the final planned B6 phase. After B6B production closure, proceed to B7.

---

## 8. Backend roadmap

```text
B1  persistence foundation                    COMPLETE
B2  real auth                                 COMPLETE
B3  persistent carts                          COMPLETE
B4  profiles + addresses                      COMPLETE
B5  orders + order history                    COMPLETE
B6A authoritative catalog + public read model COMPLETE
B6B first-party catalog admin                 NEXT / FINAL B6
B7  media management/publishing
B8  remove fake Spree SDK/BFF after parity
B9  remove Render/Rails legacy
B10 cleanup / dead compatibility / naming / stale config
```

---

## 9. Performance program

Detailed evidence lives in:

```text
docs/PERFORMANCE-RESEARCH-LEDGER.md
docs/PERFORMANCE-PAPER-EVIDENCE.md
```

Accepted sequence through P1/R012:

- R001 remove client media manifest — KEEP STRONG
- R002 direct in-process catalog reads — KEEP SIMPLIFICATION; B6A replaced static authority with cached in-process read model
- R003 granular PPR / remove root null Suspense — KEEP STRONG
- R004 featured-products PPR stream abort fix — KEEP correctness
- R005 static native ProductCarousel — KEEP STRONG
- R006 direct images — REVERT; Next Image wins
- R007 render all products immediately — REJECT mobile regression
- R008 12 initial + one delayed remainder request — KEEP STRONG
- R009 remove public category `connection()` — KEEP
- R010 remove Speculation Rules — KEEP
- R011 remove cart `router.refresh()` + pathname polling — KEEP
- R012 / P1 exact responsive PDP hero prewarm — KEEP STRONG

P1 SHA:

```text
7173c5d440d977a1dc0ec771c1fccd8a8b7a0ab
```

P2 = cold public PDP route/data path. Reassess after backend migration rather than mixing with B6B.

Do not create R-numbers for migration phases without controlled performance experiments.

---

## 10. Public storefront regression guards

Fresh anonymous homepage/PLP/PDP should preserve:

```text
no unnecessary auth request
no profile/address/order query
no empty cart row created by read
PPR/cacheability where present
Next Image optimized delivery
P1 exact-image intent prewarm
```

PLP invariant:

```text
12 products initial payload
one delayed remainder request
```

B6B admin changes must not place admin/auth/catalog-write work onto anonymous storefront requests.

---

## 11. Temporary compatibility seams

Still temporary:

- `@spree/sdk` types and Spree-shaped DTOs
- `/api/v3/store/[...spree]` compatibility BFF naming/shape
- legacy-named `_spree_*` cookies
- payment/shipping/discount/gift-card/credit-card/country/market/wholesale-channel seams
- existing static optimized media manifest until B7

These do not imply Spree owns catalog/cart/order state.

B8/B9/B10 own compatibility/legacy retirement unless an earlier phase explicitly needs a seam removed.

---

## 12. Known unrelated baseline

Cart Lighthouse SEO has a pre-existing low score around 0.63 versus a 0.90 assertion. Do not opportunistically fix it inside backend phases.

An uncoordinated cart SEO commit `06cce6a64f211ac0f53a72fe61726655f46cd52e` was previously rejected and reverted by `714b638e0c91910b34724cc65795cc8535200723` because it broke the Server/Client Component boundary.

---

## 13. Continuation checklist

Read, in order:

1. `docs/ENGINEERING-CONTINUITY-LOG.md`
2. `docs/PERFORMANCE-RESEARCH-LEDGER.md`
3. current GitHub `main`
4. relevant B6B admin/auth/catalog files

Current continuation:

```text
1. Fetch current origin/main after this docs commit.
2. B1–B5 + B6A are COMPLETE.
3. Do not reopen B6A without evidence.
4. Start B6B — First-Party Catalog Admin.
5. Enforce admin server-side from verified Supabase identity + profiles.role.
6. Remove old Render admin redirects and hard-coded legacy admin credential scripts.
7. Keep media upload/publishing for B7.
8. Preserve catalog-public invalidation and all public performance guards.
9. After B6B audit/merge/production verification, move to B7.
```

---

## 14. Rolling change log

### 2026-09-13 — B6A complete

Recorded:

- authoritative PostgreSQL catalog migration
- 2 categories / 38 products / 152 variants
- cached 4-query public read model
- authoritative variant UUID bridge for carts/orders
- B6A.1 UUID/integrity/cache closure
- B6A.2 sitemap + wholesale quick-order catalog closure
- zero remaining runtime Spree product/category/variant reads
- final B6A merge `a7a57911...`
- 50 suites / 496 tests / 104 pages
- B6B is next and is the last planned B6 phase

### 2026-09-12 — B5 complete

Recorded first-party transactional orders/history, B5.1 security closure, rejected cart SEO commit, and production merge `d24c41ab...`.

### 2026-09-12 — B4 complete

Recorded PostgreSQL-only saved addresses, profile phone support, fail-closed reads, and merge `41082343...`.

### 2026-09-12 — B3 complete

Recorded persistent carts, B3 security closure, Route Handler cache fix, and deterministic browser policy.
