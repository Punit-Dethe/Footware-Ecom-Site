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

**Snapshot date:** 2026-09-13

**Repository:** `Punit-Dethe/Footware-Ecom-Site`

**Production storefront:** `https://storefront-three-tau.vercel.app`

### Accepted application baseline

Current `origin/main` at the time of this reconciliation:

```text
6d630e4caef89c295bcec2cfbe0d51ea4b5b3d3a
```

This is the accepted B6 production merge.

B1 through B6 are **COMPLETE**.

B7 / B7.1 / B7.2 source implementation is **COMPLETE AND ACCEPTED**, but B7 is **NOT YET MERGED OR PRODUCTION-ACCEPTED** because final production preflight is blocked by required operator security work.

Accepted B7 branch:

```text
backend/b7-media
```

Accepted B7 head:

```text
1e09b19c17315b7fb66395b94508052df50b1271
```

B7 lineage:

```text
92f44fd16460235a1db4e40c7a3fe566bff5be63  B7 initial media ownership migration
5553f40adecb03c967c1bb1f0c0c79153de32bc3  B7.1 media ownership / Storage closure
1e09b19c17315b7fb66395b94508052df50b1271  B7.2 error / MIME / cleanup closure
```

Verified source topology before the final B7 preflight stopped:

```text
origin/main                 = 6d630e4caef89c295bcec2cfbe0d51ea4b5b3d3a
origin/backend/b7-media     = 1e09b19c17315b7fb66395b94508052df50b1271
merge base                  = 6d630e4caef89c295bcec2cfbe0d51ea4b5b3d3a
B7 ahead of main            = 3 commits
B7 behind main              = 0 commits
```

No B7 merge occurred after the executor hit the security preflight stop.

### Documentation branch note

This canonical file is maintained on:

```text
docs/engineering-continuity-log
```

That branch is intentionally an old documentation branch and currently diverges from modern `main`; it must **not** be wholesale-merged into `main`.

When the next executor begins, the first repository housekeeping action is:

1. fetch current `main` and `docs/engineering-continuity-log`;
2. verify the current application-code state;
3. copy **only** `docs/ENGINEERING-CONTINUITY-LOG.md` from the docs branch onto current `main`;
4. commit that single-file documentation reconciliation;
5. do not merge/cherry-pick unrelated old docs-branch history.

After that docs-only commit, `main` will legitimately be one documentation commit ahead of the original B7 application merge base. Do not rebase or rewrite the accepted B7 branch merely to restore cosmetic `0 behind` topology. The executor should verify that any commits on `main` after `6d630e4...` are documentation/coordination only, then merge the unchanged accepted B7 branch after security preflight succeeds.

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

Remaining Spree-shaped SDK/BFF/types/cookies are temporary compatibility surfaces. They do not own catalog/cart/order/media state.

The migration target remains:

```text
zero runtime Spree / Render / Rails dependency
```

after B8/B9/B10.

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

## 7. B7 — First-Party Media Management + Publishing — SOURCE COMPLETE, PRODUCTION CLOSURE BLOCKED

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
B7 merge to main        = NOT DONE
B7 production signoff   = BLOCKED BY SECURITY PREFLIGHT
B8                      = NOT STARTED
```

Do not reopen B7 implementation without concrete evidence.

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

## 8. Latest B7 final-preflight result — BLOCKED

The final merge/deploy run was intentionally stopped before mutation/deployment.

Result:

```text
B7 FINAL BLOCKED
Reason: OPERATOR DATABASE CREDENTIAL ROTATION REQUIRED
```

### 8.1 Database credential rotation

Status:

```text
NOT COMPLETED
```

The earlier-exposed clean-project PostgreSQL credential still authenticated successfully against the clean database during the authorized preflight check.

Therefore production acceptance is strictly blocked until the operator rotates the PostgreSQL password in Supabase.

Required after rotation:

1. update `storefront/.env.local` `DATABASE_URL`;
2. update Vercel Production `DATABASE_URL`;
3. verify the new credential connects with strict TLS;
4. if the old credential is safely available through authorized state, verify the old credential fails;
5. never print either credential.

The Vercel environment listing proves `DATABASE_URL` exists; do not infer/print its underlying secret value from an environment-name listing. After rotation it must be explicitly updated regardless.

### 8.2 Vercel production environment

Latest preflight found these production env names present:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_DB_CA_CERT_BASE64
DATABASE_URL
```

