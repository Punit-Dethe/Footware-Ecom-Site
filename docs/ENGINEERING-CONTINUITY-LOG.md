# Engineering Continuity Log

> Durable handoff/state document for the Mirza Footwear storefront migration and performance program.
>
> Update this file whenever a backend phase is accepted/merged, an audit changes the plan, a temporary compatibility decision is introduced/removed, or the immediate next action changes.

---

## 1. Current snapshot

**Snapshot date:** 2026-09-12  
**Repository:** `Punit-Dethe/Footware-Ecom-Site`  
**Production:** `https://storefront-three-tau.vercel.app`

Canonical application state before this docs-only update:

```text
B6A production merge:
ac68598e11a0689c672212e23c2bf2426c5a103c

Accepted B6A branch tip:
bab73c460fd4404c17b02d8b1556a973225ec5ec
```

Merge parents:

```text
0be4f079551ff788423fdab55263977bdb83884d
bab73c460fd4404c17b02d8b1556a973225ec5ec
```

**B1–B5 and B6A are COMPLETE.**

Immediate next phase:

```text
B6B — First-Party Catalog Admin
```

Always fetch current `origin/main` before starting B6B because this continuity update creates a docs-only commit after `ac68598e...`.

---

## 2. Target architecture

```text
Browser / Next.js UI
        ↓
Server Components / Server Actions / server-only DAL
        ↓
Supabase Auth + managed PostgreSQL
        ↓
media/object storage where needed
```

Runtime direction:

- Vercel Next.js storefront
- Supabase Auth
- Supabase managed PostgreSQL
- server-only domain DAL
- no browser direct access to domain tables
- first-party lightweight admin
- prepared/cacheable public catalog read model
- eventual zero runtime dependency on Spree / Render / Rails

Spree-shaped SDK types/BFF responses are transitional compatibility surfaces only.

---

## 3. Operating model

```text
plan
→ executor implementation
→ tests/build
→ independent code audit
→ bounded closure if needed
→ merge
→ targeted production verification
```

Verification hierarchy:

```text
1. direct Node/fetch/SQL checks
2. deterministic headless Playwright when browser behavior is required
3. screenshots/traces only on failure
4. visual LLM browser only for exceptional visual diagnosis
```

Do not run giant unrelated regression matrices as ritual.

---

## 4. Supabase boundary

First-party project:

```text
hkncfdsvgjopkujmmxem
```

Legacy Spree/Supabase project:

```text
nmddtxibpsbtswxnienm
```

Legacy project must remain untouched unless a later retirement task explicitly says otherwise.

