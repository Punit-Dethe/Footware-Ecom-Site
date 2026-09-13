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
4. **Cached Catalog Read Models** — Pre-warmed product listings, category trees, and faceted filters with tag-based revalidation.
5. **Secure httpOnly Cookies** — Neutral cart and locale cookies (`_mirza_cart_*`, `mirza_country`, `mirza_locale`) managed through an isolated migration bridge.
6. **Zero External Commerce Dependency** — 100% first-party; zero runtime dependency on legacy commerce engines or SDKs.

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
| **Supabase Storage** | Responsive product imagery and CDN delivery |
| **Tailwind CSS** | Styling and responsive design |
| **Biome** | Fast linting and formatting |
| **Vitest & Playwright** | Unit, integration, and E2E testing |

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Access to Supabase PostgreSQL database

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
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   WHOLESALE_CHANNEL=wholesale
   ```

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

# Linting & formatting
pnpm run lint
pnpm run check

# End-to-end tests
pnpm run test:e2e
```

## License

MIT