Latest preflight found this missing in Vercel Production:

```text
SUPABASE_SECRET_KEY
```

It exists locally but must be added to Vercel Production before B7 deployment.

It must remain server-only and must not appear in browser bundles.

### 8.3 Admin profile provenance — now established

Authoritative B6 production target before disposable verification accounts:

```text
admin profiles = 0
```

Latest preflight found two production `public.profiles.role = 'admin'` rows.

Their provenance was established as disposable audit/demo profiles created solely for B6B/B7 verification:

```text
8531d8a4-ef2b-4b52-8e01-efd5cd787ee5
created 2026-09-12 14:57:17 +05:30
purpose: disposable B6B audit testing

733a6b94-85ee-4be3-9216-24ff642d183a
created 2026-09-13 05:15:26 +05:30
purpose: disposable B7 live demo testing
```

No email/password/token should be printed or recorded.

These roles can be safely demoted back to `customer`; do not delete the underlying Supabase Auth identities merely to clean the role.

Target before final B7 production acceptance:

```text
admin profiles final = 0
```

unless the operator explicitly chooses to retain an approved administrator.

Because provenance is now established, the next executor does **not** need another human provenance investigation before demotion.

### 8.4 Git/source preflight

The stopped run verified:

```text
origin/main             6d630e4caef89c295bcec2cfbe0d51ea4b5b3d3a
origin/backend/b7-media 1e09b19c17315b7fb66395b94508052df50b1271
merge base              6d630e4caef89c295bcec2cfbe0d51ea4b5b3d3a
B7 ahead                 3
B7 behind                0
```

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
B7  first-party media management/publishing        SOURCE COMPLETE / FINAL PROD CLOSEOUT BLOCKED
B8  remove Spree SDK / fake Spree BFF compatibility NOT STARTED
B9  remove Render/Rails legacy                     NOT STARTED
B10 cleanup / dead compatibility / naming/config   NOT STARTED
```

---

## 12. Immediate next executor run — exact order

**Do not start B8 in this run.**

**Do not import the new shoe catalog.**

**Do not start image-performance optimization.**

**Do not implement the editorial redesign.**

### Step 0 — reconcile this canonical log into current main

Because `docs/engineering-continuity-log` is a historical divergent branch, do not merge it wholesale.

Executor should:

```text
git fetch origin
git checkout main
git pull --ff-only origin main
```

Then copy only:

```text
docs/ENGINEERING-CONTINUITY-LOG.md
```

from:

```text
origin/docs/engineering-continuity-log
```

onto current `main` and create one docs-only commit.

Verify `git diff` contains no application/source/env changes.

After this docs commit, re-check `main` vs accepted B7 and explicitly allow the expected docs-only divergence from the original B7 merge base.

If unexpected application-code commits have landed on `main` since `6d630e4...`, stop and audit before B7 merge.

### Step 1 — operator DB credential rotation

Before production deployment, confirm the exposed clean-project PostgreSQL password has been rotated in Supabase.

If not rotated:

```text
STOP
B7 FINAL BLOCKED
Reason: OPERATOR DATABASE CREDENTIAL ROTATION REQUIRED
```

After operator rotation:

- update local `DATABASE_URL`;
- update Vercel Production `DATABASE_URL`;
- verify current credential connects with strict TLS;
- safely verify old credential fails when possible;
- never print secrets.

### Step 2 — production environment completion

Ensure Vercel Production contains:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
DATABASE_URL
SUPABASE_DB_CA_CERT_BASE64
```

Confirm `SUPABASE_SECRET_KEY` is server-only and not emitted into browser bundles.

B7 runtime must not depend on `SUPABASE_SERVICE_ROLE_KEY`.

### Step 3 — demote the two known disposable admin profiles

Demote the two provenance-established B6B/B7 test profiles from `admin` to `customer` using a safe explicit DB operation.

Do not delete their Supabase Auth identities.

Target:

```text
admin profiles final = 0
```

unless operator explicitly approves an administrator to remain.

### Step 4 — merge accepted B7 source

Merge the unchanged accepted branch:

```text
origin/backend/b7-media
```

at accepted head:

```text
1e09b19c17315b7fb66395b94508052df50b1271
```

into then-current `main` with a normal non-fast-forward merge.

