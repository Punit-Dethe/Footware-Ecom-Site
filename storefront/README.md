[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)

# Mirza Footwear Storefront

A high-performance, headless ecommerce storefront for Mirza Footwear, built with Next.js 16, React 19, Supabase Auth, and a first-party PostgreSQL data access layer.

[Production Deployment](https://mirzafootwear.vercel.app)

## Architecture

This application operates as a **first-party headless commerce engine**:

1. **Server-First Architecture** — All commerce operations (cart, orders, profile, catalog) execute server-side via Next.js Server Components and Server Actions.
2. **First-Party PostgreSQL Data Layer** — Direct connection pooling (`pg`) to PostgreSQL for transactional consistency and bounded queries.
3. **Supabase Auth** — Complete user authentication and session management via `@supabase/ssr` and Supabase Auth.
4. **Cached Catalog Read Models** — A bounded 4-query snapshot cached under the `catalog-public` tag; filtering, search, sort and lookups then happen in-process. Warm renders cost **0** database queries.
5. **Secure httpOnly Cookies** — Neutral cart and locale cookies (`_mirza_cart_*`, `mirza_country`, `mirza_locale`) managed through an isolated migration bridge.
6. **Zero External Commerce Dependency** — 100% first-party; zero runtime dependency on Spree, Rails, Render, or any legacy commerce SDK.

### Layering

```text
lib/db/*        raw SQL data access layer (server-only)
  ↓
lib/data/*      cached fetchers + Server Actions
  ↓
lib/catalog/    public read model (bounded snapshot, tag: catalog-public)
  ↓
components/     server components + small client islands
```

Do not call `lib/db` from client code. Do not bypass `lib/data` cache
invalidation from the DAL — invalidation belongs at the Server Action boundary.

### Route groups

| Group | Purpose |
|---|---|
| `(storefront)` | Catalog, PDP, cart, account, policies |
| `(checkout)` | Checkout and order confirmation |
| `(admin)` | Catalog administration (role-gated) |
| `(wholesale)` | Gated B2B portal and quick order |

URL shape is `/{country}/{locale}/...`. Supported locales: `de`, `en`, `es`,
`fr`, `pl`.

### Current catalog

```text
categories = 2   office-wear, traditional
products   = 31  shoe-2026-09-001 … shoe-2026-09-031
sizes      = 7 per product (UK/India 6–12)
media      = /catalog-shoes/shoe-NN.webp
```

The retired 38-product demo catalog (`office-footwear-01`,
`traditional-footwear-NN`, `formal-office`, `traditional-indian`) no longer
exists. Product media currently resolves to static files in `public/catalog-shoes`
while Supabase Storage `product-media` remains the authority for admin uploads;
this split is transitional (Media Contract v1).

## Features

| Feature | Details |
|---|---|
| **Product Catalog** | Server-rendered catalog browsing, faceted filter navigation, and category hierarchies |
| **Product Details** | Variant selection, size availability, real-time pricing, and responsive media |
| **Shopping Cart** | Persistent server-side cart with SHA-256 hashed bearer tokens for guests and user association |
| **Checkout & Orders** | Atomic order placement with idempotency protection and order confirmation |
| **Customer Account** | Profile management, order history with snapshot details, and address management |
| **Wholesale Portal** | Gated wholesale surface with dedicated catalog, pricing, and wholesale order placement |
| **Multi-Region Support** | Country, currency, and language switching via URL segments (`/{country}/{locale}`) |
| **Responsive Design** | Mobile-first Tailwind CSS styling |

## Technology

| Technology | Role |
|---|---|
| **Next.js 16** | App Router, Server Actions, Turbopack |
| **React 19** | Latest React with Server Components |
| **PostgreSQL** | Primary relational store for carts, orders, profiles, and catalog |
| **Supabase Auth** | User authentication, session management, and secure claims |
| **Supabase Storage** | Product media storage and CDN delivery |
| **Tailwind CSS 4** | Styling and responsive design |
| **next-intl** | Locale routing and message bundles (`de`, `en`, `es`, `fr`, `pl`) |
| **Radix UI + shadcn** | Accessible primitives for UI components |
| **Resend + react-email** | Transactional email templates |
| **Sentry** | Server and client error tracking |
| **Vercel Analytics / Speed Insights** | Production measurement |
| **sharp** | Server-side image validation and processing |
| **Biome** | Fast linting and formatting (not ESLint) |
| **Vitest & Playwright** | Unit, integration, and E2E testing |

## Getting Started

### Prerequisites

- Node.js 22 (`engines.node` is `22.x`)
- pnpm 10 (`packageManager` is `pnpm@10.33.4`)
- Access to a Supabase project (PostgreSQL + Auth + Storage)

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment file and configure:

   ```bash
   cp .env.local.example .env.local
   ```

3. Update `.env.local` with your database and Supabase credentials:

   ```env
   DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres
   SUPABASE_DB_CA_CERT_BASE64=<base64 CA certificate>   # strict TLS
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   SUPABASE_SECRET_KEY=your_supabase_secret_key          # server-only
   WHOLESALE_CHANNEL=wholesale                           # optional
   ```

> **Note:** the publishable key is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, not
> `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If you copied an older `.env.local`, rename
> the variable.
>
> `SUPABASE_SECRET_KEY` is server-only and must never be given a
> `NEXT_PUBLIC_` prefix. Database TLS is strict (`rejectUnauthorized: true`);
> do not loosen it.

### Development

```bash
pnpm run dev
```

Open [http://localhost:3001/us/en](http://localhost:3001/us/en) in your browser.

### Production Build

```bash
pnpm run build
pnpm start
```

### Testing

```bash
# Unit & integration tests
pnpm test
pnpm run test:watch

# Linting & formatting
pnpm run lint
pnpm run check

# End-to-end tests
pnpm run test:e2e

# Locale message-bundle parity
pnpm run check:locales

# Bundle analysis
pnpm run analyze
```

Current baseline: **62 suites / 662 tests passing**, `tsc --noEmit` clean,
Biome lint clean.

Architectural invariants are enforced by guard suites — do not weaken them to
make a change pass:

```text
src/lib/__tests__/b8-architecture-audit.test.ts   18 assertions
src/lib/__tests__/b9-architecture-audit.test.ts   21 assertions
src/lib/__tests__/b10-architecture-audit.test.ts  22 assertions
```

## Invariants

These are enforced by tests and audits. Breaking any of them is a regression.

```text
catalog        warm snapshot = 0 DB queries; cold = 4 bounded; N+1 = 0
PLP            12 products initial + exactly one deferred remainder request
anonymous      no auth call, no profile/address/order query, no cart row
               created by a read, no Set-Cookie on warm visitors
admin          verified Supabase claims.sub → profiles.role = 'admin' only
orders         historical order snapshots never mutate when catalog changes
TLS            strict; rejectUnauthorized: true everywhere
secrets        never in docs, tests, source, logs, or client bundles
```

## License

MIT