Relevant environment names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
DATABASE_URL
SUPABASE_DB_CA_CERT_BASE64
```

Never place raw credentials/secrets into prompts, docs, tests, or logs.

---

## 5. B1 — Persistence foundation — COMPLETE

Migration:

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

Accepted invariants:

- Supabase owns `auth.users`
- RLS enabled on domain tables
- anon/authenticated browser roles do not directly operate domain tables
- application domain access stays server-side
- strict PostgreSQL TLS
- serverless `pg` pool intentionally small

---

## 6. B2 — Real auth — COMPLETE

Accepted B2:

```text
d2e1a6ddb901852b4b5f04bed5d3692a2b31d497
```

B2 merge:

```text
36aadc404e6aa7555fd20f7c463ff807551d8ff8
```

Capabilities: signup/confirmation, login/session verification, refresh, logout, forgot/reset, protected account routes, first-party profile identity.

Role authority is strictly:

```text
public.profiles.role
```

Never infer admin from email, client metadata, signup metadata, demo tokens, or legacy Spree JWTs.

Launch dependency:

```text
CUSTOM SMTP REQUIRED BEFORE PUBLIC CUSTOMER LAUNCH
```

---

## 7. B3 — Persistent carts — COMPLETE

Final B3 merge:

```text
ce14189d879d19a05a2a3775a0fbd3c7f1ecb6fe
```

Migration:

```text
storefront/supabase/migrations/20260912153000_persistent_carts.sql
```

Accepted cart security:

- per-surface `dtc | wholesale`
- secure 256-bit guest bearer, hash only in DB
- cart UUID alone never authorizes
- verified Supabase `claims.sub` for authenticated ownership
- transactional guest→user merge
- auth infrastructure failures fail closed
- unknown catalog line fails; never price at `$0`
- no recursive legacy cart fallback

S8 UX invariant:

- one initial CartProvider hydration
- zero cart reads on normal navigation
- mutation response updates React state
- no `router.refresh()` cascade
- no pathname cart polling
- exactly one auth-transition resync/claim

B6A later reconnects cart lines to authoritative `variant_id`; see B6A section.

---

## 8. B4 — Profiles + Addresses — COMPLETE

Final merge:

```text
410823430d585c093c41433707f6089f5149abfe
```

Forward migration:

```text
storefront/supabase/migrations/20260912180000_addresses_state_abbr.sql
```

Profile ownership:

```text
Supabase Auth → identity/email/authentication
public.profiles → first_name / last_name / phone / role
```

Role is immutable through ordinary customer updates.

Saved addresses are PostgreSQL-only; all ownership filters bind to verified `claims.sub` in SQL.

B4.1 fixed broad fallback semantics and Supabase chunked-cookie detection.

---

## 9. B5 — Orders + Order History — COMPLETE

B5.1 accepted tip:

```text
15c42e841f0a72868d4f583663aa54fdae1d3f28
```

Final production merge:

```text
d24c41ab87cab41050ef84d2d68d71870ef83ba0
```

Migrations:

```text
20260912210000_orders_first_party.sql
20260912220000_orders_source_cart_id_not_null.sql
```

Authoritative order tables:

```text
public.orders
public.order_items
```

Spree order/history reads remaining: `0`.

Placement is transactional and idempotent:

```text
lock source cart
→ verify owner/token + surface
→ return existing order for source_cart_id retry
→ require active cart for fresh conversion
→ snapshot authoritative product/variant/price/address/email
→ insert order + items
→ mark source cart converted
```

`orders.source_cart_id` is NOT NULL + UNIQUE.

Guest order confirmation reuses the converted source cart's retained guest-token hash.

---

## 10. B6A — Authoritative Catalog + Public Read Model — COMPLETE

### Lineage

Initial B6A:

```text
966581d65c18bbbe4508acbaada73936c31175ab
```

B6A.1 closure:

```text
bab73c460fd4404c17b02d8b1556a973225ec5ec
```

Production merge:

```text
ac68598e11a0689c672212e23c2bf2426c5a103c
```

Migration:

```text
storefront/supabase/migrations/20260913000000_catalog_authoritative.sql
```

### PostgreSQL catalog authority

Operational source of truth:

```text
public.categories
public.products
public.product_categories
public.variants
```

Current imported catalog:

```text
2 categories
38 active products
152 variants
sizes 7/8/9/10
default size 8
USD
```

Important schema/integrity state:

- `products.sku` unique
- `products.meta_keywords`
- `variants.is_default`
- `variants.active`
- exactly one default variant per imported active product
- `cart_items.variant_id` NOT NULL
- `cart_items.variant_sku` retained as compatibility/audit field
- `variant_id` is authoritative
- variant ID/SKU mismatch fails closed
- zero duplicate product slugs/SKUs/variant SKUs
- zero orphan variants/category joins

### Public read model

Repository:

```text
storefront/src/lib/db/catalog.ts
storefront/src/lib/catalog/catalog-repository.ts
```

Architecture:

```text
PostgreSQL operational catalog
        ↓
remote cached public snapshot
        ↓
in-process lookup/filter/search/sort
        ↓
Spree-shaped compatibility DTOs
        ↓
