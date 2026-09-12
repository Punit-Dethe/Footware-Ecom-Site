# Engineering Continuity Log

> Durable handoff/state document for the Mirza Footwear storefront migration and performance program.
>
> Update whenever a backend phase is accepted/merged, an audit changes the plan, a compatibility seam changes, or the immediate next action changes.

---

## 1. Current snapshot

**Snapshot date:** 2026-09-12  
**Repository:** `Punit-Dethe/Footware-Ecom-Site`  
**Production:** `https://storefront-three-tau.vercel.app`

Accepted B6A production merge:

```text
ac68598e11a0689c672212e23c2bf2426c5a103c
```

Accepted B6A.1 branch tip:

```text
bab73c460fd4404c17b02d8b1556a973225ec5ec
```

Merge parents:

```text
0be4f079551ff788423fdab55263977bdb83884d
bab73c460fd4404c17b02d8b1556a973225ec5ec
```

B1–B5 are COMPLETE. B6A core catalog/read-model migration is merged and production-verified, but a post-merge audit found two remaining **catalog read** seams still using Spree:

```text
1. sitemap product/category count/page reads
2. wholesale quick-order product/variant search + exact SKU resolution
```

Therefore immediate next action is:

```text
B6A.2 — Remove remaining Spree catalog reads
```

Only after B6A.2 is accepted/merged/verified should B6B start.

This docs update advances `main` after `ac68598e...`; fetch current `origin/main` before creating B6A.2.

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

Direction:

- Vercel Next.js storefront
- Supabase Auth + managed PostgreSQL
- server-only domain DAL
- no browser direct domain-table access
- lightweight first-party admin
- cached/prepared public catalog read model
- eventual zero runtime dependency on Spree / Render / Rails

Spree-shaped SDK types/BFF DTOs are compatibility surfaces, not ownership.

---

## 3. Migration operating model

```text
plan
→ executor implementation
→ tests/build
→ independent audit
→ bounded closure if needed
→ merge
→ targeted production verification
```

Verification hierarchy:

```text
1. direct Node/fetch/SQL
2. deterministic headless Playwright only when browser behavior is required
3. traces/screenshots only on failure
4. visual LLM browser only for exceptional visual diagnosis
```

---

## 4. Supabase boundary

First-party project:

```text
hkncfdsvgjopkujmmxem
```

Legacy project:

```text
nmddtxibpsbtswxnienm
```

Legacy project remains untouched unless a later retirement task explicitly says otherwise.

Never place raw credentials/secrets into prompts, docs, tests, or logs.

---

## 5. Completed backend phases

### B1 — Persistence foundation — COMPLETE

Migration:

```text
storefront/supabase/migrations/20260911000000_init_ecommerce_schema.sql
```

Domain tables include profiles, addresses, categories, products, product_categories, variants, product_images, carts, cart_items, orders, order_items.

Supabase owns `auth.users`. Domain tables stay server-only with RLS/browser-role lockdown.

### B2 — Real auth — COMPLETE

Accepted B2:

```text
d2e1a6ddb901852b4b5f04bed5d3692a2b31d497
```

Merge:

```text
36aadc404e6aa7555fd20f7c463ff807551d8ff8
```

Role authority is strictly:

```text
public.profiles.role
```

Never infer admin from email/client metadata/demo tokens/legacy Spree identity.

Custom SMTP remains required before public customer launch.

### B3 — Persistent carts — COMPLETE

Final merge:

```text
ce14189d879d19a05a2a3775a0fbd3c7f1ecb6fe
```

Security/UX invariants:

- 256-bit guest bearer; hash only in DB
- cart UUID alone never authorizes
- verified Supabase claims for authenticated ownership
- transactional guest→user merge
- fail closed on auth infrastructure failure
- unknown catalog line never `$0`
- no legacy Spree cart fallback
- one initial hydration; no pathname polling/router.refresh cascade

