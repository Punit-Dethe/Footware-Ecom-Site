# Baseline Measurement Report (`baseline-v1`)

## 1. Baseline Specification

* **Tag**: `baseline-v1`
* **Commit**: Initial Untouched Storefront Setup
* **Storefront Engine**: Next.js 16 (Turbopack, Cache Components enabled) + React 19 + Tailwind CSS 4
* **Commerce Engine**: Spree Commerce API v3 via `@spree/sdk`
* **Status**: Untouched upstream storefront prior to performance optimizations.

---

## 2. Measurement Protocol

All measurements must be gathered strictly against **production builds**:
```bash
# Build
pnpm --prefix storefront run build

# Start Production Server
pnpm --prefix storefront run start

# Execute Automated Benchmark
node perf/benchmarks/run-benchmark.mjs
```

---

## 3. Initial Baseline Results (`baseline-v1`)

Recorded against Next.js 16 production standalone build on 2026-09-08:

| Route | Path | HTTP Status | Response Size | TTFB (p75) | Duration (p75) | Duration (Avg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Homepage** | `/us/en` | 200 OK | 106.6 KB | 3.4 ms | 18.8 ms | 18.0 ms |
| **Product Listing (PLP)** | `/us/en/products` | 200 OK | 86.4 KB | 3.3 ms | 23.5 ms | 20.8 ms |
| **Product Detail (PDP)** | `/us/en/products/mirza-velocity-carbon-pro` | 200 OK | 78.2 KB | 3.1 ms | 17.0 ms | 13.5 ms |
| **Category View** | `/us/en/c/running` | 200 OK | 89.5 KB | 3.6 ms | 23.9 ms | 20.6 ms |
| **Cart View** | `/us/en/cart` | 200 OK | 69.7 KB | 3.2 ms | 13.4 ms | 12.3 ms |
| **Search Query** | `/us/en/products?q=carbon` | 200 OK | 86.3 KB | 3.2 ms | 21.4 ms | 19.5 ms |

---

## 4. Key Takeaways & Baseline Observations
1. **PPR Performance**: Next.js 16 Cache Components and Partial Prerendering serve the static shell in $\le 5\text{ ms}$ TTFB.
2. **Page Weight**: All core HTML payloads are below $110\text{ KB}$ uncompressed.
3. **P75 Response**: Every tested route completes in under $25\text{ ms}$ on local production compute.
4. **Untouched Baseline**: This snapshot reflects the unoptimized storefront prior to any bespoke performance interventions.
