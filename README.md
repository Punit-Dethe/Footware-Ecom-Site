# Mirza Footwear — High-Performance First-Party Storefront

A high-performance footwear ecommerce platform built with **Next.js 16**, **React 19**, **Supabase Auth**, and a **first-party PostgreSQL data layer** deployed on **Vercel**.

Designed for instant page loads, sub-second edge responses, zero root-layout blanking, and an instantaneous client-side cart.

**Live:** [https://mirzafootwear.vercel.app](https://mirzafootwear.vercel.app)

---

## Current state

> Reconciled 2026-09-14 · `main` head `6c504be`

| Area | Status |
|---|---|
| Backend migration (B1–B10) | **Complete**, merged, deployed, production-verified |
| Legacy Spree / Rails / Render dependency | **Zero** |
| Final UI implementation | **In progress** (12 commits past the backend baseline) |
| Media Contract v1 | Not started |
| Image / data optimization pass | Not started |
| Final UX performance pass | Not started |

The 12 commits past the backend baseline are all storefront UI work: an
editorial homepage, an editorial PDP, a reworked carousel and catalog layout,
and typographic/layout refinements. See
`docs/ENGINEERING-CONTINUITY-LOG.md` for phase detail.

---

## Architecture Overview

```
USER / BROWSER
      │
      ▼
VERCEL CDN / EDGE (Mumbai `bom1` & Global Edge)
┌─────────────────────────────────────────────────────────────┐
│ Next.js 16 App Router                                      │
│ • Server Components + first-party Server Actions            │
│ • Supabase Auth verified identity & sessions                │
│ • Persistent cart & atomic order placement                  │
│ • Bounded catalog read model (tag: catalog-public)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
            PERSISTENT DATABASE / STORAGE
            • Supabase PostgreSQL (Mumbai `ap-south-1`, strict TLS)
            • Supabase Storage `product-media`
```

Request path for public catalog reads:

```text
PostgreSQL → bounded 4-query snapshot → cache tag `catalog-public`
→ in-process filter / search / sort → components
```

Warm renders cost **0** database queries.

### Key Highlights

- **100% First-Party & Serverless** — no external commerce engine, no Rails, no Puma, no legacy SDK.
- **Speed-First Design**
  - Root layout streams immediately; zero white-screen blanking; synchronous currency resolution.
  - PLP decoupled from filter loading — products render before facets resolve.
  - Deep infinite-scroll prefetch margin plus proactive background page prefetching.
  - LCP image priority owned cleanly by the layout.
  - Active catalog products and categories pre-rendered at build time.
  - Persistent server-side cart: token-hashed guest carts, transactional guest→user merge, zero network wait on the client.
- **Supabase Auth & PostgreSQL DAL** — server-side verified sessions, connection pooling, bounded queries.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components) |
| UI | React 19, Tailwind CSS 4, Radix UI / shadcn |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Data | Supabase PostgreSQL (`ap-south-1`) via server-only DAL (`pg`) |
| Media | Supabase Storage `product-media` + Next/Image |
| i18n | `next-intl` — `de`, `en`, `es`, `fr`, `pl` |
| Email | Resend + `react-email` |
| Observability | Sentry, Vercel Analytics, Speed Insights |
| Tooling | pnpm, Biome, Vitest, Playwright, TypeScript |

---

## Directory Structure

```
Ecom For Footwear/
├── storefront/                  # Next.js 16 / React 19 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── [country]/[locale]/
│   │   │   │   ├── (storefront)/   # catalog, PDP, cart, account, policies
│   │   │   │   ├── (checkout)/     # checkout + order confirmation
│   │   │   │   ├── (admin)/        # role-gated catalog administration
│   │   │   │   └── (wholesale)/    # gated B2B portal + quick order
│   │   │   ├── dev/emails/         # email template previewer (dev only)
│   │   │   ├── robots.ts
│   │   │   └── sitemap.ts
│   │   ├── components/          # UI, product, layout, filters, admin
│   │   ├── contexts/            # Cart, Auth, Store, Checkout, HiddenPricing
│   │   ├── hooks/
│   │   ├── i18n/                # locale registry + routing
│   │   ├── types/               # commerce domain types
│   │   └── lib/
│   │       ├── actions/         # admin Server Actions
│   │       ├── cache/           # canonical cache policy
│   │       ├── catalog/         # catalog repository (public read model)
│   │       ├── data/            # cached fetchers + Server Actions
│   │       ├── db/              # first-party PostgreSQL DAL (server-only)
│   │       ├── emails/          # react-email templates
│   │       ├── media/           # storage admin + delivery helpers
│   │       ├── metadata/        # SEO metadata builders
│   │       ├── storefront/      # surface, cookies, legacy-cookie bridge
│   │       └── supabase/        # server + proxy clients
│   ├── messages/                # locale message bundles
│   ├── public/
│   │   ├── catalog-shoes/       # 31 catalog images
│   │   └── editorial/           # editorial imagery (some temporary)
│   ├── e2e/                     # Playwright smoke tests
│   └── supabase/migrations/     # SQL migrations
├── media/                       # source product photography
├── Shoes/                       # source shoe images (untracked)
├── scripts/
│   ├── catalog/                 # shoe catalog manifest + replacement script
│   ├── images/                  # image ingest
│   └── verify-db-connection.mjs
├── perf/                        # benchmarks, budgets, Lighthouse config
├── docs/                        # architecture + engineering records
├── infra/                       # deployment topology
└── package.json                 # root scripts
```

