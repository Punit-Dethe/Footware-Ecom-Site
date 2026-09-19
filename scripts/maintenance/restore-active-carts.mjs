/**
 * PHASE 9 SUPERVISOR FIX — RESTORE ACTIVE CART ITEMS
 *
 * The Phase 9 cleanup script incorrectly:
 *   1. Deleted 14 cart_items belonging to 13 carts with status='active'
 *   2. Flipped those 13 carts from status='active' to status='abandoned'
 *
 * This script restores:
 *   - 2 legacy products (office-footwear-01, office-footwear-03) needed as FK parents
 *   - 4 legacy variants needed as FK parents for the cart_items
 *   - 14 cart_items with their original IDs, quantities, and timestamps
 *   - 13 carts restored from 'abandoned' back to 'active'
 *
 * These products/variants will remain in the database as "referenced-by-active-cart"
 * rows until a formal guest-cart TTL policy is decided.
 *
 * Usage:
 *   node scripts/maintenance/restore-active-carts.mjs          # DRY RUN
 *   node scripts/maintenance/restore-active-carts.mjs --apply  # EXECUTE
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const storefrontRequire = createRequire(path.join(rootDir, 'storefront', 'package.json'));
const { Client } = storefrontRequire('pg');

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

const isApply = process.argv.includes('--apply');

console.log('================================================================');
console.log(`MIRZA PHASE 9 — RESTORE ACTIVE CART ITEMS (${isApply ? 'APPLY MODE' : 'DRY RUN'})`);
console.log('================================================================');

const b64 = process.env.SUPABASE_DB_CA_CERT_BASE64?.trim();
if (!b64) {
  console.error('Fatal: SUPABASE_DB_CA_CERT_BASE64 not configured.');
  process.exit(1);
}
const pem = Buffer.from(b64, 'base64').toString('utf8').trim();

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { ca: pem, rejectUnauthorized: true },
});

// Products to restore (only those referenced by active cart variants)
const PRODUCTS_TO_RESTORE = [
  {
    id: '8489a205-800d-44a6-9bf2-dd0126925f7c',
    slug: 'office-footwear-01',
    name: 'The Sovereign Wholecut Oxford',
    status: 'archived',
    created_at: '2026-09-12T17:37:09.105Z',
    updated_at: '2026-09-13T16:28:38.545Z',
  },
  {
    id: 'fe296065-fe31-4552-ac7b-3f00c3452e7a',
    slug: 'office-footwear-03',
    name: 'The Kensington Penny Loafer',
    status: 'archived',
    created_at: '2026-09-12T17:37:09.105Z',
    updated_at: '2026-09-13T16:28:38.545Z',
  },
];

// Variants to restore
const VARIANTS_TO_RESTORE = [
  { id: 'a2e11feb-679d-4330-a430-c9efb43554f2', product_id: '8489a205-800d-44a6-9bf2-dd0126925f7c', sku: 'MIRZA-OFF-001-7', size_option: '7', price_in_cents: 28500, quantity_on_hand: 0, is_default: false, active: true },
  { id: '7406f1a7-15a4-4af9-8fb5-d136bbf6392c', product_id: '8489a205-800d-44a6-9bf2-dd0126925f7c', sku: 'MIRZA-OFF-001-8', size_option: '8', price_in_cents: 28500, quantity_on_hand: 0, is_default: true, active: true },
  { id: '1079e406-eb52-4f15-bc90-56dd4a8c3cfc', product_id: 'fe296065-fe31-4552-ac7b-3f00c3452e7a', sku: 'MIRZA-OFF-003-7', size_option: '7', price_in_cents: 24500, quantity_on_hand: 0, is_default: false, active: true },
  { id: 'bf6a9b14-921e-46d8-a114-bfeb01c7ee96', product_id: 'fe296065-fe31-4552-ac7b-3f00c3452e7a', sku: 'MIRZA-OFF-003-8', size_option: '8', price_in_cents: 24500, quantity_on_hand: 0, is_default: true, active: true },
];

// Cart items to restore (only the 14 that were in active carts)
// variant_sku is NOT NULL in the schema, derived from variants backup
const CART_ITEMS_TO_RESTORE = [
  { id: 'f3efb5f4-4cbb-4d9e-acad-c560ba9cdcfd', cart_id: '3c9ae5f6-7d8b-4c4e-a151-18c1d18c7da7', variant_id: 'bf6a9b14-921e-46d8-a114-bfeb01c7ee96', variant_sku: 'MIRZA-OFF-003-8', quantity: 1, created_at: '2026-09-12T16:15:59.204Z' },
  { id: '67348220-7b3b-4984-8102-a8d3165d0eb6', cart_id: '3c9ae5f6-7d8b-4c4e-a151-18c1d18c7da7', variant_id: '1079e406-eb52-4f15-bc90-56dd4a8c3cfc', variant_sku: 'MIRZA-OFF-003-7', quantity: 1, created_at: '2026-09-12T16:00:13.224Z' },
  { id: 'f1bd3716-bacd-4748-b3d4-26c8be95b69d', cart_id: '610d25db-bab6-4d58-9712-d415e6d66882', variant_id: 'a2e11feb-679d-4330-a430-c9efb43554f2', variant_sku: 'MIRZA-OFF-001-7', quantity: 1, created_at: '2026-09-12T18:16:03.356Z' },
  { id: '43ca6dd0-40f4-48e6-bd8a-a78b4384888a', cart_id: '03914136-40cc-480f-acb5-4dde285f6c37', variant_id: 'a2e11feb-679d-4330-a430-c9efb43554f2', variant_sku: 'MIRZA-OFF-001-7', quantity: 2, created_at: '2026-09-12T18:16:03.558Z' },
  { id: 'bb337fc1-5974-4bdb-98f3-82357f3c0b09', cart_id: '86733b77-85a6-42ac-91cb-62e9be112bcd', variant_id: '7406f1a7-15a4-4af9-8fb5-d136bbf6392c', variant_sku: 'MIRZA-OFF-001-8', quantity: 1, created_at: '2026-09-13T11:31:16.388Z' },
  { id: '8137a99f-a77e-4695-974e-bec3e88ad250', cart_id: '90bd1daf-4075-4faf-b2cc-6b4861c96ee1', variant_id: '7406f1a7-15a4-4af9-8fb5-d136bbf6392c', variant_sku: 'MIRZA-OFF-001-8', quantity: 1, created_at: '2026-09-13T11:32:32.761Z' },
  { id: '695d9064-5ba9-4f27-8c4a-22644172fc9c', cart_id: '134ff365-eadf-4d65-9a2d-7c7b124fdc7c', variant_id: '7406f1a7-15a4-4af9-8fb5-d136bbf6392c', variant_sku: 'MIRZA-OFF-001-8', quantity: 1, created_at: '2026-09-13T02:10:59.378Z' },
  { id: 'a0a753e3-5469-40fe-818f-3b073cd32f03', cart_id: '5d886b8d-7563-4ef8-86a3-6c065043e5ee', variant_id: 'a2e11feb-679d-4330-a430-c9efb43554f2', variant_sku: 'MIRZA-OFF-001-7', quantity: 2, created_at: '2026-09-12T23:19:21.625Z' },
  { id: '208f45ac-78c4-4438-82c0-b779ee27b318', cart_id: '7a1e44ac-45c5-43af-b155-6857a77ff186', variant_id: 'a2e11feb-679d-4330-a430-c9efb43554f2', variant_sku: 'MIRZA-OFF-001-7', quantity: 2, created_at: '2026-09-12T23:19:43.210Z' },
  { id: '29e05034-2746-483f-8497-8a7c8e6772f8', cart_id: '98451dfe-d704-48f9-aebc-d0b263d57e6d', variant_id: '7406f1a7-15a4-4af9-8fb5-d136bbf6392c', variant_sku: 'MIRZA-OFF-001-8', quantity: 1, created_at: '2026-09-13T11:24:16.647Z' },
  { id: '0dc61832-66c3-45d0-91d1-70359565bfc5', cart_id: '4828fe2d-773f-444e-bca0-530e2dd32f6c', variant_id: '7406f1a7-15a4-4af9-8fb5-d136bbf6392c', variant_sku: 'MIRZA-OFF-001-8', quantity: 1, created_at: '2026-09-13T11:24:51.505Z' },
  { id: 'a81b13d8-a27b-4722-9cb4-b3e03f936cf4', cart_id: 'da2035c7-4055-412a-997c-176681e8c8c5', variant_id: '7406f1a7-15a4-4af9-8fb5-d136bbf6392c', variant_sku: 'MIRZA-OFF-001-8', quantity: 1, created_at: '2026-09-13T11:25:11.290Z' },
  { id: '9b18afed-d622-49c0-a48c-00fb07e91935', cart_id: '69a88bc9-0b80-49c8-9baf-312cb5385418', variant_id: '7406f1a7-15a4-4af9-8fb5-d136bbf6392c', variant_sku: 'MIRZA-OFF-001-8', quantity: 1, created_at: '2026-09-13T11:25:43.896Z' },
  { id: '4da2615b-dcd2-4548-aca2-bb405db1c324', cart_id: '6f4f0550-178d-4b82-a6ce-a833e56dd204', variant_id: '7406f1a7-15a4-4af9-8fb5-d136bbf6392c', variant_sku: 'MIRZA-OFF-001-8', quantity: 1, created_at: '2026-09-13T11:26:49.108Z' },
];

// Cart IDs to restore from 'abandoned' back to 'active'
const CART_IDS_TO_RESTORE_STATUS = [
  '3c9ae5f6-7d8b-4c4e-a151-18c1d18c7da7',
  '610d25db-bab6-4d58-9712-d415e6d66882',
  '03914136-40cc-480f-acb5-4dde285f6c37',
  '86733b77-85a6-42ac-91cb-62e9be112bcd',
  '90bd1daf-4075-4faf-b2cc-6b4861c96ee1',
  '134ff365-eadf-4d65-9a2d-7c7b124fdc7c',
  '5d886b8d-7563-4ef8-86a3-6c065043e5ee',
  '7a1e44ac-45c5-43af-b155-6857a77ff186',
  '98451dfe-d704-48f9-aebc-d0b263d57e6d',
  '4828fe2d-773f-444e-bca0-530e2dd32f6c',
  'da2035c7-4055-412a-997c-176681e8c8c5',
  '69a88bc9-0b80-49c8-9baf-312cb5385418',
  '6f4f0550-178d-4b82-a6ce-a833e56dd204',
];

async function main() {
  await db.connect();
  console.log('[db] Connected with strict TLS.');

  // PRE-CHECK: Verify the products don't already exist
  const existingProducts = await db.query(
    `SELECT id, slug FROM public.products WHERE id = ANY($1::uuid[])`,
    [PRODUCTS_TO_RESTORE.map(p => p.id)]
  );
  console.log(`[pre-check] Existing product rows for target IDs: ${existingProducts.rows.length}`);

  // PRE-CHECK: Verify the variants don't already exist
  const existingVariants = await db.query(
    `SELECT id, sku FROM public.variants WHERE id = ANY($1::uuid[])`,
    [VARIANTS_TO_RESTORE.map(v => v.id)]
  );
  console.log(`[pre-check] Existing variant rows for target IDs: ${existingVariants.rows.length}`);

  // PRE-CHECK: Verify the cart_items don't already exist
  const existingCartItems = await db.query(
    `SELECT id FROM public.cart_items WHERE id = ANY($1::uuid[])`,
    [CART_ITEMS_TO_RESTORE.map(ci => ci.id)]
  );
  console.log(`[pre-check] Existing cart_item rows for target IDs: ${existingCartItems.rows.length}`);

  // PRE-CHECK: Verify the carts exist and check their current status
  const existingCarts = await db.query(
    `SELECT id, status, user_id FROM public.carts WHERE id = ANY($1::uuid[])`,
    [CART_IDS_TO_RESTORE_STATUS]
  );
  console.log(`[pre-check] Existing carts for status restore: ${existingCarts.rows.length}`);
  for (const c of existingCarts.rows) {
    console.log(`  cart ${c.id}: status=${c.status}, user_id=${c.user_id}`);
  }

  // PRE-CHECK: Verify no orders exist for these cart IDs (they should remain active, not converted)
  const orderCheck = await db.query(
    `SELECT id, source_cart_id, order_number FROM public.orders WHERE source_cart_id = ANY($1::uuid[])`,
    [CART_IDS_TO_RESTORE_STATUS]
  );
  if (orderCheck.rows.length > 0) {
    console.error(`[SAFETY] Found ${orderCheck.rows.length} orders referencing these carts — aborting!`);
    for (const o of orderCheck.rows) {
      console.error(`  order ${o.order_number} -> cart ${o.source_cart_id}`);
    }
    throw new Error('SAFETY: Cannot restore cart status — orders found for these carts.');
  }
  console.log(`[pre-check] No orders reference these 13 carts (safe to restore active status).`);

  console.log('\n[plan] Will restore:');
  console.log(`  ${PRODUCTS_TO_RESTORE.length} products`);
  console.log(`  ${VARIANTS_TO_RESTORE.length} variants`);
  console.log(`  ${CART_ITEMS_TO_RESTORE.length} cart items`);
  console.log(`  ${CART_IDS_TO_RESTORE_STATUS.length} carts → status='active'`);

  if (!isApply) {
    console.log('\n================================================================');
    console.log('DRY RUN COMPLETE — Zero changes applied.');
    console.log('To apply, run with: node scripts/maintenance/restore-active-carts.mjs --apply');
    console.log('================================================================\n');
    await db.end();
    return;
  }

  console.log('\n>>> PROCEEDING WITH --apply <<<');
  await db.query('BEGIN');

  try {
    // 1. Restore products (ON CONFLICT skip in case they already exist)
    for (const p of PRODUCTS_TO_RESTORE) {
      await db.query(`
        INSERT INTO public.products (id, slug, name, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [p.id, p.slug, p.name, p.status, p.created_at, p.updated_at]);
    }
    console.log(`[db] Restored ${PRODUCTS_TO_RESTORE.length} products.`);

    // 2. Restore variants
    for (const v of VARIANTS_TO_RESTORE) {
      await db.query(`
        INSERT INTO public.variants (id, product_id, sku, size_option, price_in_cents, quantity_on_hand, is_default, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [v.id, v.product_id, v.sku, v.size_option, v.price_in_cents, v.quantity_on_hand, v.is_default, v.active]);
    }
    console.log(`[db] Restored ${VARIANTS_TO_RESTORE.length} variants.`);

    // 3. Restore cart items (variant_sku is NOT NULL in schema)
    for (const ci of CART_ITEMS_TO_RESTORE) {
      await db.query(`
        INSERT INTO public.cart_items (id, cart_id, variant_id, variant_sku, quantity, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [ci.id, ci.cart_id, ci.variant_id, ci.variant_sku, ci.quantity, ci.created_at]);
    }
    console.log(`[db] Restored ${CART_ITEMS_TO_RESTORE.length} cart items.`);

    // 4. Restore cart status from 'abandoned' back to 'active'
    const statusRestore = await db.query(`
      UPDATE public.carts
      SET status = 'active'
      WHERE id = ANY($1::uuid[]) AND status = 'abandoned'
    `, [CART_IDS_TO_RESTORE_STATUS]);
    console.log(`[db] Restored ${statusRestore.rowCount} carts from 'abandoned' to 'active'.`);

    await db.query('COMMIT');
    console.log('[db] Restoration transaction COMMITTED successfully.');
  } catch (txErr) {
    await db.query('ROLLBACK');
    console.error('[db] Transaction rolled back due to error:', txErr);
    throw txErr;
  }

  // POST-VERIFICATION
  console.log('\n=== POST-RESTORATION VERIFICATION ===');

  const postProducts = await db.query(
    `SELECT id, slug, status FROM public.products WHERE id = ANY($1::uuid[])`,
    [PRODUCTS_TO_RESTORE.map(p => p.id)]
  );
  console.log(`Restored products: ${postProducts.rows.length} / ${PRODUCTS_TO_RESTORE.length}`);

  const postVariants = await db.query(
    `SELECT id, sku FROM public.variants WHERE id = ANY($1::uuid[])`,
    [VARIANTS_TO_RESTORE.map(v => v.id)]
  );
  console.log(`Restored variants: ${postVariants.rows.length} / ${VARIANTS_TO_RESTORE.length}`);

  const postCartItems = await db.query(
    `SELECT id, cart_id FROM public.cart_items WHERE id = ANY($1::uuid[])`,
    [CART_ITEMS_TO_RESTORE.map(ci => ci.id)]
  );
  console.log(`Restored cart items: ${postCartItems.rows.length} / ${CART_ITEMS_TO_RESTORE.length}`);

  const postCarts = await db.query(
    `SELECT id, status FROM public.carts WHERE id = ANY($1::uuid[])`,
    [CART_IDS_TO_RESTORE_STATUS]
  );
  for (const c of postCarts.rows) {
    console.log(`  cart ${c.id}: status=${c.status}`);
  }
  const allActive = postCarts.rows.every(c => c.status === 'active');
  console.log(`All 13 carts active: ${allActive}`);

  // Verify canonical product count unchanged
  const canonicalCount = await db.query(
    `SELECT count(*)::int as count FROM public.products WHERE slug ~ '^shoe-2026-09-\\d{3}$'`
  );
  console.log(`Canonical products: ${canonicalCount.rows[0].count} (should be 31)`);

  // Verify total product count = 31 canonical + 2 restored legacy
  const totalCount = await db.query(`SELECT count(*)::int as count FROM public.products`);
  console.log(`Total products: ${totalCount.rows[0].count} (should be 33: 31 canonical + 2 active-cart-referenced)`);

  console.log('\n================================================================');
  console.log('MIRZA PHASE 9 — ACTIVE CART RESTORATION COMPLETE');
  console.log('================================================================\n');

  await db.end();
}

main().catch((err) => {
  console.error('Fatal restoration script error:', err);
  process.exit(1);
});
