# Engineering Continuity Log

> Canonical durable handoff/state document for the Mirza Footwear storefront migration and performance program.
>
> **Purpose:** preserve accepted architecture, phase state, security invariants, performance decisions, operational blockers, and the exact next action so a new planner/auditor or executor can continue without reconstructing a long chat.
>
> **Update rule:** update this file whenever a backend phase is accepted/merged, an audit changes the plan, a compatibility seam changes, an operational preflight changes, or the immediate next action changes.
>
> **Authority rule:** during the migration, this file is the phase/state authority. `docs/PERFORMANCE-RESEARCH-LEDGER.md` remains the authority for measured performance experiments. Older architecture/specification docs may describe superseded Spree/Render states and must not override this log.

---

## 1. Current canonical snapshot

**Snapshot date:** 2026-09-18

**Repository:** `Punit-Dethe/Footware-Ecom-Site`

**Production storefront:** `https://mirzafootwear.vercel.app`

### Mirza Media Modernization Program Status:
* **Phase 1 (Media Contract v1 Foundation)**: MERGED (`feat/media-contract-v1`).
* **Phase 2 (Stone Master Image Pipeline)**: MERGED (`feat/stone-media-pipeline`).
* **Phase 3 (Supabase Stone-Asset Migration)**: MERGED (`feat/stone-media-supabase-migration`).
* **Phase 4 (Storefront Cutover to Media Contract v1)**: MERGED (`feat/media-v1-storefront-cutover`).
* **Phase 5 (Global Media Library Backend + Upload Pipeline)**: MERGED (`feat/media-library-backend`).
* **Phase 6A (Editorial Admin Foundation & Global Media Library UI)**: MERGED into `main` at `5c0edbf6ce94bd09d563a5b93fcc45cbe2c90fbe`.
* **Phase 6B (Product ↔ Media Library Integration)**: MERGED into `main` at `22144864d96c5828619d1df626eef2311e6e571c`.
* **Phase 7 (Complete Editorial Catalog Admin Redesign)**: **COMPLETE / VERIFIED** on branch `feat/editorial-admin-catalog`.
  - Replaced `/admin` redirect with real Mirza Studio Overview (`getAdminCatalogOverview()` bounded to 2 SQL queries, 0 N+1, Media Contract v1 hero thumbnails, 0 `product_images`).
  - Rebuilt `/admin/products` index with bounded pagination (`listAdminProductsPage()`, default 30/page, URL state `?q=&status=&category=&sort=&page=`, quiet uppercase status, aggregated variants and categories).
  - Redesigned `/admin/products/[id]` (`ProductEditForm.tsx`): editorial typography, live storefront link (`View on storefront ↗`), Radix Archive confirmation dialog (replaces browser `confirm()`), unsaved dirty state tracking, clean accessible category checkboxes, compact variants editor, preserved Phase 6B `ProductMediaManager` without regression.
  - Redesigned `/admin/products/new` (`ProductNewForm.tsx`) with draft registration helper notice.
  - Redesigned `/admin/categories` (`CategoryManager.tsx`): Radix Create/Edit Dialog and Radix Safe Delete Dialog (blocks when `productCount > 0`, confirms when 0; no browser `alert()` or `confirm()`).
  - Extended `storefront/src/app/admin.css` with shared editorial design tokens (`--admin-canvas`, `--admin-surface`, `--admin-secondary`, `--admin-stone`, `--admin-ink`, `--admin-muted`, `--admin-border`).
  - Top navigation updated to: Overview, Products, Categories, Media.
  - Full test suite: 76 test files, 855 passed, 0 failures.
  - TypeScript `tsc --noEmit`: 0 errors. Biome lint: 0 errors, 0 warnings.
  - Visual QA verified at 1920, 1440, 768, and 390 viewports with zero errors.
  - Production build: 103/103 static pages generated cleanly. Zero storefront JS or catalog query impact. Zero database schema migrations.
  - Ready for supervisor review. Do NOT merge to main.

### Current working head

Starting `main` SHA for Phase 7:

```text
22144864d96c5828619d1df626eef2311e6e571c  fix(media): implement Phase 6B final hero promotion fix
```

Branch: `feat/editorial-admin-catalog`

Current phase:

```text
MIRZA ADMIN — PHASE 7: COMPLETE EDITORIAL CATALOG ADMIN REDESIGN — COMPLETE (Awaiting Supervisor Review)
Next: PHASE 8 — ORDERS & CUSTOMERS CONTROL PLANE
```

Canonical B10 references:
* B10.1 accepted SHA: `5d858a1fe6aff98479eda39baa3305ae8d208104`
* B10 merge SHA: `3367ea2f05fac795cc8df616d4e7a4b59859ef7e`
* Vercel deployment ID: `dpl_9vTuvjoiNtThD93xSSDpMb4aZxGB`
* Deployed application SHA: `3367ea2f05fac795cc8df616d4e7a4b59859ef7e`
* Production URL: `https://mirzafootwear.vercel.app`
* Production deployment status: `READY / Production Verified`

Accepted B10 validation baseline:

* 61 suites / 660 tests passing (100% pass)
* 22/22 architectural invariants verified by `b10-architecture-audit.test.ts`
* 21/21 architectural invariants verified by `b9-architecture-audit.test.ts`
* 18/18 architectural invariants verified by `b8-architecture-audit.test.ts`
* TypeScript `tsc --noEmit` clean (0 errors)
* Biome lint clean (0 errors, 0 warnings across 320 files)
* Next.js production build: 106 static pages successfully generated
* Playwright first-party smoke E2E: 2 passed / 2 total (100%)

Verified on merged main:
* `src/lib/spree` absent
* `@/lib/spree` imports = 0
* Legacy JWT auth = 0
* Spree middleware/config/runtime identifiers = 0 outside deliberate cookie migration compatibility
* Dead Stripe/PayPal/Adyen packages = 0
* Public static product tree absent
* Old seed scripts absent
* Old operational `SPREE_*` configuration = 0
* `adaptDbCartToSpreeCart`, `adaptDbOrderToSpree`, `adaptDbAddressToSpree` = 0
* Supabase verified claims remain authentication authority
* Mirza/legacy cart-cookie mixed-state tests remain green
* Zero namespace crossing: new ID + legacy token = impossible; legacy ID + new token = impossible
* `setCartCookies` unconditionally expires legacy ID and token cookies
* Full test coverage for mixed and legacy cart states (cases A through G)
* Production references to `LEGACY_*` cookie constants outside bridge = 0
* Request headers neutralized: `x-mirza-request-pathname` / `x-mirza-request-search` (0 `x-spree-request-*`)

Production smoke verification:

> **These URLs and counts were correct at B10 acceptance and are now stale.**
> The catalog has since been replaced: 31 products, categories `office-wear` /
> `traditional`, and PDP slugs `shoe-2026-09-001`…`031`. Use
> `/us/en/products/shoe-2026-09-001` for smoke tests, and `/us/en/c/office-wear`
> for a category. Retained below as the historical B10 record.

* Homepage (`/us/en`): 200 OK
* PLP (`/us/en/products`): 200 OK (38 products rendered, active links, filter state)
* PDP (`/us/en/products/office-footwear-01`): 200 OK
* Supabase product media delivery: active storage assets verified
* Zero legacy Spree/Rails/Render infrastructure
* Live legacy-cookie migration: tested with legacy `_spree_cart_token` and `_spree_cart_token_id`; verified first-party copy to `_mirza_cart_token` and `_mirza_cart_id`, with immediate expiration of legacy cookies
* Live mixed-state isolation: verified legacy `_spree_cart_token` is expired without contaminating `_mirza_cart_id` namespace
* Live legacy auth distrust: verified `_spree_jwt` is not accepted for protected routes (`/account/orders` redirects to login) and legacy auth cookies are expired
* Anonymous visitor invariant: S8 0 set-cookie headers preserved on warm visitor

Next phase recorded at B10 acceptance (now superseded by the in-progress state above):
```text
FINAL UI IMPLEMENTATION
```
(Do not start Media Contract v1 or performance optimization).

### Current validation baseline

Re-measured on `main` at `6c504be` on 2026-09-14:

```text
62 suites / 662 tests passing (100%)
TypeScript tsc --noEmit  clean (0 errors)
Biome lint               clean (0 errors, 0 warnings)
```

The B10 numbers below (61 suites / 660 tests / 106 pages) remain the accepted
*backend* baseline. The two extra suites and two extra tests come from the
editorial UI work (`VariantPicker.test.tsx`, expanded `ProductCarousel.test.tsx`).

---

## 2. Target architecture and ownership

Target runtime architecture:

```text
Browser / Next.js UI
        ↓
Next.js Server Components / Server Actions / server-only DAL
        ↓
Supabase Auth + managed PostgreSQL
        ↓
Supabase Storage for product media
```

Accepted first-party ownership after B6 and the accepted B7 source implementation:

```text
auth           → Supabase Auth
profiles       → PostgreSQL
addresses      → PostgreSQL
carts          → PostgreSQL
orders         → PostgreSQL
catalog        → PostgreSQL + cached public read model
catalog admin  → first-party Next.js admin
media metadata → public.product_images
media bytes    → Supabase Storage product-media
media admin    → first-party Next.js admin
```

> **Status 2026-09-14:** the compatibility surfaces listed below have all been
> retired. B8 deleted the fake Spree BFF and `@spree/sdk`; B9 removed the
> Render/Rails operational infrastructure; B10 deleted `src/lib/spree/` and
> replaced the Spree identifiers with neutral first-party naming. The only
> remaining legacy surface is the deliberate cookie migration bridge in
> `src/lib/storefront/legacy-cookie-migration.ts`, which isolates the legacy
> `_spree_*` cookie literals so existing carts survive the rename.

The migration target is met:

```text
zero runtime Spree / Render / Rails dependency   — VERIFIED
```

---

## 3. Migration operating model

```text
planner/auditor
→ executor implementation
→ tests/build
→ independent audit
→ bounded closure if evidence requires it
→ merge
→ targeted production verification
```

Do not run huge unrelated matrices as ritual. Scrutiny is strongest around:

- identity and authorization;
- ownership and persistence;
- transactional integrity;
- cache invalidation;
- media/path safety;
- secrets;
- historical order snapshots;
- public performance regressions.

Browser verification hierarchy:

```text
1. direct SQL / Node / fetch / unit-integration checks
2. scripted headless Playwright only for actual browser behavior
3. traces/screenshots on failure
4. visual LLM browser automation only for exceptional UI diagnosis
```

---

## 4. Clean Supabase boundary and secret policy

First-party project:

```text
hkncfdsvgjopkujmmxem
```

Region:

```text
ap-south-1 / Mumbai
```

Legacy project:

```text
nmddtxibpsbtswxnienm
```

The legacy project must remain untouched unless a later retirement task explicitly says otherwise.

