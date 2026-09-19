/**
 * MIRZA E-COMMERCE — PRODUCTION HARDENING & SAFE CATALOG CLEANUP
 * Script: scripts/maintenance/cleanup-legacy-catalog.mjs
 *
 * SAFE CART POLICY ENFORCEMENT:
 * - If ANY cart with status = 'active' references a legacy variant or product:
 *     - STOP destructive deletion of that product, variant, or cart item.
 *     - Retain referenced products in status = 'archived' so foreign keys remain valid.
 *     - Perform ZERO deletion of cart_items.
 *     - Perform ZERO update of active carts to abandoned (no automatic abandonment).
 *     - Perform ZERO age-based heuristics.
 * - Deletes ONLY genuinely unreferenced legacy products and variants.
 * - Idempotent: safe to run multiple times without causing data loss or integrity errors.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Configure DNS for Supabase resolution across local and cloud environments
const originalLookup = dns.lookup;
const resolver = new dns.promises.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname && hostname.endsWith('.supabase.co')) {
    resolver.resolve4(hostname).then((ips) => {
      if (options && options.all) {
        callback(null, ips.map((ip) => ({ address: ip, family: 4 })));
      } else {
        callback(null, ips[0], 4);
      }
    }).catch((err) => callback(err));
    return;
  }
  return originalLookup(hostname, options, callback);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const storefrontRequire = createRequire(path.join(rootDir, 'storefront', 'package.json'));
const { Client } = storefrontRequire('pg');
const { createClient } = storefrontRequire('@supabase/supabase-js');

function loadEnv() {
  const candidatePaths = [
    path.join(rootDir, 'storefront', '.env.local'),
    path.join(rootDir, '.env.local'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const isDryRun = !process.argv.includes('--apply');
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'product-media';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!process.env.DATABASE_URL) {
  console.error('[error] DATABASE_URL is not set.');
  process.exit(1);
}
if (!supabaseUrl || !supabaseKey) {
  console.error('[error] Supabase URL or Secret Key is not set.');
  process.exit(1);
}

const b64 = process.env.SUPABASE_DB_CA_CERT_BASE64?.trim();
const pem = b64 ? Buffer.from(b64, 'base64').toString('utf8').trim() : undefined;
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: pem ? { ca: pem, rejectUnauthorized: true } : undefined,
});

const supabase = createClient(supabaseUrl, supabaseKey);

function checkUrlStatus(targetUrl) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 MirzaAudit/1.0',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
      },
      (res) => {
        res.destroy();
        resolve(res.statusCode);
      }
    );
    req.on('error', (err) => reject(err));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${targetUrl}`));
    });
    req.end();
  });
}

const LEGACY_REGEX = /^(office|traditional)-footwear-\d+$/;
const CANONICAL_REGEX = /^shoe-2026-09-\d{3}$/;

async function main() {
  console.log('================================================================');
  console.log(`MIRZA SAFE CATALOG CLEANUP — MODE: ${isDryRun ? 'DRY-RUN (AUDIT ONLY)' : 'APPLY (MUTATION)'}`);
  console.log(`Storage Bucket: ${BUCKET}`);
  console.log('================================================================\n');

  await db.connect();
  console.log('[db] Connected to PostgreSQL.');

  // 1. Inventory products
  const productsRes = await db.query(`
    SELECT id, slug, name, status, created_at
    FROM public.products
    ORDER BY slug ASC
  `);
  const allProducts = productsRes.rows;

  const legacyProducts = allProducts.filter((p) => LEGACY_REGEX.test(p.slug));
  const canonicalProducts = allProducts.filter((p) => CANONICAL_REGEX.test(p.slug));
  const otherProducts = allProducts.filter(
    (p) => !LEGACY_REGEX.test(p.slug) && !CANONICAL_REGEX.test(p.slug)
  );

  console.log(`[audit] Total products in DB: ${allProducts.length}`);
  console.log(`[audit] Legacy products found: ${legacyProducts.length}`);
  console.log(`[audit] Canonical products found: ${canonicalProducts.length}`);
  if (otherProducts.length > 0) {
    console.log(`[audit] Other products found: ${otherProducts.length}`);
  }

  // Safety assertions on canonical products
  if (canonicalProducts.length !== 31) {
    throw new Error(`SAFETY ASSERTION FAILED: Expected exactly 31 canonical products, found ${canonicalProducts.length}`);
  }

  const legacyProductIds = legacyProducts.map((p) => p.id);
  const canonicalProductIds = canonicalProducts.map((p) => p.id);

  // 2. Inventory variants
  let legacyVariants = [];
  if (legacyProductIds.length > 0) {
    const variantsRes = await db.query(`
      SELECT id, product_id, sku, size_option, price_in_cents, quantity_on_hand, is_default, active
      FROM public.variants
      WHERE product_id = ANY($1::uuid[])
      ORDER BY sku ASC
    `, [legacyProductIds]);
    legacyVariants = variantsRes.rows;
  }
  const legacyVariantIds = legacyVariants.map((v) => v.id);
  console.log(`[audit] Legacy variants count: ${legacyVariants.length}`);

  // 3. SAFE CART POLICY: Audit active cart references
  let activeCartItems = [];
  if (legacyVariantIds.length > 0) {
    const activeCartItemsRes = await db.query(`
      SELECT ci.id, ci.cart_id, ci.variant_id, ci.quantity, ci.created_at,
             c.status as cart_status, c.user_id, c.updated_at as cart_updated_at,
             v.product_id, v.sku
      FROM public.cart_items ci
      JOIN public.carts c ON c.id = ci.cart_id
      JOIN public.variants v ON v.id = ci.variant_id
      WHERE ci.variant_id = ANY($1::uuid[])
      AND c.status = 'active'
    `, [legacyVariantIds]);
    activeCartItems = activeCartItemsRes.rows;
  }

  console.log(`\n=== SAFE CART POLICY ENFORCEMENT ===`);
  console.log(`Active carts referencing legacy variants: ${activeCartItems.length} cart items across ${new Set(activeCartItems.map((ci) => ci.cart_id)).size} carts.`);

  // Identify protected legacy products and variants
  const protectedProductIds = new Set(activeCartItems.map((ci) => ci.product_id));
  const protectedVariantIds = new Set(activeCartItems.map((ci) => ci.variant_id));

  console.log(`Protected legacy products (FK referenced by active carts): ${protectedProductIds.size}`);
  for (const pid of protectedProductIds) {
    const prod = legacyProducts.find((p) => p.id === pid);
    console.log(`  - Protected product: ${prod ? prod.slug : pid} (${pid})`);
  }
  console.log(`Protected legacy variants: ${protectedVariantIds.size}`);

  // Determine which legacy items are truly unreferenced and eligible for deletion
  const unreferencedProducts = legacyProducts.filter((p) => !protectedProductIds.has(p.id));
  const unreferencedVariants = legacyVariants.filter((v) => !protectedVariantIds.has(v.id));
  const unreferencedProductIds = unreferencedProducts.map((p) => p.id);
  const unreferencedVariantIds = unreferencedVariants.map((v) => v.id);

  console.log(`Unreferenced legacy products eligible for deletion: ${unreferencedProducts.length}`);
  console.log(`Unreferenced legacy variants eligible for deletion: ${unreferencedVariants.length}`);

  // 4. Verify canonical hero images health
  const canonicalHeroesRes = await db.query(`
    SELECT pm.product_id, p.slug, ma.storage_provider, ma.storage_path
    FROM public.product_media pm
    JOIN public.media_assets ma ON ma.id = pm.media_asset_id
    JOIN public.products p ON p.id = pm.product_id
    WHERE pm.product_id = ANY($1::uuid[]) AND pm.is_hero = true AND ma.storage_provider = 'supabase'
  `, [canonicalProductIds]);
  console.log(`[audit] Canonical products with Supabase managed hero: ${canonicalHeroesRes.rows.length} / 31`);
  if (canonicalHeroesRes.rows.length !== 31) {
    throw new Error(`SAFETY ASSERTION FAILED: Expected 31 canonical heroes, found ${canonicalHeroesRes.rows.length}`);
  }

  // 5. Verify historical order items referencing static images
  const catalogShoesInOrdersRes = await db.query(`
    SELECT oi.id, oi.order_id, oi.product_name, oi.sku, oi.thumbnail_url, o.order_number
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.thumbnail_url LIKE '%catalog-shoes%'
  `);
  console.log(`[audit] Order items referencing /catalog-shoes/: ${catalogShoesInOrdersRes.rows.length}`);

  // 6. Verify zero destructive mutations if nothing to delete
  if (unreferencedProducts.length === 0 && unreferencedVariants.length === 0) {
    console.log('\n[status] All unreferenced legacy products and variants have already been cleaned up.');
    console.log(`[status] Intentionally retained protected legacy products: ${protectedProductIds.size}`);
    console.log(`[status] Zero destructive actions required.`);
    await db.end();
    return;
  }

  if (isDryRun) {
    console.log('\n================================================================');
    console.log('DRY RUN COMPLETE — Zero destructive changes executed.');
    console.log(`Safe cleanup would retain ${protectedProductIds.size} protected products and delete ${unreferencedProducts.length} unreferenced products.`);
    console.log('To apply, run with --apply');
    console.log('================================================================\n');
    await db.end();
    return;
  }

  // ============================================================================
  // APPLY EXECUTION (SAFE CART POLICY RESPECTED)
  // ============================================================================
  console.log('\n>>> PROCEEDING WITH SAFE --apply MUTATION <<<');

  // STEP 1: Archive protected products if not already archived
  if (protectedProductIds.size > 0) {
    const archiveRes = await db.query(`
      UPDATE public.products
      SET status = 'archived', updated_at = NOW()
      WHERE id = ANY($1::uuid[]) AND status != 'archived'
    `, [[...protectedProductIds]]);
    console.log(`[db] Ensured ${archiveRes.rowCount} protected products are in 'archived' status.`);
  }

  // STEP 2: Deletion transaction for ONLY unreferenced lineage
  console.log('[db] Starting safe deletion transaction for unreferenced lineage...');
  await db.query('BEGIN');

  try {
    // 2a. Delete unreferenced product_categories
    if (unreferencedProductIds.length > 0) {
      const delPc = await db.query(`
        DELETE FROM public.product_categories
        WHERE product_id = ANY($1::uuid[])
      `, [unreferencedProductIds]);
      console.log(`[db] Deleted ${delPc.rowCount} unreferenced product_categories.`);
    }

    // 2b. Delete unreferenced product_media
    if (unreferencedProductIds.length > 0) {
      const delPm = await db.query(`
        DELETE FROM public.product_media
        WHERE product_id = ANY($1::uuid[])
      `, [unreferencedProductIds]);
      console.log(`[db] Deleted ${delPm.rowCount} unreferenced product_media.`);
    }

    // 2c. Delete unreferenced variants
    if (unreferencedProductIds.length > 0) {
      const delVariants = await db.query(`
        DELETE FROM public.variants
        WHERE product_id = ANY($1::uuid[]) AND id != ALL($2::uuid[])
      `, [unreferencedProductIds, [...protectedVariantIds]]);
      console.log(`[db] Deleted ${delVariants.rowCount} unreferenced variants.`);
    }

    // 2d. Delete unreferenced products
    if (unreferencedProductIds.length > 0) {
      const delProds = await db.query(`
        DELETE FROM public.products
        WHERE id = ANY($1::uuid[]) AND id != ALL($2::uuid[])
      `, [unreferencedProductIds, [...protectedProductIds]]);
      console.log(`[db] Deleted ${delProds.rowCount} unreferenced products.`);
    }

    await db.query('COMMIT');
    console.log('[db] Safe deletion transaction COMMITTED successfully.');
  } catch (txErr) {
    await db.query('ROLLBACK');
    console.error('[db] Transaction rolled back due to error:', txErr);
    throw txErr;
  }

  // Post-verification
  const postAllCarts = await db.query(`SELECT count(*)::int as count FROM public.carts WHERE status = 'active'`);
  console.log(`[verify] Active carts count preserved: ${postAllCarts.rows[0].count}`);

  const postLegacy = await db.query(`
    SELECT count(*)::int as count FROM public.products WHERE slug ~ '^(office|traditional)-footwear-\\d+$'
  `);
  console.log(`[verify] Remaining legacy products: ${postLegacy.rows[0].count} (protected by active carts)`);

  const postCanonical = await db.query(`
    SELECT count(*)::int as count FROM public.products WHERE slug ~ '^shoe-2026-09-\\d{3}$'
  `);
  console.log(`[verify] Canonical products in DB: ${postCanonical.rows[0].count} (expected: 31)`);

  console.log('\n================================================================');
  console.log('SAFE CATALOG CLEANUP COMPLETE — ALL ACTIVE CARTS PRESERVED');
  console.log('================================================================\n');

  await db.end();
}

main().catch((err) => {
  console.error('Fatal cleanup script error:', err);
  process.exit(1);
});
