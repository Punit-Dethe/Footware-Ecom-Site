# Mirza Footwear — High-Performance First-Party Storefront

A high-performance footwear ecommerce platform built with **Next.js 16**, **React 19**, **Supabase Auth**, and a **first-party PostgreSQL data layer** deployed on **Vercel**.

Designed for instant page loads, sub-second edge responses, zero root-layout blanking, and an instantaneous client-side cart.

---

## 🎯 Architecture Overview

```
USER / BROWSER
      │
      ▼
VERCEL CDN / EDGE (Mumbai `bom1` & Global Edge)
┌─────────────────────────────────────────────────────────────┐
│ Next.js 16 App Router                                      │
│ • Statically Pre-Rendered Catalog Pages                     │
│ • Server Components & First-Party Server Actions           │
│ • Supabase Auth Verified Identity & Sessions                │
│ • Persistent Cart & Atomic Order Placement                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
            PERSISTENT DATABASE / STORAGE
            • Supabase PostgreSQL (Mumbai `ap-south-1`)
            • Supabase Storage / Edge CDN
```

### Key Highlights
- **100% First-Party & Serverless**: Zero dependency on external commerce engines, Rails, Puma, or legacy SDKs.
- **Speed-First Design**:
  - **Root Streaming**: Root layout streams immediately with zero white-screen blanking; instant synchronous currency resolution.
  - **Decoupled PLP**: Product listing decoupled from filter loading; products display instantly.
  - **Prefetch Margin**: Deep infinite scroll prefetch margin + proactive background page prefetching.
  - **Clean LCP Priority**: LCP image priority cleanly owned by layout.
  - **Pre-Rendered Catalog**: Active catalog products and categories pre-rendered at build time.
  - **Persistent Server-Side Cart**: Token-hashed guest carts and user cart merges with zero network wait time.
- **Supabase Auth & PostgreSQL DAL**: Complete server-side verified sessions, connection pooling, and bounded database queries.

---

## 📦 Directory Structure

```
Footware-Ecom-Site/
├── storefront/              # Next.js 16 / React 19 application
│   ├── src/
│   │   ├── app/             # App Router pages, layouts, and Server Actions
│   │   │   └── [country]/   # Localized storefront & PDP pages
│   │   ├── components/      # UI components, product cards, filters, layout
│   │   ├── contexts/        # Client contexts (CartContext, StoreContext, etc.)
│   │   └── lib/
│   │       ├── catalog/     # Catalog repository & query utilities
│   │       ├── db/          # First-party PostgreSQL DAL (cart, order, catalog, profile)
│   │       ├── data/        # Server Actions & data fetchers with cache tags
│   │       ├── storefront/  # Surface, cookies, and legacy migration bridge
│   │       └── supabase/    # Supabase server & client configuration
│   └── public/              # Static assets (favicons, manifest, placeholder)
├── media/                   # Product photography assets
├── scripts/                 # Utility & database scripts
├── docs/                    # Architecture documentation & engineering logs
└── package.json             # Root monorepo scripts
```

---

## 🚀 Quickstart

### Prerequisites
- Node.js >= 20
- pnpm >= 9

### Running Locally

```bash
# 1. Install dependencies
pnpm install

# 2. Start the development server
pnpm dev

# 3. Open your browser
http://localhost:3001/us/en
```

### Available Root Commands

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Starts the Next.js dev server on `http://localhost:3001` |
| `pnpm build` | Compiles and validates static pre-rendering for all pages |
| `pnpm test` | Runs the Vitest test suite |
| `pnpm lint` | Runs Biome linter across the entire project |

---

## 🌐 Production Deployment

The production deployment is hosted on **Vercel**:
- **Live URL**: [https://mirzafootwear.vercel.app](https://mirzafootwear.vercel.app)
