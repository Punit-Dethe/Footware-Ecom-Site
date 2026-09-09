# Mirza Footwear — High-Performance Serverless Storefront

A high-performance footwear ecommerce platform built with **Next.js 16**, **React 19**, and a lightweight **serverless Spree BFF (Backend-For-Frontend)** architecture deployed on **Vercel**.

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
│ • Statically Pre-Rendered Catalog (104 Pages)              │
│ • Server Components & Server Actions                        │
│ • Embedded Spree Store API BFF (/api/v3/store/*)           │
│ • Fast Client-Side & Serverless Cart (0ms Network Latency) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
            PERSISTENT DATABASE / STORAGE
            • Supabase PostgreSQL (Mumbai `ap-south-1`)
            • Supabase Storage / Edge CDN
```

### Key Highlights
- **100% Serverless**: Zero dependency on heavy Rails, Puma, or Docker containers. 0-second cold starts.
- **Speed-First Design**:
  - **Wave 1**: Root layout streams immediately with zero white-screen blanking; instant synchronous currency resolution.
  - **Wave 2**: Product listing decoupled from filter loading; products display instantly.
  - **Wave 3**: Deep 1000px infinite scroll prefetch margin + proactive background Page 2 prefetching.
  - **Wave 4**: Clean LCP image priority cleanly owned by layout.
  - **Wave 5**: All 38 catalog products and 2 categories (`Office Wear` & `Traditional`) are pre-rendered at build time.
  - **Wave 6**: Instantaneous client-side cart updates with zero network wait time.
- **Spree SDK Compatible**: The storefront communicates with standard `@spree/sdk` endpoints via Next.js Route Handlers (`/api/v3/store/*`).

---

## 📦 Directory Structure

```
Footware-Ecom-Site/
├── storefront/              # Next.js 16 / React 19 application
│   ├── src/
│   │   ├── app/             # App Router pages, layouts, and API Route Handlers
│   │   │   ├── api/v3/store/# Serverless Spree BFF route handler
│   │   │   └── [country]/   # Localized storefront & PDP pages
│   │   ├── components/      # UI components, product cards, filters, layout
│   │   ├── contexts/        # Client contexts (CartContext, StoreContext, etc.)
│   │   └── lib/
│   │       ├── catalog/     # 38-product catalog repository & query utilities
│   │       ├── data/        # Server data fetchers with cache fallbacks
│   │       └── media/       # Responsive image metadata & manifest
├── media/                   # Original product photography (38 items)
├── scripts/                 # Utility scripts (e.g. image ingestion pipeline)
├── docs/                    # Architecture documentation & historical specs
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

# 2. Start the development server (runs both storefront and API BFF on port 3001)
pnpm dev

# 3. Open your browser
http://localhost:3001/us/en
```

### Available Root Commands

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Starts the Next.js dev server on `http://localhost:3001` |
| `pnpm build` | Compiles and validates static pre-rendering for all 104 pages |
| `pnpm test` | Runs the Vitest test suite (36 test suites, 257 tests) |
| `pnpm lint` | Runs Biome linter across the entire project |
| `pnpm image:ingest` | Runs the automated Sharp-based responsive image generator |

---

## 🌐 Production Deployment

The production deployment is hosted on **Vercel**:
- **Live URL**: [https://storefront-three-tau.vercel.app](https://storefront-three-tau.vercel.app)

To deploy updates:
```bash
cd storefront
npx vercel --prod
```
Or simply push commits to the `main` branch on GitHub.