Relevant first-party environment names now include:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
DATABASE_URL
SUPABASE_DB_CA_CERT_BASE64
SUPABASE_SECRET_KEY
```

`SUPABASE_SECRET_KEY` is server-only and must never have a `NEXT_PUBLIC_` prefix.

Legacy B7 runtime dependency on:

```text
SUPABASE_SERVICE_ROLE_KEY
```

has been removed.

Never place raw credentials/passwords/secrets into prompts, docs, tests, source, build logs, or reports.

An earlier executor transcript exposed a clean-project PostgreSQL credential. The raw credential must never be copied into this log or any future prompt.

---

## 5. Completed backend phases

### B1 — Persistence foundation — COMPLETE

Initial migration:

```text
storefront/supabase/migrations/20260911000000_init_ecommerce_schema.sql
```

Domain tables include:

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

`auth.users` remains Supabase-owned. RLS is enabled on domain tables and browser roles do not directly operate domain data. Application domain access is server-side.

Database TLS remains strict. Do not regress cloud DB access to permissive certificate handling or `rejectUnauthorized: false`.

### B2 — Real auth — COMPLETE

Accepted SHA:

```text
d2e1a6ddb901852b4b5f04bed5d3692a2b31d497
```

Merge:

```text
36aadc404e6aa7555fd20f7c463ff807551d8ff8
```

Capabilities include signup/confirmation/login/session refresh/logout/forgot/reset/protected account/basic profile.

Admin/customer role authority is strictly:

```text
verified Supabase claims.sub
→ public.profiles
→ public.profiles.role
```

Never infer admin from email, signup metadata, client state, legacy tokens, or hard-coded identity.

Custom SMTP remains a public-launch dependency.

### B3 — Persistent carts — COMPLETE

Key lineage:

```text
B3.1: ddcfdf61d9323d04c89c3e205b3ec8fa601e2f3c
B3.2: b0638658882ca63e46c75ef84bce178d8934dfc4
final: ce14189d879d19a05a2a3775a0fbd3c7f1ecb6fe
```

Guest bearer security uses a random token in secure HttpOnly cookie and SHA-256 hash in DB. Cart UUID alone never authorizes. Authenticated ownership uses verified Supabase `claims.sub` + cart surface. Guest→user merge is transactional.

S8 cart UX invariant:

```text
one initial CartProvider hydration
zero cart reads on ordinary navigation
mutation response updates React state directly
no router.refresh cascade
no pathname cart polling
one auth-transition cart resync/claim
```

Do not reintroduce legacy Spree cart-read fallback, process-local cart state, `$0` unknown variants, or mutation-triggered refresh cascades.

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

Orders/order_items are PostgreSQL-owned. Spree order-history/read fallback is gone. Placement is transactional and idempotent by `UNIQUE(source_cart_id)`; cart surface/ownership/active state are enforced; server-side snapshots own price/name/SKU/addresses/email.

Historical order snapshots must never mutate when live catalog/media data changes.

Forward migrations:

```text
20260912210000_orders_first_party.sql
20260912220000_orders_source_cart_id_not_null.sql
```

Accepted production baseline at B5 closure:

```text
47 suites
440 tests
104 pages
```

---

## 6. B6 — Authoritative catalog + first-party admin — COMPLETE

B6 is composed of B6A + B6B and is fully accepted on `main`.

Final B6 production merge:

```text
6d630e4caef89c295bcec2cfbe0d51ea4b5b3d3a
```

### B6A — Authoritative Catalog + Public Read Model — COMPLETE

Lineage:

```text
966581d65c18bbbe4508acbaada73936c31175ab  initial B6A
bab73c460fd4404c17b02d8b1556a973225ec5ec  B6A.1 integrity closure
65c9c392a3b707492f08dc8e4cb634fa66b8b44c  B6A.2 remaining catalog-read closure
a7a57911b8eb80a91ee84daa6b330be6133d0257  final B6A production merge
```

Forward migration:

```text
storefront/supabase/migrations/20260913000000_catalog_authoritative.sql
```

Permanent demo catalog at B6/B7 time:

```text
categories = 2
active products = 38
variants = 152
```

Authoritative operational catalog:

```text
public.categories
public.products
public.product_categories
public.variants
```

Static runtime product/category arrays are no longer an alternate source of truth.

`cart_items.variant_id` is authoritative and NOT NULL; `variant_sku` remains compatibility/audit data. Cart/order reads reject UUID/SKU drift.

Order placement joins authoritative variant UUID inside the existing transaction and rejects SKU drift/inactive/out-of-stock non-backorderable variants. No global pool call is made from inside that transaction.

Public read model:

```text
PostgreSQL source of truth
→ bounded 4-query snapshot load
→ Next.js remote cache tagged catalog-public
→ in-process filter/search/sort/lookups
→ compatibility DTOs
```

Accepted catalog performance contract:

```text
warm catalog snapshot DB queries = 0
cold snapshot queries = 4 bounded queries
N+1 = 0
```

All dependent outer catalog caches carry `catalog-public`.

Runtime catalog ownership after B6A:

```text
Spree product reads  = 0
Spree category reads = 0
Spree variant reads  = 0
```

Final B6A verification included:

```text
50 suites passed
496 tests passed
typecheck PASS
lint PASS
build PASS
104/104 pages
```

### B6B — First-Party Catalog Admin — COMPLETE

Accepted B6B branch head:

```text
24513e1cc38f72c9b6c9b923794b0c458c264989
```

Final production merge containing B6B:

```text
6d630e4caef89c295bcec2cfbe0d51ea4b5b3d3a
```

B6B replaced the legacy Render/Spree admin routing with a first-party internal admin.

Privileged catalog mutations require:

```text
verified Supabase claims.sub
+ public.profiles.role = 'admin'
→ Server Action / server-only DAL mutation
```

Never authorize admin based only on `AuthContext`, email, signup metadata, route visibility, or legacy Spree credentials.

B6B capabilities include:

```text
products: list/create/edit/status/SEO/descriptions/category membership
variants: size/SKU/price/compare-at/quantity/backorderable/default/active
categories: list/create/edit/order/parent where needed
cache invalidation: catalog-public
```

Important accepted integrity rules:

- new products are created as **draft** only;
- publication requires valid active/default variant state;
- active product must have at least one active variant;
- exactly one default active variant for a publishable active product;
- unique product slug/SKU and variant SKU;
- no synthetic `$0` pricing;
- draft/archived products are absent from public catalog;
- inactive variants are not purchasable;
- destructive edits respect cart/order/history semantics;
- historical order snapshots do not mutate;
- descriptions are stored/rendered through the safe-description path rather than arbitrary unsanitized admin HTML.

Legacy admin redirect/config and old committed plaintext admin seed/test credential scripts were removed/neutralized. Bootstrap behavior must remain explicit and server-authoritative.

B6B intentionally did **not** build media upload/publishing; that belongs to B7.

---

## 7. B7 — First-Party Media Management + Publishing — COMPLETE

### Status

Branch:

```text
backend/b7-media
```

Accepted head:

```text
1e09b19c17315b7fb66395b94508052df50b1271
```

Implementation status:

```text
B7 source architecture = COMPLETE / ACCEPTED
B7 merge to main        = COMPLETE (e64631d90ef52bc7470f79b780cbe9dcb7e98aa2)
B7 production deploy    = COMPLETE (dpl_FiDAYjzgYHKZaVXceMyb2BPfSHH9)
B7 production signoff   = COMPLETE
B8                      = COMPLETE (superseded; see §11 roadmap)
```

> **Note:** B7 status above is reproduced as originally recorded. B8, B9 and B10
> have since completed — see §11 for the authoritative roadmap state.

### B7 media authority

Media metadata authority:

```text
public.product_images
```

Media byte authority:

```text
Supabase Storage bucket: product-media
```

Public flow:

```text
PostgreSQL products
→ product_images metadata
→ Supabase Storage objects
→ cached public catalog DTO
→ storefront
```

The static media manifest is no longer production runtime authority on the accepted B7 branch. Old static manifest/files may remain physically in git until B10 cleanup, but runtime must not depend on them.

### Existing 38-product media migration

The existing demo catalog was migrated without re-encoding the already-produced responsive derivatives.

Expected/final reported state:

```text
manifest entries resolved        = 38
products resolved                = 38
product_images                   = 38
hero rows                        = 38
existing DB media rows repaired  = 38
new logical rows created         = 0
derivative objects uploaded      = 532
missing derivatives              = 0
legacy processed /products paths = 0
broken Storage references        = 0
migration                        = idempotent
```

Preserving the existing derivatives was deliberate. B7 is an ownership migration, **not** the later image-performance optimization phase.

### Media delivery model

Database stores Storage object paths, for example:

```text
products/<product-id>/<media-id>/variants/640.webp
```

Database rows do not encode the delivery host as media authority.

The media delivery helper converts object paths into public `product-media` URLs. This keeps future CDN/delivery optimization independent from catalog ownership.

No-media fallback:

```text
/placeholder.svg
```

### Storage/admin security

Server-side media administration uses:

```text
SUPABASE_SECRET_KEY
```

Browser direct signed upload uses only:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Upload flow:

```text
admin Server Action
→ server validates admin/product/size/MIME
→ server generates mediaId + exact object path
→ signed upload token/path
→ browser uploadToSignedUrl()
→ finalize Server Action
→ server downloads bytes
→ Sharp validation
→ public.product_images row
→ catalog-public invalidation
```

Client cannot choose an arbitrary object namespace.

Allowed upload formats:

```text
JPEG
PNG
WebP
AVIF
```

SVG is rejected.

Maximum upload:

```text
10 MB
```

The server chooses path extension from accepted MIME at signed-upload request time.

### Finalize security invariant

All browser finalize input is untrusted.

Finalize verifies:

- product UUID;
- media UUID;
- exact bound namespace `products/<productId>/<mediaId>/original.<ext>`;
- path extension;
- product existence;
- actual downloaded byte size;
- actual image bytes through Sharp.

Required binding:

```text
path extension MIME
== declared MIME
== Sharp-decoded MIME
```

Mismatch is rejected, uploaded object cleanup is attempted, no DB media row is created, and no successful cache invalidation is reported.

Sharp-decoded format is authoritative for persisted MIME.

### Media error model

Expected user-correctable errors use typed errors:

```text
MediaValidationError
MediaDomainError
```

Unexpected PostgreSQL, Storage, network, or authorization-infrastructure failures are logged server-side and replaced with generic browser-safe errors.

Do not leak raw infrastructure/storage/database errors through Server Action responses.

### Hero/order invariants

At most one hero image per product is enforced with a DB partial unique index.

Hero switch is transactional:

```text
old hero clear
+ new hero set
```

Cross-product media IDs are rejected.

If current hero is deleted and another image remains, the lowest-position remaining image becomes hero transactionally.

Deleting the final image leaves the product with no media and public fallback becomes `/placeholder.svg`.

Reordering validates the **exact media ID set** and rejects duplicate input such as `[A, A, C]` before mutation.

### Delete ordering

Required behavior:

```text
1. remove PostgreSQL association transactionally
2. public catalog no longer references object
3. await Storage cleanup
```

All associated object paths are collected and deduplicated, including processed AVIF/WebP variants.

If Storage cleanup fails:

- DB deletion remains committed;
- public storefront remains safe;
- action returns success with a safe cleanup warning;
- server logs orphan cleanup requirement;
- do not restore a DB reference to missing/broken bytes.

### Next/Image scope

Accepted B7 `next.config.ts` allows the clean Supabase Storage media path only:

```text
/storage/v1/object/public/product-media/**
```

Do not broaden to arbitrary `*.supabase.co` image hosts.

Temporary Spree image compatibility may remain until B8/B9.

### Public catalog media

Public product media is sourced from `public.product_images` and supports:

```text
thumbnail_url
primary_media
media[]
product_media
mainUrl
responsive variants
LQIP
dominant color
```

Hero drives primary media. Multiple images are ordered by:

```text
position ASC
created_at ASC
```

Expected accepted B7 runtime state:

```text
production media manifest imports = 0
runtime static /products media authority = 0
```

Catalog performance must remain:

```text
warm queries = 0
cold queries = 4 bounded
N+1 = 0
```

### Order media snapshot

Order placement resolves current media from `public.product_images` inside the existing PostgreSQL order transaction.

No global pool lookup may be introduced inside `placeOrderFromCart` transaction.

Preferred snapshot thumbnail when available:

```text
320 WebP processed variant
```

No media:

```text
/placeholder.svg
```

The resulting URL is snapshotted into `order_items`; later media edits do not change historical orders.

### Cache invalidation

Successful media mutations invalidate:

```text
catalog-public
```

including:

- finalize upload;
- alt edit;
- hero change;
- reorder;
- delete.

Failed validation/mutation must not report a successful catalog mutation.

The Server Action boundary owns invalidation; the DAL does not.

### Admin media UI

The B7 product admin supports:

- upload;
- preview;
- alt text edit;
- set hero;
- move up/down;
- delete.

The UI is intentionally utilitarian. No storefront redesign and no generalized drag/drop media library was started.

### B7.2 validation baseline

Reported final accepted B7.2 validation:

```text
64 suites passed
643 tests passed
typecheck PASS
lint PASS
build PASS
113 generated pages
```

---

## 8. B7 final-preflight and production verification — RESOLVED & ACCEPTED

The final preflight and production verification were executed, authorized, and fully verified.

Result:

```text
B7 FINAL ACCEPTANCE: COMPLETE
MERGE COMMIT: e64631d90ef52bc7470f79b780cbe9dcb7e98aa2
DEPLOYMENT ID: dpl_FiDAYjzgYHKZaVXceMyb2BPfSHH9
PRODUCTION URL: https://mirzafootwear.vercel.app
```

### 8.1 Database credential rotation

Status:

```text
EXPLICITLY DEFERRED BY OPERATOR — NOT BLOCKING B8
```

The operator explicitly authorized proceeding with the current database password for now ("I am okay with it. You can just use that password. This is just fine for now..."). Clean database password rotation remains deferred operator housekeeping and is not a blocker for B8. No secrets are recorded or printed.

### 8.2 Vercel production environment

Completed. `SUPABASE_SECRET_KEY` was added to Vercel Production and Preview via Vercel CLI (`vercel env add SUPABASE_SECRET_KEY production,preview --sensitive`).

Active production environment:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_DB_CA_CERT_BASE64 (Secret)
DATABASE_URL (Secret)
SUPABASE_SECRET_KEY (Secret)
```

`SUPABASE_SECRET_KEY` remains server-only and is not emitted into browser bundles.

### 8.3 Admin profile demotion

Completed. Both disposable test profiles were safely demoted to `customer`:

```sql
UPDATE public.profiles SET role = 'customer' WHERE role = 'admin';
```

Clean project production admin profile count verified:

```text
admin profiles final = 0
```

### 8.4 Git merge and deployment

Completed.

1. Merged `origin/backend/b7-media` (`1e09b19c17315b7fb66395b94508052df50b1271`) into `main` (`6d630e4caef89c295bcec2cfbe0d51ea4b5b3d3a`) with `--no-ff`.
2. Final merged `main` commit: `e64631d90ef52bc7470f79b780cbe9dcb7e98aa2`.
3. Pushed to `origin/main`.
4. Deployed exact merged-main commit to Vercel Production (`dpl_FiDAYjzgYHKZaVXceMyb2BPfSHH9`, aliased to `https://mirzafootwear.vercel.app`).
5. Live production verification passed:
   - Homepage `/us/en`: 200 OK (10 Supabase Storage WebP images; 0 legacy `/products/` image paths)
   - PLP `/us/en/products`: 200 OK (13 Supabase Storage WebP images; 0 legacy `/products/` image paths)
   - PDP `/us/en/products/office-footwear-01`: 200 OK
   - Next/Image optimizer URL: 200 OK (`image/webp`)
   - Supabase Storage anonymous writes: strictly rejected by RLS
   - Admin routes: `/admin` customer/anonymous access rejected (intentional no-admin state)

No source change was required.

The executor removed its temporary audit scripts before stopping; no intentional application-code modifications were made during final preflight.

---

## 9. Performance program — accepted evidence and invariants

Detailed evidence:

```text
docs/PERFORMANCE-RESEARCH-LEDGER.md
docs/PERFORMANCE-PAPER-EVIDENCE.md
```

Accepted experimental sequence through P1/R012:

- R001 remove full media manifest from client JS — **KEEP STRONG**;
- R002 direct in-process catalog reads — **KEEP SIMPLIFICATION**; B6A later replaced static authority with the cached PostgreSQL read model;
- R003 granular PPR / remove root null Suspense — **KEEP STRONG**;
- R004 featured-products PPR stream abort fix — **KEEP correctness**;
- R005 static native ProductCarousel — **KEEP STRONG**;
- R006 direct prepared images — **REVERT; Next Image wins**;
- R007 render all products immediately — **REJECT** due mobile regression;
- R008 12 initial + one delayed remainder request — **KEEP STRONG**;
- R009 remove public category `connection()` — **KEEP**;
- R010 remove Speculation Rules — **KEEP**;
- R011 remove cart `router.refresh()` + pathname polling — **KEEP**;
- R012 / P1 exact responsive PDP hero prewarm — **KEEP STRONG**.

P1 SHA:

```text
7173c5d440d977a1dc0ec771c1fccd8a8b7a0ab
```

### Public storefront regression guards

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

Catalog invariant:

```text
warm snapshot DB queries = 0
cold snapshot DB queries = 4 bounded
N+1 = 0
```

Admin/media work must not place privileged/admin/write work onto anonymous storefront requests.

### P2 note

Older ledger wording for P2 described optimizing a generic SDK/static product-resolution path that existed during an earlier architecture stage.

Do **not** execute that old implementation recipe literally after the migration. B6/B7 changed the source-of-truth and read path substantially, and B8/B9/B10 will remove more compatibility machinery.

After backend migration is complete, re-profile the actual cold public PDP/data path and define the new P2 from evidence.

Do not create R-numbers for migration phases without controlled performance experiments.

---

## 10. Temporary compatibility seams remaining before B8/B9/B10

Temporary surfaces may still include:

- `@spree/sdk` imports/types;
- Spree-shaped compatibility DTOs;
- `/api/v3/store/[...spree]` compatibility BFF naming/shape;
- legacy `_spree_*` cookie names;
- payment/shipping/discount/gift-card/credit-card/country/state/market/wholesale-channel seams;
- temporary Spree image host compatibility;
- physical static media files/manifest retained only for migration/cleanup tooling.

These do **not** imply Spree owns auth/cart/order/catalog/media.

B8/B9/B10 own retirement of compatibility and legacy infrastructure unless a concrete earlier blocker requires otherwise.

---

## 11. Backend roadmap

```text
B1  persistence foundation                         COMPLETE
B2  real auth                                      COMPLETE
B3  persistent carts                               COMPLETE
B4  profiles + addresses                           COMPLETE
B5  orders + order history                         COMPLETE
B6A authoritative catalog + cached read model      COMPLETE
B6B first-party catalog admin                      COMPLETE
B7  first-party media management/publishing        COMPLETE
B8  remove Spree SDK / fake Spree BFF compatibility COMPLETE
B9  remove Render/Rails legacy                     COMPLETE
B10 cleanup / dead compatibility / naming/config   COMPLETE
```

**BACKEND MIGRATION COMPLETE.** There is no B11. Remaining work is the
post-migration product sequence in §13.

---

## 12. Immediate next executor run — FINAL UI IMPLEMENTATION

**Target:**
Complete the **editorial Mirza UI** on the post-migration first-party foundation.

Do **not** start Media Contract v1.
Do **not** start the final UX performance pass until the editorial UI is accepted.

### 12.0 Current UI state (2026-09-14)

Already landed on `main` past the B10 backend baseline:

```text
editorial-home.css                     new editorial homepage stylesheet
product-page.css                       new editorial PDP stylesheet
components/home/EditorialSections.tsx  craft / culture / closing editorial sections
components/products/CatalogHero.tsx    unified catalog hero
HeroSection, Header, Footer            typographic + layout refresh
ProductCarousel                        reworked native carousel
MediaGallery, VariantPicker, ProductCard  PDP editorial rework
public/editorial/*.webp                editorial imagery (several temporary-*.webp)
public/catalog-shoes/shoe-NN.webp      31 catalog images (31 files)
scripts/catalog/shoes-2026-09.json     31-shoe catalog manifest
```

### 12.1 Current catalog contract

The 38-product demo catalog is **superseded**. The live contract is now:

```text
categories = 2   (office-wear, traditional)
products   = 31  (shoe-2026-09-001 .. shoe-2026-09-031)
sizes      = 7 per product (UK/India 6,7,8,9,10,11,12)
media      = /catalog-shoes/shoe-NN.webp  (static, storefront/public)
```

Old identifiers that must no longer be used in docs or smoke tests:

```text
office-footwear-01, traditional-footwear-NN   (old demo product slugs)
categories/formal-office                      (old category permalink)
categories/traditional-indian                 (old category permalink)
38 products                                   (old demo catalog size)
```

Media delivery is **transitional**: `getStoragePublicUrl()` passes
root-relative paths through unchanged, so the new shoe catalog is served as
static assets from `storefront/public` while Supabase Storage `product-media`
remains the admin-managed byte authority for catalog-admin uploads. Resolving
this split is the Media Contract v1 item in §13.

### 12.2 Historical B10 scope (completed)

```text
- Dead compatibility removal (e.g. unused compatibility adapters, dead helpers);
- Legacy vendor naming cleanup (e.g. SPREE_WHOLESALE_CHANNEL, _spree_* cookie names, spree_country, spree_locale, src/lib/spree namespace, adaptDbOrderToSpree);
- Stale configuration cleanup (e.g. dead npm packages, unused devDependencies, stale tsconfig/eslint leftovers);
- Obsolete seed scripts and historical experiment artifacts cleanup where appropriate;
- Final repository polishing and documentation alignment.
```
3. Complete inventory/audit of `@spree/sdk`, `@spree/sdk/webhooks`, `@/lib/spree`, `getClient(`, `withAuthRefresh`, `getLocaleOptions`, `/api/v3/store`, `_spree_`, `SPREE_`, `SpreeError`.
4. Replace remaining `@spree/sdk` types with narrowly scoped local application types.
5. Auth compatibility removal: Supabase Auth authoritative, remove `getClient().auth.*`, `withAuthRefresh`, legacy Spree tokens.
6. Countries / states / markets: first-party store config.
7. Policies: first-party static/config implementation.
8. Sitemap: first-party catalog + market config.
9. Wholesale: local types, remove Spree BFF calls.
10. Gift cards / credit cards / dormant surfaces: safe first-party unsupported or explicit clean fallback.
11. Webhooks: audit and clean unused Spree webhooks.
12. Remove fake Store API BFF `storefront/src/app/api/v3/store/[...spree]/route.ts`.
13. Remove `@spree/sdk` package dependency and refresh lockfile.
14. Preserve accepted performance contract & B7 media architecture.
15. Full test matrix, typecheck, lint, build, and production smoke.

---

## 13. Locked project sequencing after B7

Do not interrupt the backend migration.

Sequence:

```text
B7 final merge + production verification          DONE
→ B8 remove Spree SDK / fake Spree BFF compatibility  DONE
→ B9 remove Render/Rails leftovers                DONE
→ B10 final migration cleanup                     DONE
→ BACKEND MIGRATION COMPLETE                      DONE
→ define Media Contract v1                        DONE (Phase 1 Foundation: media_assets + product_media)
→ ingest new ~31-shoe demo catalog                DONE (contract live; see 12.1)
→ deep image/data/navigation optimization         NOT STARTED
→ implement new editorial Mirza UI                IN PROGRESS
→ final UX-specific performance pass              NOT STARTED
```

### Sequencing deviation — record it, do not silently ignore it

The locked sequence above required Media Contract v1 and the optimization pass
to land *before* the editorial UI. That is **not** what happened: the ~31-shoe
catalog was ingested and the editorial UI was started first, on the existing B7
media path.

Consequences the next executor must carry:

- Product media currently resolves to static `/catalog-shoes/*.webp` files in
  `storefront/public` rather than Supabase Storage `product-media`.
- `storefront/public/editorial/` still contains `temporary-product-01..08.webp`,
  i.e. placeholder imagery shipped as real UI.
- Media Contract v1 is therefore **not** a greenfield design task; it must
  absorb the existing split (static path passthrough vs Storage authority)
  rather than assume a clean slate.
- The final UX performance pass has not measured the new editorial pages. Every
  R-series result in `PERFORMANCE-RESEARCH-LEDGER.md` predates them and must be
  re-validated rather than assumed to still hold.

Do **not** start Duke + Dexter / ME London-style cold-image optimization until
Media Contract v1 is defined.

Design exploration can happen separately, but it must not interrupt or
contaminate the migration branch sequence.

---

## 14. Known unrelated baseline

Cart Lighthouse SEO has a pre-existing low score around 0.63 versus a 0.90 assertion. Do not opportunistically fix it inside backend migration phases.

An uncoordinated cart SEO commit:

```text
06cce6a64f211ac0f53a72fe61726655f46cd52e
```

was previously rejected and reverted by:

```text
714b638e0c91910b34724cc65795cc8535200723
```

because it broke the Server/Client Component boundary.

---

## 15. Continuation checklist for a new planner/auditor

Read in this order:

1. `docs/ENGINEERING-CONTINUITY-LOG.md` (this file — reconciled onto `main` as of 2026-09-14);
2. `docs/PERFORMANCE-RESEARCH-LEDGER.md`;
3. `docs/PERFORMANCE-PAPER-EVIDENCE.md` when detailed experiment evidence is needed;
4. current GitHub `main` (head `6c504be`);
5. `docs/ARCHITECTURE.md` and `infra/README.md` for topology;
6. relevant auth/catalog/media DAL/actions/tests for the phase being audited.

Do not assume older `ARCHITECTURE.md`, old specification docs, or old performance execution queues describe the current migration state. Reconcile them only during the appropriate cleanup/documentation phase rather than letting stale docs override accepted source state.

### Documentation status (2026-09-14)

| Document | Trust level | Note |
|---|---|---|
| `docs/ENGINEERING-CONTINUITY-LOG.md` | Canonical | This file. |
| `docs/PERFORMANCE-RESEARCH-LEDGER.md` | Canonical for R-series | Header was stale; corrected. |
| `docs/PERFORMANCE-PAPER-EVIDENCE.md` | Research record | R001–R012 only; pre-editorial-UI. |
| `docs/ARCHITECTURE.md` | Current | Topology only; no phase state. |
| `infra/README.md` | Current | Topology + deployment. |
| `README.md`, `storefront/README.md` | Current | Rewritten 2026-09-14. |
| `storefront/CLAUDE.md` | Current | Conventions + invariants. |
| `docs/PERFORMANCE.md` | **Historical** | Experiments 001–008/018 predate the migration. |
| `docs/EXPERIMENTS.md` | **Historical** | 001–006 predate the migration; 005 superseded by R010. |
| `docs/BASELINE.md` | **Historical** | `baseline-v1`, Spree-era. |
| `docs/specifications/*.md` | **Historical** | Spree-era engineering specs. |

---

## 16. Rolling change log

### 2026-09-18 — Media Modernization Phase 4: Storefront Cutover to Media Contract v1 — IN REVIEW

- Branch: `feat/media-v1-storefront-cutover`
- Starting main: `a91e9316b9ad2635f51febb12539261809542a99` (incorporating Phase 3 Supabase stone migration)
- Status: Implemented, verified, pushed to origin; awaiting supervisor review (do NOT merge).
- Scope: Customer-facing read cutover to Media Contract v1 (`public.product_media` + `public.media_assets`), serving Supabase stone heroes, removing runtime product-image multiply blending, standardizing PDP stage color, guarding legacy admin media UI, and preserving rollback assets.
- Changes:
  1. **Customer Public Catalog Media Cutover (`storefront/src/lib/db/catalog.ts`)**:
     - Updated `loadPublicCatalogRows()` to aggregate media from `public.product_media pm JOIN public.media_assets ma ON ma.id = pm.media_asset_id`.
     - Preserved exact 4-query bounded parallel architecture with zero N+1 queries.
     - Implemented non-legacy preference filter: excludes `storage_provider = 'legacy_public'` assets whenever a product has non-legacy Media Contract assets, ensuring current canonical shoes render exactly one stone hero and no white duplicate image. Unmigrated products safely retain `legacy_public` fallback.
     - Carries `lqip`, `dominant_color`, dimensions, original filename, and MIME metadata into `DbCatalogProductImageJson` and `product_media` compatibility DTO.
  2. **Order Checkout Thumbnail Cutover (`storefront/src/lib/db/order.ts`)**:
     - Updated `createOrderFromCart()` checkout item snapshot subqueries to select `hero_storage_path` and `hero_variants` from `public.product_media pm JOIN public.media_assets ma ON ma.id = pm.media_asset_id`.
     - Ensures new orders snapshot the authoritative Supabase stone master URL into `order_items.thumbnail_url`.
     - Strictly preserves the historical snapshot invariant: 0 existing `order_items` rows were modified or rewritten.
  3. **Runtime `mix-blend-mode: multiply` Removal**:
     - Eliminated all 6 runtime multiply blend mode rules across 4 stylesheets (`storefront/src/app/cart-page.css`, `catalog-page.css`, `home-experiment.css`, `product-page.css`).
     - Product imagery now displays clean, baked `#ece7de` pixels directly without double-multiply darkening, edge halo, or browser compositing overhead.
  4. **Product Stage Color Standardization**:
     - Standardized `--pdp-stage` in `storefront/src/app/product-page.css` from `#ebe5dc` to canonical `#ece7de`, harmonizing PDP media stages with homepage (`--mirza-stage`), catalog (`--catalog-stage`), and cart/checkout (`--cart-stage`, `--checkout-stage`).
  5. **Legacy Admin Media UI Guard (`storefront/src/components/admin/ProductMediaManager.tsx`)**:
     - Disabled file upload input and mutation controls (Make Hero, Reorder, Delete, Alt Text Save).
     - Rendered prominent admin-only notice: *"Media management is being migrated to Media Library. Image modifications are temporarily disabled while storefront media reads are cut over to Media Contract v1."*
     - Protects live storefront from silent desynchronization while preserving product metadata/variant/category admin editing.
  6. **Zero Destructive Cleanup / Complete Rollback Preservation**:
     - `public.product_images` is 100% preserved (69 rows intact).
     - Static directory `storefront/public/catalog-shoes/` is 100% preserved on disk.
     - `legacy_public` rows in `media_assets` and `product_media` remain intact at position 1.
  7. **Comprehensive Test Suite (`storefront/src/lib/media/__tests__/storefront-media-cutover.test.ts`)**:
     - 9 automated unit and regression tests verifying:
       * Exactly 4 bounded queries during catalog load (0 N+1).
       * Canonical product heroes resolve to Supabase `media/{assetId}/original.webp`.
       * Non-legacy assets preferred; rollback duplicates excluded from gallery.
       * Legacy fallback preserved for unmigrated products.
       * Order thumbnail snapshots query Media Contract v1 hero without modifying historical orders.
       * 0 customer read paths depend on `product_images`.
       * 0 product imagery styles contain `mix-blend-mode: multiply`.
       * `--pdp-stage` equals `#ece7de`.
       * Admin media UI disables mutations with migration banner.
     - Updated `catalog-parity.test.ts` to assert Supabase stone hero resolution while verifying disk rollback file existence.
- Validation:
  * TypeScript `tsc --noEmit`: 0 errors
  * Biome lint: 0 errors, 0 warnings (347 files checked)
  * Vitest full test suite: 68 test files / 745 tests passing (100% pass)
  * Next.js production build: 101 routes compiled successfully (0 errors)
  * Storefront client JS impact: 0 bytes
  * Warm cache query count: 0 database queries (`catalog-public` cache tag preserved)

### 2026-09-18 — Media Modernization Phase 3: Supabase Stone-Asset Migration — MERGED

- Branch: `feat/stone-media-supabase-migration`
- Merged-main SHA: `a91e9316b9ad2635f51febb12539261809542a99`
- Starting main: `d632ee50899e75a5a66f6a1b1d1491f75cc067a7` (incorporating Phase 2 stone master pipeline)
- Status: Accepted by supervisor and merged into main.
- Scope: Supabase Storage upload of the 31 stone-baked master WebPs, creation of deterministic `media_assets` rows, canonical `product_media` hero associations, preservation of legacy rollback assets, and zero modification to `public.product_images`.
- Changes:
  1. **Operational Migration Script (`storefront/scripts/migrate-stone-media-to-supabase.ts`)**:
     - Idempotent CLI script with dry-run default, `--apply`, and `--rollback` modes.
     - Deterministic asset UUID generation via RFC 4122 v5 over `productSlug:sha256` under fixed Mirza media namespace (`e8c07e26-f762-4b71-b0e6-54a7c0618031`).
     - Uploads to Supabase Storage bucket `product-media` under canonical namespace `media/{assetId}/original.webp`. Avoids blind overwrites; verifies existing files and halts on hash collisions.
     - Performs public HTTP 200 GET verification across all 31 objects, checking `image/webp` content type, exact byte length, and SHA-256 hash match without session credentials.
     - Executes atomic PostgreSQL transaction: demotes legacy `legacy_public` assets to non-hero (`position = 1, is_hero = false`), inserts 31 new stone `media_assets` (`storage_provider = 'supabase'`), and attaches them as the new heroes in `product_media` (`position = 0, is_hero = true`).
     - Emits local operational evidence manifest `artifacts/media-v1/supabase-stone-migration.json` (gitignored).
     - Idempotent second run verified: post-migration dry-run detects 31/31 storage objects present and 31/31 database associations complete, proposing 0 uploads and 0 database updates.
     - Rollback dry run verified: correctly targets strictly the 31 migration-created assets without touching demo or user media.
  2. **Zero Storefront Read Path Modification**:
     - `public.product_images` was completely untouched (remains 69 rows).
     - Storefront catalog queries continue reading `/catalog-shoes/shoe-NN.webp` with zero runtime disruption.
  3. **Automated Vitest Regression Suite (`storefront/src/lib/media/__tests__/stone-media-migration.test.ts`)**:
     - 10 automated unit tests covering deterministic UUID v5 generation, canonical slug filtering (excluding archived demo products), storage idempotency and collision halting, hero state transition, and safe rollback targeting.
- Validation:
  * TypeScript `tsc --noEmit`: 0 errors
  * Biome lint: 0 errors, 0 warnings (347 files checked)
  * Vitest full test suite: 67 test files / 736 tests passing (100% pass)
  * Next.js production build: 101 routes compiled successfully
  * Storefront client JS impact: 0 bytes
  * Storefront query impact: 0 queries (all customer flows continue reading `product_images`)

### 2026-09-18 — Media Modernization Phase 2: Final Stone Product Master Pipeline — MERGED

- Branch: `feat/stone-media-pipeline`
- Merged-main SHA: `d632ee50899e75a5a66f6a1b1d1491f75cc067a7`
- Starting main: `10a027df4154dee0a4ec715aa8e478a3f3964ce8`
- Status: Accepted by supervisor and merged into main.
- Scope: Deterministic offline pipeline producing final Mirza 31-product candidate images with canonical stone background (`#ece7de`) baked directly into the pixels.
- Changes:
  1. **Deterministic Preparation Pipeline (`scripts/catalog/prepare-stone-shoe-images.mjs`)**:
     - Reads canonical 31-product manifest `scripts/catalog/shoes-2026-09.json` and matches 1:1 against original high-resolution studio PNGs in `Shoes/`.
     - Strictly enforces count = 31, fails on missing or duplicate source file mappings.
     - Normalizes EXIF orientation, applies 1200×1200 contain resize on `#ffffff`, and composites onto 1200×1200 `#ece7de` stone canvas via libvips `blend: "multiply"`.
     - Encodes output as 3-channel RGB WebP (`hasAlpha: false`, quality 84, effort 5) to `artifacts/media-v1/stone-catalog/shoe-01.webp` through `shoe-31.webp`.
     - Validates corner pixels of all 31 outputs against `#ece7de` [236, 231, 222] (max delta $\le 6$ due to lossy WebP quantization).
     - Generates machine-readable manifest `artifacts/media-v1/stone-catalog/manifest.json` mapping all 31 products (`shoe-2026-09-001` to `031`) with SHA-256 digests.
     - Determinism verified: repeated execution produces 100% identical SHA-256 digests across all 31 assets.
  2. **Visual Equivalence Contact Sheet**:
     - Generates `artifacts/media-v1/stone-catalog/visual-comparison-contact-sheet.webp` comparing representative samples (`shoe-01`, `shoe-08`, `shoe-16`, `shoe-24`, `shoe-31`).
     - Column A: Old white image composited with CSS-like multiply on `#ece7de`.
     - Column B: Newly baked stone image rendered normally.
     - Measured average pixel delta across 1.44M pixels: 0.791 (`shoe-01`), 1.541 (`shoe-08`), 1.125 (`shoe-16`), 1.146 (`shoe-24`), 1.018 (`shoe-31`). Visual fidelity is identical; zero halo, intact shadows, preserved leather and croc textures.
  3. **Runtime `mix-blend-mode: multiply` Audit Recorded**:
     - Audited and documented all 6 runtime CSS multiply locations across 4 stylesheets (`home-experiment.css`, `catalog-page.css`, `cart-page.css`, `product-page.css`) for the Phase 3/4 cutover. No storefront CSS was modified in Phase 2.
  4. **Byte Efficiency**:
     - Old total: 2,956,078 bytes (~2.96 MB, median: 104,954 bytes).
     - New total: 2,788,516 bytes (~2.79 MB, median: 98,584 bytes).
     - Net change: **-5.67% (-167,562 bytes)** with baked stone background.
  5. **Automated Vitest Regression Suite (`storefront/src/lib/media/__tests__/stone-media-pipeline.test.ts`)**:
     - 13 comprehensive tests covering 31 manifest items, 1:1 source mapping, duplicate/missing error handling, output dimensions/format/alpha, corner background validation, determinism, contact sheet generation, and byte regression safety.
- Validation:
  * TypeScript `tsc --noEmit`: 0 errors
  * Biome lint: 0 errors, 0 warnings (345 files checked)
  * Vitest full test suite: 66 test files / 726 tests passing (100% pass)
  * Next.js production build: 101 routes compiled successfully
  * Storefront client JS impact: 0 bytes
  * Database/Supabase impact: 0 changes (pure offline pipeline; no live data touched)

### 2026-09-18 — Media Contract v1 Phase 1: Foundation — MERGED

- Branch: `feat/media-contract-v1`
- Merged-main SHA: `10a027df4154dee0a4ec715aa8e478a3f3964ce8`
- Starting main: `b1920b1dac6d75bae2c567f110c87aba56add304`
- Status: Accepted by supervisor and merged into main.
- Scope: Foundation of Media Contract v1 establishing new media data & storage contract underneath existing application.
- Changes:
  1. **Additive PostgreSQL Migration (`20260918000000_media_contract_v1.sql`)**:
     - Created `public.media_assets`: physical storage metadata decoupled from product assignments (`storage_provider`, `storage_path`, `width`, `height`, `dominant_color`, `lqip`, `processed_variants`, `byte_size`, `mime_type`, `original_filename`). Unique constraint on `(storage_provider, storage_path)`.
     - Created `public.product_media`: join/relationship table mapping products to media assets with display order and hero designation. Partial unique index on `(product_id) WHERE is_hero = true` enforces exactly one hero per product. Foreign key to `media_assets` uses `ON DELETE RESTRICT` to prevent accidental orphaned references. Foreign key to `products` uses `ON DELETE CASCADE`. Deterministic ordering index on `(product_id, position ASC, created_at ASC)`.
     - RLS enabled on both tables with `anon` and `authenticated` access strictly revoked; accessible solely via `service_role` (Server-authoritative).
     - Idempotent historical backfill populates `media_assets` and `product_media` from existing `public.product_images` (69 rows: 31 `legacy_public`, 38 `supabase`). Preserved `public.product_images` untouched for zero-downtime rollback safety.
  2. **Server-Only Data Access Layer (`storefront/src/lib/db/media-v1.ts`)**:
     - Enforced `server-only` import boundary.
     - Implemented complete lifecycle operations: `createMediaAsset`, `getMediaAsset`, `listMediaAssets`, `deleteMediaAsset` (with `ON DELETE RESTRICT` error handling), `getMediaAssetUsage` (single bounded query, no N+1), `listProductMediaV1`, `attachMediaToProduct`, `detachMediaFromProduct` (with automatic hero promotion when hero is detached), `setProductHeroMedia`, and `reorderProductMediaV1`.
  3. **Documentation & Architecture Guide (`docs/MEDIA-CONTRACT-V1.md`)**:
     - Defined physical asset metadata contract, join semantics, transactional hero guarantees, future canonical storage namespace (`media/{assetId}/original.{ext}` and `media/{assetId}/variants/{name}.webp`), transitional providers (`legacy_public` and `supabase`), and migration sequence through Phase 4.
  4. **Automated Test Suite (`storefront/src/lib/db/__tests__/media-v1.test.ts`)**:
     - 24 comprehensive unit tests verifying schema invariants, CRUD, single-hero enforcement, hero auto-promotion on detach, RESTRICT on delete in use, multi-product reuse, deterministic ordering, and server-only isolation.
- Validation:
  * TypeScript `tsc --noEmit`: 0 errors
  * Biome lint: 0 errors, 0 warnings (344 files checked)
  * Vitest full test suite: 65 test files / 713 tests passing (100% pass)
  * Next.js production build: 101 routes compiled successfully
  * Storefront client JS impact: 0 bytes
  * Storefront query impact: 0 queries (all existing storefront flows continue reading `product_images`)

### 2026-09-18 — Mirza Order Confirmation Email & Media/Typography Fidelity — MERGED

- Accepted branch: `feat/order-confirmation-email`
- Implementation commit: `67adec2df18e7552d5f53babf4058249de9f9367`
- Fidelity & Media fix commit: `c390101a13766655f88d11ebbaee3a98f2a0df0c`
- Merged-main SHA: `d70cd44007873746d60cc041ffca4b67d023d7ae`
- Starting main: `01b1c6975d26a62625a6bb62f1d72bc96e08ce48`
- Resolution summary:
  1. **Order Confirmation Email workflow**: Implemented Mirza transactional order confirmation email via React Email and Resend triggered on successful checkout placement in `storefront/src/lib/data/payment.ts`. Non-blocking background delivery scheduled via `next/server after()`, ensuring 0ms checkout latency impact. Error isolation ensures Resend transport/API failures never fail the checkout transition. Deterministic idempotency key (`order-confirmation/<order-id>`) prevents duplicate delivery.
  2. **Email Media Asset Resolution**: Added `resolveEmailAssetUrl` server boundary resolver. Resolves transitional root-relative paths (`/catalog-shoes/shoe-NN.webp`) to fully qualified canonical URLs (`https://mirzafootwear.vercel.app/catalog-shoes/shoe-NN.webp`), prevents localhost URLs from escaping into outbound emails, and cleanly renders placeholders for null thumbnails. Fixed stale test CLI Supabase storage URL to exercise canonical catalog shoes.
  3. **Typography Fidelity & Progressive Enhancement**: Enhanced email typography with Mirza storefront font stacks (`"Cormorant Garamond", Georgia, "Times New Roman", serif` for brand display and grand total; `"EB Garamond", Georgia, "Times New Roman", serif` for editorial body copy; `Geist, Arial, Helvetica, sans-serif` for labels, order metadata, line items, and pricing). Progressive enhancement via Google Fonts `@import` inside `<Head><style>` allows modern clients (Apple Mail) to render custom fonts while ensuring resilient, clean rendering in Gmail and Outlook without web fonts.
- Post-merge validation:
  * TypeScript `tsc --noEmit`: 0 errors
  * Biome lint: clean (342 files checked, 0 errors)
  * Vitest full test suite: 64 test files / 689 tests passing (100% pass)
  * Next.js production build: 101 routes compiled successfully
  * Real Resend delivery verified: `01a0b4c1-1733-7581-96cf-735937468d7c`

### 2026-09-18 — Cross-device motion inconsistency — FIXED

- Accepted branch: `diagnose/reduced-motion-policy`
- Accepted SHA: `28e215102d38d3f600b4da05877431a57451269c`
- Merged-main SHA: `a7878d798e9fe46ae97d10cf716070d1d1bc1a24`
- Starting main: `20a9fd6859b6f1fcee9738cb7169cd1d0ef7a09b`
- Root cause: prefers-reduced-motion policy was overly broad
- Resolution summary:
  1. **Overly broad CSS rule refactored**: Removed blanket `.mirza-home *, body:has(...) .editorial-header * { animation: none; transition: none; }` from `home-experiment.css`. Replaced with targeted suppression of large transforms (`.product-card:hover .product-card__image img { transform: none; }`), keeping restrained color/opacity/navigation transitions functional.
  2. **Calm, intentional splash lifecycle**: Replaced immediate hydration disappearance in `BrandSplashOverlay.tsx` with intentional ~900ms static presentation (`exitDelay = 650ms`, `unmountDelay = 900ms`, `transition: opacity 0.25s ease`), eliminating the jarring flash-and-disappear bug while maintaining immediate scroll-lock release.
  3. **Dedicated Playwright regression suite added**: Added `e2e/reduced-motion-policy.spec.ts` verifying both `no-preference` and `reduce` media emulation at 1440x900 desktop viewport (Lenis vs native scrolling, parallax dynamic vs static transforms, footer reveal vs static layout, ambient carousel auto-glide vs stationary).
- Post-merge validation:
  * TypeScript `tsc --noEmit`: 0 errors
  * Playwright reduced motion suite (`reduced-motion-policy.spec.ts`): 2/2 passing
  * Playwright full suite: 15/15 passing
  * Vitest test suite: 63 test files / 664 tests passing
  * Next.js production build: 99 pages compiled successfully

### 2026-09-17 — P0 splash reload scroll-lock regression — FIXED

- Accepted branch: `audit/ui-regression-splash`
- Accepted SHA: `c2fd722d6b5446714527b770a4979c2b35ad8445`
- Merged-main SHA: `ab2ce2bb2c6a8e6cf3cca8db1ca4451745a2b055`
- Starting main: `0dda7f700cb26e67f9d77a99dcb4c0d3d018073f`
- Resolution summary:
  1. **Dual-clock race eliminated**: Deleted independent `@keyframes mirza-splash-field` from `editorial-home.css`. `BrandSplashOverlay.tsx` is the sole lifecycle authority; it clears the dataset scroll lock selector (`data-mirza-splash="first" -> "seen"`) at dismissal start (2050ms, or immediately on `prefers-reduced-motion`) and transitions opacity smoothly via `.mirza-splash--exiting` before unmounting. Invariant enforced: if the splash is visually gone, the scroll lock must already be gone.
  2. **Imperative overflow cleanup removed (0 count)**: Removed all calls to `document.documentElement.style.removeProperty("overflow")`. Declarative CSS selector `html[data-mirza-splash="first"] { overflow: hidden; }` is the sole owner, preventing accidental clearing of modal/drawer scroll locks.
  3. **Real user-scroll regression added**: Added Playwright test verifying real `page.mouse.wheel(0, 500)` scroll completes immediately on reload (`< 2000ms`, measured ~150ms post-hydration tick) and after first-visit splash completion.
  4. **`suppressHydrationWarning` reverted**: Removed from category `<nav>` in `layout.tsx`. Documented independent Radix UI Dialog / `data-aria-hidden` attribute injection finding during mobile dialog interactions.
- Post-merge validation:
  * TypeScript `tsc --noEmit`: 0 errors
  * Playwright focused splash regression suite (`splash-regression.spec.ts`): 5/5 passing
  * Editorial UI regression audit suite (`editorial-ui-regression-audit.spec.ts`): 6/6 passing

### 2026-09-14 — Documentation reconciliation + editorial UI phase in progress

Recorded:

- No application code changed; this is a documentation reconciliation pass.
- `main` head advanced to `6c504be`, 12 commits past the B10 backend baseline
  (`3367ea2`). All 12 are FINAL UI IMPLEMENTATION work.
- Re-measured validation baseline: **62 suites / 662 tests passing**, `tsc
  --noEmit` clean, Biome lint clean. (B10 baseline was 61 / 660.)
- Catalog contract changed and docs were stale about it: the 38-product demo
  catalog is superseded by **31 shoes** (`shoe-2026-09-001..031`) across
  **2 categories** (`office-wear`, `traditional`), 7 sizes each, with static
  media at `/catalog-shoes/shoe-NN.webp`. Old slugs and category permalinks in
  §1 production-smoke notes are now wrong and were left in place only inside
  the historical B10 entry.
- Sequencing deviation recorded in §13: the ~31-shoe catalog was ingested and
  the editorial UI was started **before** Media Contract v1 and the
  image/data optimization pass, contrary to the locked post-B7 sequence.
- Corrected stale phase state: §7 `B8 = NEXT`, §11 `B10 = NEXT`, and §12
  "immediate next executor run = B10" all described superseded state.
- `storefront/README.md`, `storefront/.env.example` and
  `storefront/.env.local.example` all documented
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the code reads
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. **All three corrected.** Also added
  the missing `SUPABASE_DB_CA_CERT_BASE64` to both example files — strict TLS
  requires it and it was undocumented.
- Marked `docs/PERFORMANCE.md`, `docs/EXPERIMENTS.md`, `docs/BASELINE.md` and
  `docs/specifications/*.md` as historical with banners, and refreshed the
  `PERFORMANCE-RESEARCH-LEDGER.md` header/queue which still described a
  retained Spree BFF and a B2-under-audit state.
- Rewrote root `README.md`, refreshed `docs/ARCHITECTURE.md` and
  `infra/README.md`, and extended `storefront/CLAUDE.md`.

Dead-code cleanup performed in this pass (2026-09-14):

```text
- Removed 33 lines of inert .swiper-* rules from src/app/globals.css.
  Verified: ProductCarousel now uses product-carousel / product-carousel__item
  and no .swiper-* class is referenced anywhere in src/.
- Removed the images.unsplash.com entry from remotePatterns in next.config.ts.
  Verified: zero unsplash references in src/, e2e/, scripts/, perf/, public/.
- Both changes verified: 62 suites / 662 tests, tsc --noEmit clean,
  biome lint clean. src/ is byte-identical otherwise.
```

Known open defects not fixed in this pass:

```text
1. swiper ^12.1.2 remains in storefront/package.json although no file imports
   it. Removing it requires a lockfile regen (pnpm remove swiper) and was
   deliberately not done in a documentation pass.
2. src/components/performance/SpeculationRules.tsx is dead code (R010 removed
   the injection; the component was never deleted). It has zero importers
   anywhere in src/, e2e/ or config, and is safe to delete.
3. .next build was not re-run to completion (two attempts, ~15-18 min each,
   network-bound static generation; the sandbox also blocked Next's cleanup of
   .next/trace). Total page count for the 31-product catalog is therefore
   unverified. The last accepted figure is 106 pages at B10; since the catalog
   went 38 -> 31 products the expected total is ~99, but that is derived, not
   measured. Re-run `pnpm build` to confirm before quoting.
4. scripts/images/manifest.json still describes the retired demo catalog
   (office-footwear-01, traditional-footwear-*). It is ingest input for the old
   asset set and is now stale relative to the 31-shoe catalog.
```

Pre-rendered route parameters are verifiable from code without a build:

```text
PDP      generateStaticParams -> 31 params (31 products x default country/locale)
Category generateStaticParams ->  2 params (office-wear, traditional)
```

Next action: continue FINAL UI IMPLEMENTATION. Do not start Media Contract v1
or the final performance pass until the editorial UI is accepted.

### 2026-09-13 — B10 complete: Final migration cleanup, neutral naming & backend migration complete

Recorded:

- B10 CODE: COMPLETE
- B10.1 SEMANTIC CLOSURE: COMPLETE (`5d858a1fe6aff98479eda39baa3305ae8d208104`)
- B10 MERGED: COMPLETE (`3367ea2f05fac795cc8df616d4e7a4b59859ef7e`)
- B10 DEPLOYED: COMPLETE (`dpl_9vTuvjoiNtThD93xSSDpMb4aZxGB`)
- B10 PRODUCTION VERIFIED: COMPLETE (`https://mirzafootwear.vercel.app`)
- BACKEND MIGRATION COMPLETE
- Starting main: `cd4d99bc17c59ba20e8c0626c22a0ad64eb1f128` (B9 application merge `8fb4af3cbc2b42cde4896e4627689c71e0a56c34`, production verified)
- Branch: `backend/b10-final-migration-cleanup`
- B10.1 accepted SHA: `5d858a1fe6aff98479eda39baa3305ae8d208104`
- B10 merge SHA: `3367ea2f05fac795cc8df616d4e7a4b59859ef7e`
- Vercel Deployment ID: `dpl_9vTuvjoiNtThD93xSSDpMb4aZxGB`
- Deployed Application SHA: `3367ea2f05fac795cc8df616d4e7a4b59859ef7e`
- Scope: complete removal of internal Spree compatibility layer, neutral first-party naming, seamless cart cookie migration bridge, removal of obsolete static assets, uninstallation of dead payment packages, and configuration cleanup.

1. Cookie migration bridge (`src/lib/storefront/legacy-cookie-migration.ts`):
   - Preserves existing carts exactly: reads `_mirza_cart_*` first, falls back to legacy `_spree_*`, copies existing tokens/IDs, and defensively expires legacy cookies when writable.
   - Preserves existing guest bearer tokens without recreating or re-hashing them.
   - Isolates all legacy cookie literals (`_spree_cart_token`, `_spree_cart_token_id`, `_spree_wholesale_cart_token`, `_spree_wholesale_cart_token_id`, `spree_country`, `spree_locale`, `_spree_jwt`, `_spree_refresh_token`) strictly to `legacy-cookie-migration.ts` and its dedicated test suite.
   - Neutral cookie names established: `_mirza_cart_token`, `_mirza_cart_id`, `_mirza_wholesale_cart_token`, `_mirza_wholesale_cart_id`, `mirza_country`, `mirza_locale`.
   - Legacy auth cookies (`_spree_jwt`, `_spree_refresh_token`) are strictly expired without migrating into Supabase Auth.
   - B10.1 semantic closure: eliminated cart cookie namespace mixing via atomic `resolveCartCookieState` (zero cross-contamination between `_mirza_*` and `_spree_*`).

2. Supabase Auth sole authority:
   - Completely deleted legacy JWT authentication helpers and endpoints.
   - `isAuthenticated()`, account/session checks, and wholesale protected operations use verified Supabase server-side identity (`getVerifiedUserId` / `getClaims`).
   - Ordinary public catalog requests incur zero auth overhead.

3. Removed dead catalog auth cache dimension:
   - Eliminated dead `getAccessToken() -> userToken` argument from `cachedListProducts`, `getProducts`, `cachedGetProduct`, `getProduct`, `cachedGetProductFilters`, `getProductFilters`, and category equivalents.
   - Preserved only real cache dimensions: surface, locale/country, filters/query, product identity, catalog tags.
   - Public catalog remains: warm = 0 DB queries, cold = bounded 4 queries, N+1 = 0.

4. Unsupported compatibility UI deleted after reachability tracing:
   - Deleted dead credit cards and gift cards pages and components (`credit-cards/page.tsx`, `gift-cards/page.tsx`, `CreditCardList.tsx`, `GiftCardList.tsx`, `lib/data/credit-cards.ts`, `lib/data/gift-cards.ts`).
   - Removed dead payment gateway utility files `src/lib/utils/stripe.ts` and `src/lib/utils/payment-gateway.ts`.
   - Removed unused icons from `PaymentInfo.tsx`, preserving stored order snapshot presentation with standard Lucide icons.
   - Uninstalled 5 unused gateway packages from `storefront/package.json`: `@adyen/adyen-web`, `@paypal/react-paypal-js`, `@stripe/react-stripe-js`, `@stripe/stripe-js`, `react-svg-credit-card-payment-icons`. Cleaned lockfile (16 packages removed).

5. Obsolete static assets & seed scripts removed:
   - Verified 0 references to `/products/...` in production database `product_images` (all 38 items use Supabase Storage derivatives).
   - Deleted `storefront/public/products/` and `storefront/public/spree.png`.
   - Deleted obsolete backend seed scripts `scripts/seeds/seed_catalog.mjs`, `scripts/seeds/seed_new_catalog.mjs`, and `scripts/seeds/` directory.
   - Deleted `storefront/src/lib/media/manifest.json` and `storefront/src/lib/media/__tests__/migration.test.ts`.

6. Neutral first-party namespace (`src/lib/storefront/`):
   - Completely deleted `src/lib/spree/` directory.
   - Created first-party modules: `surface.ts`, `config.ts`, `locale.ts`, `cookies.ts`, `middleware.ts`, `legacy-cookie-migration.ts`.
   - Renamed `createSpreeMiddleware` -> `createStorefrontMiddleware`, `SpreeMiddlewareConfig` -> `StorefrontMiddlewareConfig`.
   - Renamed `adaptDbOrderToSpree` -> `adaptDbOrderToCommerceOrder`.
   - Renamed `adaptDbCartToSpreeCart` -> `adaptDbCartToCommerceCart`.
   - Renamed `adaptDbAddressToSpree` -> `adaptDbAddressToCommerceAddress`.
   - Discarded dead Spree wrappers (`SpreeNextConfig`, `SpreeNextOptions`, `getCartOptions`, `spreeToken`).

7. Operational environment & docs cleanup:
   - Removed stale operational references: `SPREE_WHOLESALE_CHANNEL`, `SPREE_WHOLESALE_PUBLISHABLE_KEY`, `SPREE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
   - Established neutral `WHOLESALE_CHANNEL=wholesale`.
   - Updated `storefront/CLAUDE.md`, `storefront/README.md`, and root `README.md` for first-party architecture.
   - Preserved genuine historical material in ledger, paper evidence, perf, and continuity records.

8. Comprehensive architectural audits passing:
   - B10 (`b10-architecture-audit.test.ts`): 22/22 invariants passing
   - B9 (`b9-architecture-audit.test.ts`): 21/21 invariants passing
   - B8 (`b8-architecture-audit.test.ts`): 18/18 invariants passing
   - Full test suite: 61 suites / 660 tests passing (100%).

9. Verification & production smoke totals:
   - TypeScript `tsc --noEmit`: 0 errors;
   - Biome lint: 0 errors, 0 warnings (320 files checked);
   - Vitest: 61 test suites / 660 tests passing (100%);
   - Playwright first-party smoke: 2 passed / 2 total (100%);
   - Next.js production build: 106 static pages successfully compiled;
   - Vercel production deployment: `dpl_9vTuvjoiNtThD93xSSDpMb4aZxGB` (READY);
   - Live smoke: homepage (200), PLP (200, 38 catalog shoes), PDP (200), Supabase media delivery (`product-media`), 0 Spree/Render/Rails traffic;
   - Live legacy-cookie migration: tested with legacy `_spree_cart_token` and `_spree_cart_token_id`; verified first-party copy to `_mirza_cart_token` and `_mirza_cart_id`, with immediate expiration of legacy cookies;
   - Live mixed-state isolation: verified legacy `_spree_cart_token` is expired without contaminating `_mirza_cart_id` namespace;
   - Live auth distrust: verified `_spree_jwt` is not accepted for protected routes (`/account/orders` redirects to login) and legacy auth cookies are expired;
   - S8 performance invariant: warm visitor has 0 `Set-Cookie` headers;
   - Next phase: FINAL UI IMPLEMENTATION. (Do not start Media Contract v1 or performance optimization until requested).

### 2026-09-13 — B9 complete: Render / Rails / Spree backend infrastructure removed & verified

Recorded:

- B9 CODE: COMPLETE
- B9 MERGED: COMPLETE (`8fb4af3cbc2b42cde4896e4627689c71e0a56c34`)
- B9 DEPLOYED: COMPLETE (`dpl_E4ZRX6HF6WJaJK8zqzHs9527p38x`)
- B9 PRODUCTION VERIFIED: COMPLETE (`https://mirzafootwear.vercel.app`)
- Starting main: `438832f2dae3904de3bc4aa44fd43cacae95e0e0`;
- Branch: `backend/b9-render-rails-cleanup`;
- B9 implementation SHA: `6c580d42a535397ada00a92d937c250b01448e5b`;
- B9 merge SHA: `8fb4af3cbc2b42cde4896e4627689c71e0a56c34`;
- Deployment ID: `dpl_E4ZRX6HF6WJaJK8zqzHs9527p38x`;
- Scope: complete removal of operational Render, Ruby on Rails, and Spree-backend operational infrastructure;
- Removed operational infrastructure:
  * `storefront/next.config.ts`: removed `spreeImagePatterns()`, `SPREE_IMAGES_URL`, `SPREE_API_URL`, `/rails/active_storage/**`, `transpilePackages: ["@spree/sdk"]`, and `dangerouslyAllowLocalIP: true`;
  * `storefront/src/components/layout/DocumentShell.tsx`: removed `spreeApiOrigin` derivation and Spree `<link rel="preconnect">` / `<link rel="dns-prefetch">` elements;
  * `storefront/Dockerfile`: removed `SPREE_API_URL` and `SPREE_PUBLISHABLE_KEY` build arguments and legacy comments, leaving generic standalone Next.js container;
  * `.github/workflows/lighthouse-ci.yml`: removed `SPREE_API_URL` and `SPREE_PUBLISHABLE_KEY` environment overrides from the storefront build step;
  * `storefront/.env.example` & `.env.local.example`: removed legacy `SPREE_API_URL` and `SPREE_PUBLISHABLE_KEY` lines, added first-party PostgreSQL `DATABASE_URL` and Supabase variables;
  * `storefront/e2e-backend/`: deleted entire directory (`docker-compose.yml`, `.env`);
  * `storefront/scripts/e2e/`: deleted `bootstrap-spree.sh` and `dev-with-env.sh`;
  * `storefront/package.json`: removed `e2e:up` and `e2e:down` scripts, uninstalled `@spree/cli` devDependency;
  * `storefront/e2e/checkout.spec.ts`: deleted retired Spree/Stripe container integration test;
  * `storefront/playwright.config.ts`: redirected `webServer.command` to `pnpm run dev`;
  * `storefront/e2e/storefront-smoke.spec.ts`: created lightweight first-party storefront smoke E2E test;
  * `storefront/.github/workflows/ci.yml`: deleted inactive nested Spree CI workflow;
  * `storefront/README.md`: updated local development setup instructions for first-party PostgreSQL and Supabase;
  * `infra/README.md` & `docs/ARCHITECTURE.md`: updated operational architecture documentation and topology diagram to describe first-party Next.js App Router, Supabase Auth, Supabase Storage, and PostgreSQL architecture;
- Guard tests:
  * Added `storefront/src/lib/__tests__/b9-architecture-audit.test.ts` (21 assertions across 7 suites) enforcing zero operational references to `SPREE_API_URL`, `SPREE_PUBLISHABLE_KEY`, `SPREE_IMAGES_URL`, `/rails/active_storage`, `@spree/sdk` in next.config, preconnects, and e2e-backend / bootstrap-spree;
  * Preserved `storefront/src/lib/__tests__/b8-architecture-audit.test.ts` (18 assertions across 2 suites);
- Verification on merged main:
  * TypeScript `tsc --noEmit`: 0 errors;
  * Biome lint: 0 errors, 0 warnings (330 files checked);
  * Vitest: 61 test suites / 627 tests passing (100%);
  * Playwright first-party smoke: 2 passed / 2 total (100%);
  * Next.js production build: 110 static pages successfully compiled;
- Production Smoke & Network Verification:
  * Live URL: `https://mirzafootwear.vercel.app`
  * Homepage: HTTP 200, brand navigation rendered, zero Spree preconnect links;
  * PLP (`/us/en/products`): HTTP 200, 12 initial products + remainder intact, zero Active Storage links;
  * PDP (`/us/en/products/office-footwear-01`): HTTP 200, Supabase Storage product image, add-to-cart button intact;
  * Cart (`/us/en/cart`): HTTP 200;
  * Sitemap (`/sitemap/0.xml`): HTTP 200;
  * 0 requests to legacy Spree API, 0 to `/api/v3/store`, 0 to `mirza-spree-backend.onrender.com`, 0 Active Storage URLs;
- Security & Performance Invariants:
  * Strict database TLS (`rejectUnauthorized: true`) fully preserved across all application code;
  * Zero browser-visible database secrets or service-role keys;
  * Supabase Storage `product-media` remote pattern strictly preserved;
  * Warm catalog snapshot: 0 DB queries; cold catalog snapshot: bounded 4 queries; PLP 12 + remainder; P1 PDP prewarm preserved; S8 cart behavior preserved;
- B10 Deferred Boundary:
  * `SPREE_WHOLESALE_CHANNEL`, `_spree_*` cookies, `spree_country`, `spree_locale`, and `src/lib/spree/` namespace intentionally deferred to B10;
- Status: B9 COMPLETE AND VERIFIED IN PRODUCTION;
- Next phase: B10 — cleanup / dead compatibility / naming / stale config.

### 2026-09-13 — B8.1 complete: fake unsupported checkout successes removed

Recorded:

- Semantic closure resolving independent audit finding: unsupported inherited Spree functionality must be removed or explicitly unavailable, NOT simulated as successful;
- Removed fake payment session methods from `storefront/src/lib/data/payment.ts`: `createCheckoutPaymentSession`, `updateCheckoutPaymentSession`, `completeCheckoutPaymentSession`, `createDirectPayment`, and `confirmPaymentAndCompleteCart`;
- Eliminated fake runtime sentinels `direct_payment_session` and `"direct_payment"`;
- Deleted obsolete legacy gateway callback route `storefront/src/app/[country]/[locale]/(checkout)/confirm-payment` (`[id]/page.tsx` and test);
- Removed fake delivery selection mutation `selectDeliveryRate` from `storefront/src/lib/data/checkout.ts`, `DeliveryMethodSection.tsx`, and `CheckoutPageContent.tsx`;
- Preserved authoritative first-party order placement `completeCheckoutOrder` (`placeOrderFromCart` into PostgreSQL with bearer-token/auth validation);
- Updated `storefront/src/lib/__tests__/b8-architecture-audit.test.ts` with 10 new B8.1 semantic audit checks (18/18 total passing);
- Verification:
  * 0 `@spree/sdk` imports across all production code;
  * 0 runtime `@spree/sdk` client calls (`getClient()`, `getClientForSurface()`, `withAuthRefresh()`);
  * 0 references to fake BFF `/api/v3/store`;
  * 0 references to `direct_payment_session` or fake `direct_payment` sentinels;
  * 0 references to `paymentSessions` runtime APIs;
  * 0 references to `confirmPaymentAndCompleteCart` or `createCheckoutPaymentSession`;
  * 0 runtime callers for `selectDeliveryRate`;
  * 0 legacy gateway callback routes (`confirm-payment` deleted);
  * 60 test suites / 606 tests passing (100%);
  * Biome lint: 0 errors, 0 warnings;
  * TypeScript `tsc --noEmit`: 0 errors;
  * Next.js production build: 110 static pages successfully generated.
- Production deployment: `dpl_CJRqscwaxv5Vz92WHM8vQVBqHkKF` (READY on `https://mirzafootwear.vercel.app`);
- B8 CODE: COMPLETE;
- B8.1 SEMANTIC CLOSURE: COMPLETE;
- B8 MERGED: COMPLETE (`4cbf62fbc926bff96f7f405e6353afc5be3d0d39`);
- B8 PRODUCTION VERIFICATION: COMPLETE;
- next phase = B9: NEXT — remove Render / Rails leftovers.

### 2026-09-13 — B8 complete: Spree SDK & fake BFF compatibility layer removed

Recorded:

- Uninstalled `@spree/sdk` from dependencies;
- Deleted fake BFF route `/api/v3/store/[...spree]` and webhook routes `/api/webhooks/spree`;
- Deleted dead Spree auth helpers, express checkout components (`ExpressCheckoutButton`, `CouponCode`, `StripePaymentForm`, `PayPalPaymentForm`, `AdyenPaymentForm`, `express-checkout-flow.ts`, `confirm-payment` route);
- Introduced first-party domain commerce types in `storefront/src/types/commerce.ts` replacing SDK type imports across 62 files;
- Implemented direct first-party checkout write and order placement (`checkout.ts`, `payment.ts`), with 100% in-process lookups for `countries.ts`, `markets.ts`, `policies.ts`, `sitemap.ts`;
- Reworked test suites to eliminate legacy BFF tests and added comprehensive architectural audit test `b8-architecture-audit.test.ts` (8/8 passing);
- Verification:
  * 0 `@spree/sdk` imports across all production code;
  * 0 runtime `@spree/sdk` client calls (`getClient()`, `getClientForSurface()`, `withAuthRefresh()`);
  * 0 references to fake BFF `/api/v3/store`;
  * 61 test suites / 605 tests passing (100%);
  * Biome lint: 0 errors, 0 warnings;
  * TypeScript `tsc --noEmit`: 0 errors;
  * Next.js production build: 112 static pages successfully generated.
- next phase = B9 — Render / Rails backend infrastructure cleanup.

### 2026-09-13 — B7 complete / production verified

Recorded:

- B7 first-party media management and publishing complete;
- merged into `main` at `e64631d90ef52bc7470f79b780cbe9dcb7e98aa2`;
- deployed to Vercel production (`dpl_FiDAYjzgYHKZaVXceMyb2BPfSHH9`, `https://mirzafootwear.vercel.app`);
- 64 suites / 643 tests / 113 pages accepted B7 baseline;
- production media served from clean Supabase Storage `product-media`;
- categories: 2, products: 38, variants: 152, product_images: 38, hero rows: 38;
- production admin count intentionally 0 (demoted per security preflight);
- `SUPABASE_SECRET_KEY` added server-side to Vercel Production & Preview;
- clean project DB password rotation deferred by operator and not blocking B8;
- next phase = B8 — remove Spree SDK / fake Spree Store API BFF compatibility layer.

### 2026-09-13 — continuity reconciliation through B7 final preflight

Recorded:

- B6 is fully complete on `main` at `6d630e4...`;
- B6B first-party catalog admin is complete;
- B7/B7.1/B7.2 implementation accepted at `1e09b19...`;
- PostgreSQL/Supabase Storage media ownership architecture;
- 38 logical media rows / 38 heroes / 532 copied derivative objects;
- removal of production manifest/static `/products` media authority on accepted B7 source;
- signed-upload + Sharp finalize security model;
- typed media errors, transactional hero/reorder/delete invariants;
- 64 suites / 643 tests / 113 pages accepted B7.2 baseline;
- final B7 merge/deploy blocked by unrotated exposed PostgreSQL credential;
- `SUPABASE_SECRET_KEY` missing from Vercel Production and required before deploy;
- two production admin roles proven to be disposable B6B/B7 test profiles and safe to demote;
- B7 branch remains unmerged and B8 remains not started;
- canonical sequencing locked through B10 → media contract → new catalog → optimization → redesign;
- docs branch divergence warning and safe single-file reconciliation procedure for the next executor.

### 2026-09-13 — B6 complete

Recorded first-party catalog admin completion, server-authoritative admin authorization, product/variant/category administration, draft-first publication invariants, safe descriptions, cache invalidation, removal of legacy admin redirect/credential scripts, and final B6 production merge `6d630e4...`.

### 2026-09-13 — B6A complete

Recorded authoritative PostgreSQL catalog migration, 2 categories / 38 products / 152 variants, cached four-query public read model, authoritative variant UUID bridge for carts/orders, B6A.1 integrity/cache closure, B6A.2 sitemap + wholesale catalog closure, zero runtime Spree product/category/variant reads, and final B6A production merge `a7a57911...`.

### 2026-09-12 — B5 complete

Recorded first-party transactional orders/history, B5 security closure, rejected cart SEO commit, and production merge `d24c41ab...`.

### 2026-09-12 — B4 complete

Recorded PostgreSQL-only saved addresses, profile phone support, fail-closed reads, and merge `41082343...`.

### 2026-09-12 — B3 complete

Recorded persistent carts, bearer-token guest authorization, B3 security closure, Route Handler cache fix, and preservation of S8 cart performance behavior.

### 2026-09-12 — B2 complete

Recorded Supabase Auth migration, `profiles.role` authority, SSR/session behavior, public anonymous performance invariants, and merge `36aadc40...`.

### 2026-09-11 — B1 complete

Recorded first-party persistence schema, server-only domain access, strict Supabase PostgreSQL TLS, and clean-project boundary.

### 2026-09-18 — Mirza Admin + Media Modernization Phase 6A Complete

Recorded:
- **Mission**: Established the Mirza Studio editorial admin foundation and standalone Media Library UI at `/[country]/[locale]/admin/media` on branch `feat/editorial-media-library-ui`.
- **Preflight & Invariants**:
  - Resolved Phase 5 cleanup wording discrepancy in `storefront/src/lib/actions/admin-media-library.ts` and `docs/MEDIA-LIBRARY-BACKEND.md`.
  - Merged `feat/media-library-backend` into `main` at `819557e5cde3f8d3886f4203cb03a9a65ae13fdb`.
- **Editorial Admin System (`admin.css`)**:
  - Scoped design tokens: warm cream canvas `#f3efe8`, card surface `#fffefc`, stone stage `#ece7de`, dark ink `#30261f`, muted text `#625447` / `#706257`, warm borders `#cfc4b6`.
  - Scoped typography: Cormorant Garamond / EB Garamond headings, Geist Sans UI controls, Geist Mono metadata.
- **Studio Shell & Security**:
  - Top navigation bar with quiet active tab underline for `Products`, `Categories`, `Media`.
  - Fail-closed administrative authorization via `requireAdmin()`.
  - Mirza Studio Access Restricted gate for unauthenticated or non-admin users.
- **Media Library UI**:
  - Server-rendered initial results with 24-item bounded pagination.
  - Case-insensitive debounced search (`?q=`).
  - Provider tabs (`?provider=supabase|all|legacy_public`) defaulting to `supabase` to prioritize managed assets while preserving explicit access to legacy rollback copies.
  - Sorting (`?sort=created_desc|created_asc|size_desc|size_asc`).
  - Responsive 2- to 5-column grid with stone image frames and usage/rollback badges.
- **Direct-to-Supabase Upload Modal**:
  - Client validation (WebP, JPEG, PNG, AVIF <= 10MB).
  - Direct client `uploadToSignedUrl` to Supabase Storage (zero binary bytes through Vercel serverless compute).
  - Server-side Sharp finalization: dimension extraction, SHA-256 digest, 16x16 LQIP data URI, dominant color hex.
- **Inspector Slide-Over Drawer & Safe Deletion**:
  - High-res stage preview with link to direct storage master.
  - Full technical specifications (dimensions, file size, MIME type, dominant color, SHA-256 copyable digest, upload date).
  - Real-time product placements list with links to product editors.
  - Deletion disabled when attached to products (`usageCount > 0`) or when marked as legacy rollback.
  - Confirmation dialog before irreversible deletion.
- **Verification**:
  - Vitest: 71 test files, 798 tests passing (including 11 unit tests in `media-library-ui.test.ts` and updated `page-auth.test.ts`).
  - TypeScript: 0 errors (`tsc --noEmit`).
  - Biome: 357 files clean (0 errors, 0 warnings).
  - Full Next.js production build: 103 routes compiled successfully.
  - Headless Playwright visual QA and full E2E lifecycle (upload -> search -> inspect -> delete) executed and verified.
- **Phase 6B Boundary**: Product media picker in product editor and drag-and-drop reordering explicitly deferred to Phase 6B. Storefront client JS impact strictly 0.

### 2026-09-18 — Mirza Media Modernization Phase 6B & Supervisor Fix Pass Complete

Recorded:
- **Phase 6B Integration**: Product media management workflow transitioned to Media Contract v1 in Product Edit screen (`/admin/products/[id]`). Added visual media grid, modal library picker with multi-select, inline upload to Supabase, hero promotion, managed reorder, and alt text editing.
- **Supervisor Fix Pass**:
  1. **Atomic Multi-Asset Attach**: Rewrote `attachMediaAssetsToProductAction` to run inside a single database transaction. Validates UUIDs, rejects duplicate IDs upfront before mutation, verifies product and all media assets exist, rejects legacy rollback assets, and commits all or nothing. Invalidation via `updateTag("catalog-public")` occurs strictly once after commit.
  2. **Strictly Managed-Only Reorder**: Removed compatibility fallback in `reorderProductMediaActionV1`. Enforces that the submitted asset IDs must match the product's non-legacy managed set exactly (no missing IDs, no extra IDs, no duplicates). Rejects caller injection of legacy rollback assets. Persists `[...submittedManagedIds, ...legacyIds]` keeping legacy assets after managed media in their existing relative order.
  3. **Rollback Assets Read-Only Server Invariant**: Hardened `detachMediaAssetFromProductAction` and `updateProductMediaAltTextActionV1` to reject attempts to detach or alter alt text on `legacy_public` assets with `"Legacy rollback assets are read-only during the rollback window."`.
  4. **Publish Invariant Strengthened**: Updated `validatePublishInvariants()` to query `product_media` join `media_assets` with `storage_provider != 'legacy_public'` and enforce `managedCount >= 1` and `managedHeroCount == 1`. Excludes legacy rollback hero from managed hero count.
  5. **Managed Hero Promotion Invariants (Final Hero Fix)**: Made single and batch attachments managed-aware. If product has zero managed placements (even if a legacy rollback hero exists), the first attached managed asset automatically becomes the authoritative hero (`isHero = true`), atomically demoting the legacy hero while keeping its row attached. If managed placements already exist, new attachments default to gallery (`isHero = false`).
- **Verification**:
  - `tsc --noEmit`: 0 errors.
  - `lint`: 360 files checked, 0 errors.
  - `vitest`: 73 test files, 844 tests passed (covering Cases A through E, legacy preservation, single hero guarantee, and batch atomicity).
  - Next.js build: 103 routes compiled successfully.
  - Canonical 31 products (`shoe-2026-09-001` through `031`): Unmodified.