storefront
```

Snapshot cache:

```text
"use cache: remote"
cacheLife("hours")
cacheTag("catalog-public")
```

Cold snapshot: 4 bounded parallel PostgreSQL queries.  
Warm snapshot: 0 PostgreSQL catalog queries.  
N+1: 0.

Every outer product/category cache that depends on catalog data also carries `catalog-public`, so B6B can invalidate one central tag after writes.

There is no runtime hardcoded product/category fallback.

### B6A.1 closure invariants

Closed audit findings:

- UUID variant lookup uses `v.id = $1::uuid`; SKU lookup is separate
- PDP real UUID add-to-cart persists exact `variant_id` + matching SKU
- B3 Case C guest→existing-user merge carries `variant_id` under NOT NULL schema
- cart adaptation resolves by authoritative `variant_id` and checks SKU consistency
- order placement joins variants by `variant_id` only and checks recorded SKU consistency
- category membership is never guessed from slug prefixes
- active product with zero active variants fails catalog integrity
- active product must have exactly one default variant
- no synthetic `$0` product fallback

### Media boundary

B6A intentionally leaves optimized media presentation on the existing manifest/helpers until B7.

Preserve:

- Next/Image behavior
- responsive candidates
- LQIP/dominant-color behavior
- P1 exact responsive PDP hero prewarm

### Production validation

Accepted production state:

```text
49 suites
475 tests
typecheck PASS
lint PASS
build PASS
104/104 pages
```

Production sanity passed for:

- homepage/PLP/categories/PDP
- search/sort/pagination
- BFF product/category compatibility
- real UUID add/read/update/remove cart flow
- B3 Case C guest→user merge with authoritative variant ID
- order placement using PostgreSQL price
- order idempotent retry
- 0 private auth/profile/address/order calls on fresh public homepage/PLP/PDP
- PLP 12 + remainder preserved
- P1 preserved

Representative reported warm timings after B6A:

```text
homepage ~73 ms
PLP ~382 ms
categories ~490–517 ms
PDP ~312 ms
```

These are architecture sanity timings, not a new R-series controlled experiment.

---

## 11. Backend roadmap

```text
B1   persistence foundation                    COMPLETE
B2   real auth                                 COMPLETE
B3   persistent carts                          COMPLETE
B4   profiles + addresses                      COMPLETE
B5   orders + order history                    COMPLETE
B6A  authoritative catalog + public read model COMPLETE
B6B  first-party catalog admin                 NEXT
B7   media management / publishing
B8   remove Spree SDK/BFF compatibility
B9   remove Render / Rails legacy
B10  cleanup / stale compatibility / naming
```

### B6B — First-Party Catalog Admin — NEXT

Goals:

- replace the current `/admin` redirect to Render/Spree
- server-enforced admin authorization using verified Supabase identity + `public.profiles.role = 'admin'`
- CRUD for products/categories/variants, price, stock, status, descriptions, SEO fields and category membership
- safe publish/unpublish semantics
- every mutation invalidates `catalog-public`
- preserve B6A read-model performance
- no image upload/media publishing yet; B7 owns media
- no browser direct DB access

Important current admin state before B6B:

```text
/:country/:locale/admin → redirects to old Render Spree admin
/admin                 → Next config redirects to old Render Spree admin
```

B6B must remove those redirects when the first-party route is ready.

Security note: legacy seed/test scripts in `scripts/seeds/` contain hard-coded admin credentials. Do not repeat the values. B6B should remove or neutralize plaintext bootstrap credentials and require secure environment/manual role provisioning. Any exposed credential must be rotated.

---

## 12. Performance program

Detailed evidence:

```text
docs/PERFORMANCE-RESEARCH-LEDGER.md
docs/PERFORMANCE-PAPER-EVIDENCE.md
```

Accepted sequence:

- R001 remove client media manifest — KEEP STRONG
- R002 direct in-process catalog reads — KEEP SIMPLIFICATION; B6A replaced static authority with cached DB snapshot while preserving in-process querying
- R003 granular PPR — KEEP STRONG
- R004 featured-products PPR correctness — KEEP
- R005 static native carousel — KEEP STRONG
- R006 direct images — REVERT
- R007 render all products immediately — REJECT
- R008 12 initial + one deferred remainder — KEEP STRONG
- R009 remove public category `connection()` — KEEP
- R010 remove Speculation Rules — KEEP
- R011 remove cart `router.refresh()` + pathname polling — KEEP
- R012/P1 exact responsive PDP hero prewarm — KEEP STRONG

Accepted P1 SHA:

```text
7173c5d440d977a1dc0ec771c1fccd8a8b7a0ab
```

P2 remains the cold public PDP route/data path. Reassess after backend migration stabilizes.

Do not create R-numbers for architecture migration without controlled before/after evidence.

---

## 13. Public regression guards

Fresh anonymous homepage/PLP/PDP must preserve:

- zero unnecessary auth/profile/address/order work
- no empty cart creation merely by reading
- PPR/cacheability where present
- optimized Next/Image behavior
- P1 exact-image prewarm

PLP invariant:

```text
12 products initial payload
one delayed bulk remainder request
```

Catalog mutations must not bypass B6A cache invalidation.

---

## 14. Temporary compatibility

Current first-party ownership:

```text
auth      → Supabase Auth
profiles  → PostgreSQL
addresses → PostgreSQL
carts     → PostgreSQL
orders    → PostgreSQL
catalog   → PostgreSQL + cached public read model
media     → existing optimized static manifest/helpers until B7
```

Still transitional:

- `@spree/sdk` types and Spree-shaped DTOs
- BFF `/api/v3/store/*`
- some `_spree_*` cookie names
- payment-session/shipping-rate/discount/gift-card/fulfillment compatibility paths
- old Render/Rails code/config until B9

Do not confuse compatibility naming with backend ownership.

---

## 15. Known unrelated baseline

Cart Lighthouse SEO baseline:

```text
/us/en/cart
SEO ≈ 0.63
```

The uncoordinated attempted cart SEO commit `06cce6a...` was rejected and reverted because it broke the Server/Client boundary. Fix cart SEO only in a dedicated scoped change later.

---

## 16. Security / operations

Sensitive credential material has appeared in executor command logs during migration. Do not copy values into docs/prompts.

Before launch:

- rotate exposed DB/deployment-bypass credentials if not already rotated
- remove/neutralize committed plaintext admin seed/test credentials
- secure admin role bootstrap/provisioning
- custom SMTP for customer auth

Future scripts must load secrets from environment/config without echoing them.

---

## 17. Fresh-chat continuation

Read:

1. `docs/ENGINEERING-CONTINUITY-LOG.md`
2. `docs/PERFORMANCE-RESEARCH-LEDGER.md`
3. current GitHub `main`
4. `docs/ARCHITECTURE.md` only as older reference

Then:

```text
1. Verify current origin/main after this docs-only update.
2. B1–B5 + B6A are COMPLETE.
3. Do not reopen B6A without new evidence.
4. Start B6B — First-Party Catalog Admin.
5. Use server-only admin authorization from verified Supabase identity + public.profiles.role.
6. Invalidate catalog-public after successful catalog writes.
7. Do not start B7/B8 until B6B is independently audited, merged, and production verified.
```

---

## 18. Rolling change log

### 2026-09-12 — B6A complete

Recorded:

- B6A `966581d...`
- B6A.1 `bab73c46...`
- production merge `ac68598e...`
- PostgreSQL authoritative catalog
- cached public read model
- 2 categories / 38 products / 152 variants
- cart `variant_id` NOT NULL and authoritative
- UUID add-to-cart + Case C merge closure
- transaction-local authoritative order price snapshots
- central `catalog-public` invalidation tag
- 49 suites / 475 tests / 104 pages
- B6B next

### 2026-09-12 — B5 complete

Recorded first-party orders/history, B5.1 checkout/order security closure, and merge `d24c41ab...`.

### 2026-09-12 — B4 complete

Recorded PostgreSQL saved addresses/profile phone and merge `41082343...`.

### 2026-09-12 — B3 complete

Recorded persistent carts and security/cache closure.