---

## Quickstart

### Prerequisites

- **Node.js 22** (`engines.node` is `22.x`)
- **pnpm 10** (`packageManager` is `pnpm@10.33.4`)

### Running Locally

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp storefront/.env.local.example storefront/.env.local
#    then set DATABASE_URL, SUPABASE_DB_CA_CERT_BASE64,
#    NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
#    SUPABASE_SECRET_KEY

# 3. Start the development server
pnpm dev

# 4. Open your browser
http://localhost:3001/us/en
```

> The publishable key is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, not
> `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If you copied an older `.env.local`, rename it.

### Available Root Commands

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Next.js dev server on `http://localhost:3001` |
| `pnpm build` | Production build; validates static pre-rendering |
| `pnpm start` | Serve the production build on port 3001 |
| `pnpm test` | Vitest suite (62 suites / 662 tests) |
| `pnpm lint` | Biome lint |
| `pnpm analyze` | Build with bundle analysis |
| `pnpm image:ingest` | Image ingest pipeline (`scripts/images/ingest.mjs`) |

Each root command delegates to `storefront/` via `pnpm --prefix`.

---

## Catalog contract

```text
categories = 2    office-wear, traditional
products   = 31   shoe-2026-09-001 … shoe-2026-09-031
sizes      = 7 per product  (UK/India 6–12)
media      = /catalog-shoes/shoe-NN.webp
```

The retired 38-product demo catalog (`office-footwear-01`,
`traditional-footwear-NN`, `formal-office`, `traditional-indian`) is gone —
documentation or smoke tests referring to those identifiers are stale.

Ingestion tooling: `scripts/catalog/shoes-2026-09.json` (manifest) and
`scripts/catalog/replace-catalog-with-shoes.mjs` (dry-run by default; pass
`--apply` to write).

---

## Performance contract

Enforced by audit tests. Do not regress.

```text
catalog     warm snapshot = 0 DB queries · cold = 4 bounded · N+1 = 0
PLP         12 products initial + exactly one deferred remainder request
anonymous   no auth call · no profile/address/order query · no cart row
            created by a read · no Set-Cookie on warm visitors
admin       verified claims.sub → profiles.role = 'admin' only
orders      historical snapshots never mutate when catalog changes
TLS         strict (rejectUnauthorized: true)
```

---

## Documentation

| Document | Trust | Contents |
|---|---|---|
| `docs/ENGINEERING-CONTINUITY-LOG.md` | **Canonical** | Phase state, invariants, next action |
| `docs/PERFORMANCE-RESEARCH-LEDGER.md` | **Canonical** (perf) | R001–R012 measured experiments |
| `docs/ARCHITECTURE.md` | Current | Runtime topology, route groups, data ownership |
| `infra/README.md` | Current | Deployment topology and Vercel configuration |
| `storefront/README.md` | Current | App-level setup and invariants |
| `storefront/CLAUDE.md` | Current | Coding conventions |
| `docs/PERFORMANCE-PAPER-EVIDENCE.md` | Research record | Methodology for R001–R012 |
| `docs/PERFORMANCE.md` | Historical | Pre-migration experiments 001–008/018 |
| `docs/EXPERIMENTS.md` | Historical | Pre-migration experiments 001–006 |
| `docs/BASELINE.md` | Historical | `baseline-v1`, Spree-era |
| `docs/specifications/*.md` | Historical | Spree-era engineering specs |

Historical documents are banner-marked and retained as the record of what was
tried. Do not execute them.

---

## Production Deployment

Hosted on **Vercel**:

- **Live URL**: [https://mirzafootwear.vercel.app](https://mirzafootwear.vercel.app)
- **Last verified backend deployment**: `dpl_9vTuvjoiNtThD93xSSDpMb4aZxGB` at `3367ea2` (B10 merge)

`main` has since advanced 12 commits with editorial UI work that had not yet
been re-verified in production when this README was updated.
