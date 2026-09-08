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

## 3. Initial Baseline Results

*(To be captured during baseline production run)*

| Route | Status | TTFB (p75) | LCP (p75) | CLS | Total JS Transferred | DOM Content Loaded |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Homepage** (`/us/en`) | Pending | TBD | TBD | TBD | TBD | TBD |
| **PLP** (`/us/en/products`) | Pending | TBD | TBD | TBD | TBD | TBD |
| **PDP** (`/us/en/products/[slug]`) | Pending | TBD | TBD | TBD | TBD | TBD |
| **Cart** (`/us/en/cart`) | Pending | TBD | TBD | TBD | TBD | TBD |
| **Search** (`/us/en/products?q=...`) | Pending | TBD | TBD | TBD | TBD | TBD |

---

## 4. Bundle Analyzer Baseline

* Next.js bundle analysis report generated via `pnpm --prefix storefront run analyze`.
* Client shared chunk size: TBD
* Initial bundle breakdown documented in `perf/benchmarks/latest-results.json`.
