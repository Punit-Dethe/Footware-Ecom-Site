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

const b64 = process.env.SUPABASE_DB_CA_CERT_BASE64?.trim();
const pem = b64 ? Buffer.from(b64, 'base64').toString('utf8').trim() : undefined;
const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: pem ? { ca: pem, rejectUnauthorized: true } : undefined });

async function main() {
  await db.connect();
  console.log('[db] Connected');

  // 1. product_images existence
  const tableCheck = await db.query(`SELECT to_regclass('public.product_images') as exists`);
  console.log('product_images table exists:', tableCheck.rows[0].exists !== null);

  // 2. If product_images exists, check its row count and dependencies
  if (tableCheck.rows[0].exists) {
    const piCount = await db.query(`SELECT count(*)::int as count FROM public.product_images`);
    console.log('product_images row count:', piCount.rows[0].count);

    // Check FK dependencies on product_images
    const deps = await db.query(`
      SELECT conname, conrelid::regclass as dependent_table
      FROM pg_constraint
      WHERE confrelid = 'public.product_images'::regclass
    `);
    console.log('FK dependencies on product_images:', deps.rows.length === 0 ? 'NONE' : deps.rows);

    // Check view dependencies
    const viewDeps = await db.query(`
      SELECT DISTINCT dependent_ns.nspname as schema, dependent_view.relname as view_name
      FROM pg_depend
      JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
      JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid
      JOIN pg_namespace dependent_ns ON dependent_view.relnamespace = dependent_ns.oid
      WHERE pg_depend.refobjid = 'public.product_images'::regclass
      AND dependent_view.relkind = 'v'
    `);
    console.log('View dependencies on product_images:', viewDeps.rows.length === 0 ? 'NONE' : viewDeps.rows);
  }

  // 3. Migration history (may not exist on all Supabase instances)
  try {
    const migHistory = await db.query(`
      SELECT name, inserted_at FROM supabase_migrations.schema_migrations
      WHERE name LIKE '%product_images%' OR name LIKE '%20260919%'
      ORDER BY inserted_at DESC LIMIT 10
    `);
    console.log('Migration history (product_images / 20260919):');
    for (const m of migHistory.rows) {
      console.log(`  ${m.name} @ ${m.inserted_at}`);
    }
  } catch {
    console.log('Migration history: supabase_migrations.schema_migrations not available on this instance');
  }

  // 4. Table counts
  console.log('\n=== TABLE COUNTS ===');
  for (const t of ['products', 'variants', 'product_media', 'media_assets', 'orders', 'order_items', 'carts', 'cart_items']) {
    const r = await db.query(`SELECT count(*)::int as count FROM public.${t}`);
    console.log(`  ${t}: ${r.rows[0].count}`);
  }

  // 5. Legacy vs canonical breakdown
  const legacyProducts = await db.query(`SELECT count(*)::int as count FROM public.products WHERE slug ~ '^(office|traditional)-footwear-'`);
  const canonicalProducts = await db.query(`SELECT count(*)::int as count FROM public.products WHERE slug ~ '^shoe-2026-09-'`);
  console.log(`\n  legacy products: ${legacyProducts.rows[0].count}`);
  console.log(`  canonical products: ${canonicalProducts.rows[0].count}`);

  // 6. legacy_public media
  const legacyPublic = await db.query(`SELECT count(*)::int as count FROM public.media_assets WHERE storage_provider = 'legacy_public'`);
  console.log(`  legacy_public media_assets: ${legacyPublic.rows[0].count}`);

  // 7. Canonical media health
  const canonicalHeroes = await db.query(`
    SELECT count(*)::int as count FROM public.product_media pm
    JOIN public.media_assets ma ON ma.id = pm.media_asset_id
    JOIN public.products p ON p.id = pm.product_id
    WHERE pm.is_hero = true AND ma.storage_provider = 'supabase'
    AND p.slug ~ '^shoe-2026-09-'
  `);
  console.log(`  canonical products with Supabase hero: ${canonicalHeroes.rows[0].count}`);

  const productsWithMedia = await db.query(`
    SELECT count(DISTINCT pm.product_id)::int as count FROM public.product_media pm
    JOIN public.media_assets ma ON ma.id = pm.media_asset_id
    JOIN public.products p ON p.id = pm.product_id
    WHERE ma.storage_provider != 'legacy_public'
    AND p.slug ~ '^shoe-2026-09-'
  `);
  console.log(`  canonical products with >=1 non-legacy media: ${productsWithMedia.rows[0].count}`);

  // 8. Historical order snapshot analysis
  console.log('\n=== HISTORICAL ORDER STATIC IMAGE REFERENCES ===');
  const catalogShoesInOrders = await db.query(`
    SELECT oi.id, o.order_number, oi.thumbnail_url
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.thumbnail_url LIKE '%catalog-shoes%'
  `);
  console.log(`Order items referencing /catalog-shoes/: ${catalogShoesInOrders.rows.length}`);
  for (const oi of catalogShoesInOrders.rows) {
    console.log(`  order_item=${oi.id}, order=${oi.order_number}, thumbnail=${oi.thumbnail_url}`);
  }

  // 9. Active cart items referencing legacy variants
  console.log('\n=== REMAINING ACTIVE LEGACY CART REFERENCES ===');
  const activeLegacyCartItems = await db.query(`
    SELECT ci.id, ci.cart_id, ci.variant_id, ci.variant_sku, c.status
    FROM public.cart_items ci
    JOIN public.carts c ON c.id = ci.cart_id
    JOIN public.variants v ON v.id = ci.variant_id
    JOIN public.products p ON p.id = v.product_id
    WHERE p.slug ~ '^(office|traditional)-footwear-'
    AND c.status = 'active'
  `);
  console.log(`Active cart items referencing legacy variants: ${activeLegacyCartItems.rows.length}`);

  await db.end();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
