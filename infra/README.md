# Infrastructure & Deployment Guide

This directory documents the deployment targets, environment topology, and infrastructure configuration for the Mirza high-performance footwear ecommerce platform.

---

## 1. Production Topology: Vercel Serverless Architecture

### Storefront & Application Layer: Vercel (Edge & Node.js Serverless)
* **Production URL**: [https://mirzafootwear.vercel.app](https://mirzafootwear.vercel.app)
* **Framework**: Next.js 16 (App Router + Turbopack + Cache Components)
* **Architecture**: Direct first-party Data Access Layer (DAL) and React Server Actions
  * Bounded-query catalog snapshot with zero DB queries on warm cache and maximum 4 queries on cold.
  * Direct PostgreSQL persistence for orders, addresses, profiles, and cart domain tables.
  * Zero dependency on any external Rails, Spree, or Render backend.
* **Cache Architecture**:
  * Edge caching with canonical cache policies (`s-maxage=86400` for stable catalog; `s-maxage=3600` for catalog content; private `no-store` for cart/checkout).
  * 100% build-time pre-rendered catalog: All 38 product detail pages and 2 category pages pre-rendered via `generateStaticParams()`.
* **Stateful Services**:
  * Auth: Supabase Auth.
  * Media: Supabase Storage `product-media` bucket.
  * Database: Supabase PostgreSQL (`ap-south-1` / Mumbai) with direct pooled connections.

---

## 2. Local Development

Running the application locally requires no Docker or external Rails runtime:
```bash
# From storefront directory:
pnpm dev
```
The Next.js storefront will be immediately available on `http://localhost:3001`.

---

## 3. Production Deployment

The project is configured for continuous deployment on Vercel:
```bash
cd storefront
npx vercel --prod
```
All static pages are compiled and verified during the build step, and deployment completes with sub-second edge cache replication.