### B4 — Profiles + Addresses — COMPLETE

Merge:

```text
410823430d585c093c41433707f6089f5149abfe
```

Supabase Auth owns identity/email; PostgreSQL profiles own first/last/phone/role. Saved addresses are PostgreSQL-only and SQL-scoped to verified user ownership.

### B5 — Orders + Order History — COMPLETE

Accepted B5.1:

```text
15c42e841f0a72868d4f583663aa54fdae1d3f28
```

Production merge:

```text
d24c41ab87cab41050ef84d2d68d71870ef83ba0
```

Orders/history are PostgreSQL-only. Placement is transactional/idempotent, `source_cart_id` is NOT NULL + UNIQUE, guest confirmation reuses the converted cart authorization anchor, and all price snapshots are server-authoritative.

---

## 6. B6A — Authoritative Catalog + Public Read Model — CORE COMPLETE, B6A.2 REQUIRED

Initial B6A:

```text
966581d65c18bbbe4508acbaada73936c31175ab
```

B6A.1:

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

### Operational catalog authority

```text
public.categories
public.products
public.product_categories
public.variants
```

Current catalog:

```text
2 categories
38 active products
152 variants
sizes 7/8/9/10
default size 8
USD
```

Integrity:

- unique product slug/base SKU and variant SKU
- exactly one default variant per active product
- `cart_items.variant_id` NOT NULL and authoritative
- SKU retained as compatibility/audit field
- ID/SKU drift fails closed
- no orphan variants/category joins
- active product with zero active variants fails
- no synthetic `$0` catalog product

### Public read model

```text
PostgreSQL
   ↓
remote cached catalog snapshot
   ↓
in-process search/filter/sort/lookup
   ↓
compatibility DTOs
```

Central tag:

```text
catalog-public
```

Cold snapshot: 4 bounded parallel DB queries.  
Warm snapshot: 0 DB catalog queries.  
N+1: 0.

Every outer product/category cache in the normal storefront path carries `catalog-public`.

### B6A.1 fixes

- UUID lookup uses UUID-only SQL; SKU lookup separate
- real PDP UUID add persists exact `variant_id` + matching SKU
- B3 Case C guest→existing-user merge carries `variant_id`
- cart/order resolution treats variant UUID as authority and verifies SKU
- no category slug guessing
- exactly one default active product variant required
- no `$0` fallback

### Media boundary

Optimized media still comes from existing manifest/helpers until B7. Preserve Next/Image, LQIP/dominant color and P1 responsive hero prewarm.

### Production verification accepted

```text
49 suites
475 tests
typecheck PASS
lint PASS
build PASS
104/104 pages
```

Passed: homepage/PLP/categories/PDP, search/sort/pagination, BFF product/category reads, real UUID cart operations, B3 Case C merge, first-party order price snapshotting, 0 public private-state calls, PLP 12+remainder, P1.

### Post-merge B6A.2 audit finding

Two catalog consumers still call Spree product/category APIs:

```text
storefront/src/lib/data/sitemap.ts
- getSitemapResourceCount()
- getSitemapProductPage()
- getSitemapCategoryPage()

storefront/src/lib/data/wholesale.ts
- searchWholesaleVariants()
- findWholesaleVariantBySku()
```

Sitemap currently tries Spree products/categories first, then falls back to PostgreSQL.

Wholesale PLP/PDP are already DB-backed through `./products`; only quick-order autocomplete/exact-SKU helpers remain Spree-backed.

B6A.2 must move these catalog reads to PostgreSQL/read-model authority. Wholesale channel configuration/approval itself may remain transitional; it is not catalog ownership.

---

## 7. Backend roadmap

