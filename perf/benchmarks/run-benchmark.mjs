#!/usr/bin/env node
/**
 * Automated Performance Benchmark Harness
 * Measures TTFB, response duration, response size, and latency across runs.
 */

import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.STOREFRONT_URL || 'http://localhost:3001';
const ITERATIONS = parseInt(process.env.BENCHMARK_ITERATIONS || '5', 10);

const ROUTES = [
  { name: 'Homepage', path: '/us/en' },
  { name: 'Products Listing (PLP)', path: '/us/en/products' },
  { name: 'Categories Root', path: '/us/en/categories' },
  { name: 'Cart View', path: '/us/en/cart' },
  { name: 'Search Query', path: '/us/en/products?q=shoe' },
];

async function measureRoute(name, routePath) {
  const url = `${BASE_URL}${routePath}`;
  const timings = [];
  const ttfbs = [];
  let bytes = 0;
  let statusCode = 0;

  // Warmup run
  try {
    const warmRes = await fetch(url);
    await warmRes.arrayBuffer();
  } catch (err) {
    console.warn(`[Warmup Failed] ${url}: ${err.message}`);
  }

  // Iterations
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url);
      const ttfb = performance.now() - start;
      const buffer = await res.arrayBuffer();
      const duration = performance.now() - start;

      timings.push(duration);
      ttfbs.push(ttfb);
      bytes = buffer.byteLength;
      statusCode = res.status;
    } catch (err) {
      timings.push(-1);
      ttfbs.push(-1);
    }
  }

  const validTimings = timings.filter(t => t > 0);
  const validTtfbs = ttfbs.filter(t => t > 0);

  const avgDuration = validTimings.length ? (validTimings.reduce((a, b) => a + b, 0) / validTimings.length).toFixed(1) : 'FAIL';
  const minDuration = validTimings.length ? Math.min(...validTimings).toFixed(1) : 'FAIL';
  const p75Duration = validTimings.length ? validTimings.sort((a, b) => a - b)[Math.floor(validTimings.length * 0.75)].toFixed(1) : 'FAIL';
  const avgTtfb = validTtfbs.length ? (validTtfbs.reduce((a, b) => a + b, 0) / validTtfbs.length).toFixed(1) : 'FAIL';

  return {
    name,
    path: routePath,
    statusCode,
    bytes,
    sizeKb: (bytes / 1024).toFixed(1),
    avgTtfbMs: avgTtfb,
    avgDurationMs: avgDuration,
    minDurationMs: minDuration,
    p75DurationMs: p75Duration,
  };
}

async function run() {
  console.log(`=======================================================`);
  console.log(` Starting Performance Benchmark against: ${BASE_URL}`);
  console.log(` Iterations per route: ${ITERATIONS}`);
  console.log(`=======================================================\n`);

  const results = [];
  for (const route of ROUTES) {
    process.stdout.write(`Testing ${route.name.padEnd(25)} ... `);
    const result = await measureRoute(route.name, route.path);
    results.push(result);
    console.log(`Status: ${result.statusCode} | TTFB: ${result.avgTtfbMs}ms | p75: ${result.p75DurationMs}ms | Size: ${result.sizeKb}KB`);
  }

  console.log(`\n=======================================================`);
  console.log(` Benchmark Summary Table`);
  console.log(`=======================================================`);
  console.table(results.map(r => ({
    Route: r.name,
    Status: r.statusCode,
    'Size (KB)': r.sizeKb,
    'TTFB (ms)': r.avgTtfbMs,
    'Avg Dur (ms)': r.avgDurationMs,
    'p75 Dur (ms)': r.p75DurationMs,
  })));

  const outputPath = path.join(__dirname, 'latest-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

run().catch(console.error);