Unexpected source conflicts or B7 branch drift:

```text
STOP
```

Do not make opportunistic application changes during the merge.

### Step 5 — merged-main validation

Run:

```text
pnpm --prefix storefront exec tsc --noEmit
pnpm --prefix storefront lint
pnpm --prefix storefront test
pnpm --prefix storefront run build
```

Accepted pre-merge B7.2 baseline:

```text
64 suites
643 tests
113 generated pages
```

Report actual merged-main totals.

### Step 6 — deploy exact merged main

Deploy the exact final merged `main` SHA to Vercel Production.

Report deployment ID, production URL, and deployed git SHA.

Deployed SHA must equal final `main` SHA.

### Step 7 — targeted B7 production verification

Verify clean project only; legacy project remains untouched.

Final permanent demo state should remain:

```text
categories     = 2
products       = 38
variants       = 152
product_images = 38
hero rows      = 38
disposable artifacts = 0
```

Verify:

- `product-media` public reads work;
- unrestricted anonymous writes are not allowed;
- privileged server Storage operations work;
- all 38 logical media rows point to existing objects;
- all processed derivative object paths exist;
- processed `/products/...` paths = 0;
- public runtime `/products/...` product-media URLs = 0;
- manifest runtime dependency = 0;
- homepage/PLP/PDP return healthy responses and images render;
- no Next/Image remote-pattern 400s;
- `/placeholder.svg` works for no-media products;
- cart/order regressions are absent;
- warm 0 / cold 4 / N+1 0 preserved;
- PLP 12 + delayed remainder preserved;
- P1 exact hero prewarm preserved;
- order media lookup remains transaction-local and snapshotted;
- `/admin` remains first-party with no Render/Spree redirect;
- anonymous/customer admin access is denied before privileged DAL/Storage work;
- `SUPABASE_SECRET_KEY`/`DATABASE_URL`/CA have zero client references;
- `SUPABASE_SERVICE_ROLE_KEY` has zero B7 runtime dependency;
- no `dns.setServers`, DNS monkey-patch, or `rejectUnauthorized: false` was introduced;
- legacy Supabase project remains untouched.

If final admin count is intentionally zero, do not bootstrap an admin merely for a live media mutation. Report:

```text
LIVE ADMIN MEDIA MUTATION:
BLOCKED BY INTENTIONAL NO-ADMIN STATE
```

That is acceptable because automated B7 media lifecycle tests are already part of the accepted validation baseline.

If the operator explicitly retains an approved production admin, one disposable live media lifecycle may be tested and then completely cleaned so `product_images` returns to 38.

### Step 8 — close B7

Only after all required production checks pass:

```text
B7 = FULLY COMPLETE
```

Then update this continuity log again and begin planning B8.

---

## 13. Locked project sequencing after B7

Do not interrupt the backend migration.

Sequence:

```text
B7 final merge + production verification
→ B8 remove Spree SDK / fake Spree BFF compatibility
→ B9 remove Render/Rails leftovers
→ B10 final migration cleanup
→ BACKEND MIGRATION COMPLETE
→ define Media Contract v1
→ ingest new ~31-shoe demo catalog
→ deep image/data/navigation optimization
→ implement new editorial Mirza UI
→ final UX-specific performance pass
```

Do **not** upload the new catalog before migration completion.

Do **not** start Duke + Dexter / ME London-style cold-image optimization before B10.

Do **not** implement the homepage/PLP/PDP redesign before the optimized post-migration media/data foundation is established.

Design exploration can happen separately, but it must not interrupt or contaminate the migration branch sequence.

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

1. `docs/ENGINEERING-CONTINUITY-LOG.md` from `docs/engineering-continuity-log` until it has been reconciled onto current `main`;
2. `docs/PERFORMANCE-RESEARCH-LEDGER.md`;
3. `docs/PERFORMANCE-PAPER-EVIDENCE.md` when detailed experiment evidence is needed;
4. current GitHub `main`;
5. accepted B7 branch `backend/b7-media` at `1e09b19...`;
6. relevant auth/catalog/media DAL/actions/tests for the phase being audited.

Do not assume older `ARCHITECTURE.md`, old specification docs, or old performance execution queues describe the current migration state. Reconcile them only during the appropriate cleanup/documentation phase rather than letting stale docs override accepted source state.

---

## 16. Rolling change log

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