```text
B1    persistence foundation                    COMPLETE
B2    real auth                                 COMPLETE
B3    persistent carts                          COMPLETE
B4    profiles + addresses                      COMPLETE
B5    orders + order history                    COMPLETE
B6A   core authoritative catalog/read model     MERGED + VERIFIED
B6A.2 remaining Spree catalog reads              NEXT
B6B   first-party catalog admin                 AFTER B6A.2
B7    media management/publishing
B8    remove Spree SDK/BFF compatibility
B9    remove Render/Rails legacy
B10   cleanup/stale compatibility/naming
```

---

## 8. B6B admin audit notes for later

Current admin still redirects to old Render/Spree admin in both localized admin page and `next.config.ts`.

B6B must use verified Supabase identity + `public.profiles.role = 'admin'` on every privileged Server Action, not only the page gate.

Legacy `scripts/seeds/` files contain committed plaintext admin bootstrap/test credentials. Do not repeat the values. Before/within B6B, remove or neutralize those literals and rotate any deployed credential that reused them.

`description_html` is rendered through `dangerouslySetInnerHTML`; future admin-authored rich HTML must be sanitized or B6B should limit editing to safely escaped/plain-text-derived HTML.

---

## 9. Performance program

Detailed evidence:

```text
docs/PERFORMANCE-RESEARCH-LEDGER.md
docs/PERFORMANCE-PAPER-EVIDENCE.md
```

Accepted important invariants:

- R008: 12 initial PLP products + one delayed remainder request
- R011: no cart router.refresh/pathname polling
- R012/P1: exact responsive PDP hero prewarm
- Next/Image remains preferred
- preserve PPR/cacheability

Do not create R-numbers for migration phases without controlled before/after evidence.

---

## 10. Public regression guards

Fresh anonymous homepage/PLP/PDP:

- zero unnecessary auth/profile/address/order work
- no empty cart creation on read
- PPR/cacheability preserved
- optimized image delivery/P1 preserved

Catalog changes must not bypass `catalog-public` invalidation.

---

## 11. Temporary compatibility

Current ownership:

```text
auth      → Supabase Auth
profiles  → PostgreSQL
addresses → PostgreSQL
carts     → PostgreSQL
orders    → PostgreSQL
catalog   → PostgreSQL/read model, except B6A.2 catalog seams above
media     → optimized static manifest/helpers until B7
```

Still transitional:

- `@spree/sdk` types / Spree-shaped DTOs
- BFF `/api/v3/store/*`
- payment/shipping/discount/gift-card/fulfillment compatibility paths
- wholesale channel configuration/approval
- some legacy `_spree_*` names
- Render/Rails code/config until B9

---

## 12. Security / operations

Never copy secret values from executor logs into docs/prompts.

Before launch:

- rotate exposed DB/deployment-bypass credentials if not already rotated
- remove/neutralize plaintext admin seed/test credentials
- secure admin role provisioning
- configure custom SMTP

Future scripts must load secrets from environment without echoing them.

---

## 13. Fresh-chat continuation

Read:

1. `docs/ENGINEERING-CONTINUITY-LOG.md`
2. `docs/PERFORMANCE-RESEARCH-LEDGER.md`
3. current GitHub `main`

Then:

```text
1. Fetch current origin/main after this docs-only update.
2. Do NOT reopen accepted B6A core without evidence.
3. Run B6A.2 only for sitemap + wholesale quick-order catalog ownership.
4. Audit/merge/production-verify B6A.2.
5. Then start B6B first-party catalog admin.
6. Do not start B7/B8 early.
```

---

## 14. Rolling change log

### 2026-09-12 — B6A post-merge audit

Found remaining Spree catalog reads in sitemap and wholesale quick-order helpers. B6A.2 inserted before B6B.

### 2026-09-12 — B6A core complete

Recorded B6A `966581d...`, B6A.1 `bab73c46...`, merge `ac68598e...`, PostgreSQL catalog/read model, variant-ID authority, cache architecture, and 49/475/104 validation.

### 2026-09-12 — B5 complete

Recorded first-party orders/history and merge `d24c41ab...`.
