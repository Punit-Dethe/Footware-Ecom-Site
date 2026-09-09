# Infrastructure & Deployment Guide

This directory documents the deployment targets, environment topology, and infrastructure configuration for the Mirza high-performance footwear ecommerce platform.

---

## 1. Production Topology: Vercel Serverless Architecture

### Storefront & BFF: Vercel (Edge & Node.js Serverless)
* **Production URL**: [https://storefront-three-tau.vercel.app](https://storefront-three-tau.vercel.app)
* **Framework**: Next.js 16 (App Router + Turbopack + Cache Components)
* **Backend Model**: Next.js App Router BFF (Backend-For-Frontend)
  * Spree-compatible Store API route handlers located at `/api/v3/store/*`.
  * In-memory zero-latency catalog data repository with 38 catalog products and 2 categories (`Office Wear` and `Traditional`).
  * 0ms network latency for all server-side rendering and static page generation.
* **Cache Architecture**:
  * Edge caching with canonical cache policies (`s-maxage=86400` for stable catalog; `s-maxage=3600` for catalog content; private `no-store` for cart/checkout).
  * 100% build-time pre-rendered catalog: All 38 product detail pages and 2 category pages pre-rendered via `generateStaticParams()`.
* **Stateful Services**:
  * Instant client-side & serverless cart (0ms latency).
  * Database: Supabase PostgreSQL (`ap-south-1` / Mumbai) for persistent customer/order storage.

---

## 2. Local Development

Running the application locally requires no Docker or external Rails runtime:
```bash
# From repository root:
pnpm install
pnpm dev
```
Both the Next.js storefront and the Spree-compatible API route handler will be immediately available on `http://localhost:3001`.

---

## 3. Production Deployment

The project is configured for continuous deployment on Vercel:
```bash
cd storefront
npx vercel --prod
```
All static pages are compiled and verified during the build step, and deployment completes with sub-second edge cache replication.
