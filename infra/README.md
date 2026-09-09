# Infrastructure & Deployment Guide

This directory documents the deployment targets, environment topology, and infrastructure configuration for the Mirza high-performance footwear ecommerce platform.

---

## 1. Active Research Production Topology

### Storefront: Vercel (Edge & Node.js Runtime)
* **Production URL**: [https://storefront-three-tau.vercel.app](https://storefront-three-tau.vercel.app)
* **Target Edge Region**: Mumbai (`bom1`) for low-latency delivery across India.
* **Cache Architecture**: Edge caching via canonical cache policies (`s-maxage=86400` for stable catalog; `s-maxage=3600` for catalog content; strictly private `no-store` for cart/checkout).
* **Environment Configuration**:
  * `SPREE_API_URL`: `https://mirza-spree-backend.onrender.com`
  * `SPREE_PUBLISHABLE_KEY`: `pk_Rwt3f4NsQKSC8v6HLe27ueYx`
  * `NEXT_PUBLIC_SPREE_API_HOST`: `https://mirza-spree-backend.onrender.com`

### Commerce Backend: Official Spree 5 on Render (Docker Web Service)
* **Live Service**: `mirza-spree-backend` ([https://mirza-spree-backend.onrender.com](https://mirza-spree-backend.onrender.com))
* **Runtime**: Official Spree Commerce 5 running on Ruby on Rails 8.1 with Puma 6 web server.
* **Admin Dashboard**: Accessible at `/admin` and `/dashboard` (authenticated via Spree Admin Devise).
* **Memory & Concurrency Tuning**:
  * Single-worker Puma (`WEB_CONCURRENCY=0`) to ensure low memory footprint (<230MB).
  * `SOLID_QUEUE_IN_PUMA=true` (or background worker) for async job handling.
  * Health check probe endpoint: `/up`.

### Persistent Database: Supabase PostgreSQL (`ap-south-1` / Mumbai)
* **Host**: `aws-0-ap-south-1.pooler.supabase.com:5432`
* **Schema**: Full standard Spree 5 relational schema (150+ official tables).
* **Pooler Mode**: Session pooler for persistent backend container connections.
* **Security**: No database credentials committed to repository; configured strictly via environment variables (`sync: false` in Render blueprint).

---

## 2. Local Development Topology (Docker Compose)
* **Spree Backend**: Runs via `ghcr.io/spree/spree:latest` with PostgreSQL 18.
* **Port**: Exposed on `http://localhost:4000`.
* **Database**: `postgres://postgres@postgres:5432/spree_development`.
* **Assets**: Managed via local Active Storage volume mount (`storage_data`).

---

## 3. Alternative Comparison Architectures
* **Fly.io Mumbai (`bom`)**: Evaluated as an alternative persistent container host with co-located Mumbai routing.
* **Supabase Smart CDN / Direct Pre-Generated Storage**: Target media architecture evaluated under Experiments 009–013 for eliminating runtime on-demand image transformation compute.
