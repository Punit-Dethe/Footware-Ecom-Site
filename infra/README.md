# Infrastructure & Deployment Guide

This directory documents the deployment targets and configuration topology for the high-performance footwear ecommerce platform.

## 1. Local Development (Docker Compose)
* **Spree Backend**: Runs on `ghcr.io/spree/spree:latest` with PostgreSQL 18.
* **Port**: Exposed on `http://localhost:4000`.
* **Database**: `postgres://postgres@postgres:5432/spree_development`.
* **Assets**: Managed via Active Storage volume mount (`storage_data`).

## 2. Production Deployment Topology (India Region Benchmark)

### Database: Supabase PostgreSQL (`ap-south-1` / Mumbai)
* Managed PostgreSQL instance located in Mumbai to minimize latency to the Spree container.
* Spree maintains persistent pool connections directly to PostgreSQL.
* Spree migrations and schema belong strictly to Spree.

### Backend: Fly.io Mumbai (`bom`)
* Persistent Docker container running Spree with Puma and Solid Queue in-process.
* Internal private network connection to Supabase.

### Storefront: Vercel (Node Runtime)
* Target compute region: Mumbai where applicable for SSR / dynamic Server Actions.
* Static shell, cached catalog pages, and optimized images are distributed globally across Vercel CDN edges.

### Media: Object Storage (Cloudflare R2 or AWS S3)
* Original product imagery stored on S3-compatible storage.
* Delivered and dynamically transformed via Next.js image optimization (`next/image`).
