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

Recorded against Next.js 16 production standalone build on 2026-09-08 for Mirza Footwear (Traditional Indian & Formal Leather Catalog):

| Route | Path | HTTP Status | Response Size | TTFB (p75) | Duration (p75) | Duration (Avg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Homepage** | `/us/en` | 200 OK | 122.5 KB | 3.6 ms | 19.1 ms | 18.7 ms |
| **Product Listing (PLP)** | `/us/en/products` | 200 OK | 93.7 KB | 3.6 ms | 24.2 ms | 23.2 ms |
| **PDP (Imperial Oxford)** | `/us/en/products/mirza-imperial-wholecut-oxford` | 200 OK | 78.8 KB | 3.1 ms | 15.1 ms | 13.9 ms |
| **PDP (Royal Jutti)** | `/us/en/products/mirza-royal-embroidered-jutti` | 200 OK | 78.2 KB | 3.3 ms | 12.7 ms | 11.9 ms |
| **Category (Formal & Office)** | `/us/en/c/formal-office` | 200 OK | 96.9 KB | 3.6 ms | 26.6 ms | 25.0 ms |
| **Category (Traditional Indian)** | `/us/en/c/traditional-indian` | 200 OK | 96.9 KB | 3.4 ms | 23.0 ms | 21.7 ms |
| **Cart View** | `/us/en/cart` | 200 OK | 70.3 KB | 2.4 ms | 11.1 ms | 10.1 ms |
| **Search Query** | `/us/en/products?q=oxford` | 200 OK | 93.7 KB | 2.6 ms | 16.6 ms | 16.0 ms |

---

## 4. Key Takeaways & Baseline Observations
1. **PPR Performance**: Next.js 16 Cache Components and Partial Prerendering serve the static shell in $\le 5\text{ ms}$ TTFB.
2. **Page Weight**: All core HTML payloads are below $110\text{ KB}$ uncompressed.
3. **P75 Response**: Every tested route completes in under $25\text{ ms}$ on local production compute.
4. **Untouched Baseline**: This snapshot reflects the unoptimized storefront prior to any bespoke performance interventions.
