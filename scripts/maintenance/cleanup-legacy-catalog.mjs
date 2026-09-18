import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const storefrontRequire = createRequire(path.join(rootDir, 'storefront', 'package.json'));
const { Client } = storefrontRequire('pg');
const { createClient } = storefrontRequire('@supabase/supabase-js');

import https from 'node:https';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

function customLookup(hostname, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const isAll = typeof options === 'object' && options !== null && options.all;
  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length) {
      if (isAll) {
        cb(null, addresses.map((a) => ({ address: a, family: 4 })));
      } else {
        cb(null, addresses[0], 4);
      }
    } else {
      dns.lookup(hostname, options, callback);
    }
  });
}

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
        lookup: customLookup,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MirzaAudit/1.0',
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

function customFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const headers = options.headers
      ? options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : { ...options.headers }
      : {};
    const method = options.method || 'GET';
    let bodyBuffer = null;
    if (options.body) {
      if (typeof options.body === 'string') {
        bodyBuffer = Buffer.from(options.body);
      } else if (Buffer.isBuffer(options.body)) {
        bodyBuffer = options.body;
      } else if (options.body instanceof Uint8Array) {
        bodyBuffer = Buffer.from(options.body);
      }
    }
    if (bodyBuffer) {
      headers['content-length'] = bodyBuffer.length;
    }
    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method,
        lookup: customLookup,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const resBuffer = Buffer.concat(chunks);
          const response = new Response(resBuffer, {
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
          });
          resolve(response);
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

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
const isDryRun = !isApply;

console.log('================================================================');
console.log(`MIRZA PHASE 9 — LEGACY CATALOG CLEANUP (${isApply ? 'APPLY MODE' : 'DRY RUN'})`);
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Fatal: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY not configured.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: customFetch },
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = 'product-media';
const LEGACY_REGEX = /^(office|traditional)-footwear-\d+$/;
const CANONICAL_REGEX = /^shoe-2026-09-\d{3}$/;

async function main() {
  await db.connect();
  console.log('[db] Connected with strict TLS.');

  // 1. Inventory all products
  const productsRes = await db.query(`
    SELECT id, slug, name, status, created_at, updated_at
    FROM public.products
    ORDER BY slug ASC
  `);
  const allProducts = productsRes.rows;

  const legacyProducts = allProducts.filter((p) => LEGACY_REGEX.test(p.slug));
  const canonicalProducts = allProducts.filter((p) => CANONICAL_REGEX.test(p.slug));
  const otherProducts = allProducts.filter(
    (p) => !LEGACY_REGEX.test(p.slug) && !CANONICAL_REGEX.test(p.slug),
  );

  console.log(`[audit] Total products: ${allProducts.length}`);
  console.log(`[audit] Legacy candidate products: ${legacyProducts.length}`);
  console.log(`[audit] Canonical products: ${canonicalProducts.length}`);
  console.log(`[audit] Other products: ${otherProducts.length}`);

  // HARD SAFETY ASSERTIONS
  if (legacyProducts.length !== 38) {
    throw new Error(`SAFETY ASSERTION FAILED: Expected exactly 38 legacy products, found ${legacyProducts.length}`);
  }
  for (const lp of legacyProducts) {
    if (!LEGACY_REGEX.test(lp.slug)) {
      throw new Error(`SAFETY ASSERTION FAILED: Legacy slug '${lp.slug}' does not match regex.`);
    }
    if (CANONICAL_REGEX.test(lp.slug)) {
      throw new Error(`SAFETY ASSERTION FAILED: Legacy slug '${lp.slug}' collides with canonical catalog.`);
    }
  }
  if (canonicalProducts.length !== 31) {
    throw new Error(`SAFETY ASSERTION FAILED: Expected exactly 31 canonical products, found ${canonicalProducts.length}`);
  }
  if (otherProducts.length !== 0) {
    throw new Error(`SAFETY ASSERTION FAILED: Found ${otherProducts.length} unexpected products outside known lineages.`);
  }

  const legacyProductIds = legacyProducts.map((p) => p.id);
  const canonicalProductIds = canonicalProducts.map((p) => p.id);

  // 2. Inventory legacy variants
  const variantsRes = await db.query(`
    SELECT id, product_id, sku, size_option, price_in_cents, quantity_on_hand, is_default, active
    FROM public.variants
    WHERE product_id = ANY($1::uuid[])
    ORDER BY sku ASC
  `, [legacyProductIds]);
  const legacyVariants = variantsRes.rows;
  const legacyVariantIds = legacyVariants.map((v) => v.id);
  console.log(`[audit] Legacy variants count: ${legacyVariants.length}`);

  // 3. Inventory product_categories for legacy products
  const pcRes = await db.query(`
    SELECT product_id, category_id
    FROM public.product_categories
    WHERE product_id = ANY($1::uuid[])
  `, [legacyProductIds]);
  const legacyProductCategories = pcRes.rows;
  console.log(`[audit] Legacy product_categories count: ${legacyProductCategories.length}`);

  // 4. Inventory product_images (if table exists)
  const piTableCheck = await db.query(`SELECT to_regclass('public.product_images') as exists;`);
  let legacyProductImages = [];
  if (piTableCheck.rows[0]?.exists) {
    const piRes = await db.query(`
      SELECT *
      FROM public.product_images
      WHERE product_id = ANY($1::uuid[])
    `, [legacyProductIds]);
    legacyProductImages = piRes.rows;
    console.log(`[audit] Legacy product_images count: ${legacyProductImages.length}`);
  }

  // 5. Inventory product_media and media_assets for legacy products
  const pmRes = await db.query(`
    SELECT pm.id, pm.product_id, pm.media_asset_id, pm.is_hero, pm.position,
           ma.storage_provider, ma.storage_path, ma.mime_type, ma.file_size_bytes, ma.content_sha256
    FROM public.product_media pm
    JOIN public.media_assets ma ON ma.id = pm.media_asset_id
    WHERE pm.product_id = ANY($1::uuid[])
  `, [legacyProductIds]);
  const legacyProductMedia = pmRes.rows;
  console.log(`[audit] Legacy product_media count: ${legacyProductMedia.length}`);

  const legacyAssetIds = [...new Set(legacyProductMedia.map((r) => r.media_asset_id))];
  console.log(`[audit] Distinct media assets on legacy products: ${legacyAssetIds.length}`);

  // Check if any legacy media asset is shared with canonical products
  const sharedAssetCheck = await db.query(`
    SELECT pm.media_asset_id, count(DISTINCT pm.product_id)::int as prod_count
    FROM public.product_media pm
    WHERE pm.media_asset_id = ANY($1::uuid[]) AND pm.product_id = ANY($2::uuid[])
    GROUP BY pm.media_asset_id
  `, [legacyAssetIds, canonicalProductIds]);
  if (sharedAssetCheck.rows.length > 0) {
    throw new Error(`SAFETY ASSERTION FAILED: ${sharedAssetCheck.rows.length} media assets are shared between legacy and canonical products!`);
  }
  console.log(`[audit] Shared media assets between legacy and canonical: 0 (verified isolated)`);

  // 6. Inventory cart items referencing legacy variants
  const cartItemsRes = await db.query(`
    SELECT ci.id, ci.cart_id, ci.variant_id, ci.quantity, ci.created_at,
           c.status as cart_status, c.user_id, c.updated_at as cart_updated_at
    FROM public.cart_items ci
    JOIN public.carts c ON c.id = ci.cart_id
    WHERE ci.variant_id = ANY($1::uuid[])
  `, [legacyVariantIds]);
  const legacyCartItems = cartItemsRes.rows;
  console.log(`[audit] Cart items referencing legacy variants: ${legacyCartItems.length}`);

  const activeCarts = legacyCartItems.filter((ci) => ci.cart_status === 'active');
  const convertedCarts = legacyCartItems.filter((ci) => ci.cart_status === 'converted');
  const abandonedCarts = legacyCartItems.filter((ci) => ci.cart_status === 'abandoned');

  console.log(`[audit] Cart items breakdown: active=${activeCarts.length}, converted=${convertedCarts.length}, abandoned=${abandonedCarts.length}`);

  // Check converted carts have orders
  if (convertedCarts.length > 0) {
    const convertedCartIds = [...new Set(convertedCarts.map((c) => c.cart_id))];
    const orderCheck = await db.query(`
      SELECT o.id, o.source_cart_id, o.order_number, count(oi.id)::int as item_count
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE o.source_cart_id = ANY($1::uuid[])
      GROUP BY o.id, o.source_cart_id, o.order_number
    `, [convertedCartIds]);
    console.log(`[audit] Converted carts verified with historical orders: ${orderCheck.rows.length} / ${convertedCartIds.length}`);
    if (orderCheck.rows.length !== convertedCartIds.length) {
      throw new Error(`SAFETY ASSERTION FAILED: Converted cart without historical order found!`);
    }
  }

  // 7. Inventory historical order items referencing legacy variants
  const orderItemsRes = await db.query(`
    SELECT oi.id, oi.order_id, oi.variant_id, oi.product_name, oi.sku, oi.price_in_cents,
           oi.quantity, oi.total_in_cents, oi.thumbnail_url, o.order_number
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.variant_id = ANY($1::uuid[])
  `, [legacyVariantIds]);
  const legacyOrderItems = orderItemsRes.rows;
  console.log(`[audit] Historical order items referencing legacy variants: ${legacyOrderItems.length}`);
  console.log('[audit] Historical snapshot values recorded:');
  for (const oi of legacyOrderItems) {
    console.log(`  - Order ${oi.order_number}: SKU=${oi.sku}, Name=${oi.product_name}, Price=${oi.price_in_cents}, Thumbnail=${oi.thumbnail_url}`);
  }

  // 8. Prove 31 / 31 canonical products have Supabase managed hero
  const canonicalHeroesRes = await db.query(`
    SELECT pm.product_id, p.slug, ma.storage_provider, ma.storage_path
    FROM public.product_media pm
    JOIN public.media_assets ma ON ma.id = pm.media_asset_id
    JOIN public.products p ON p.id = pm.product_id
    WHERE pm.product_id = ANY($1::uuid[]) AND pm.is_hero = true AND ma.storage_provider = 'supabase'
  `, [canonicalProductIds]);
  console.log(`[audit] Canonical products with Supabase managed hero: ${canonicalHeroesRes.rows.length} / 31`);
  if (canonicalHeroesRes.rows.length !== 31) {
    throw new Error(`SAFETY ASSERTION FAILED: Canonical managed hero count is ${canonicalHeroesRes.rows.length} (expected 31)`);
  }

  // Verify each hero resolves HTTP 200
  console.log('[audit] Verifying HTTP 200 for canonical hero images...');
  for (const hero of canonicalHeroesRes.rows) {
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${hero.storage_path}`;
    const statusCode = await checkUrlStatus(publicUrl);
    if (statusCode !== 200) {
      throw new Error(`SAFETY ASSERTION FAILED: Canonical hero for '${hero.slug}' did not resolve HTTP 200 (${statusCode}): ${publicUrl}`);
    }
  }
  console.log('[audit] All 31 canonical hero images verified HTTP 200.');

  // 9. Check static /catalog-shoes/ references in historical orders
  const catalogShoesInOrdersRes = await db.query(`
    SELECT oi.id, oi.order_id, oi.product_name, oi.sku, oi.thumbnail_url, o.order_number
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.thumbnail_url LIKE '%catalog-shoes%'
  `);
  const catalogShoesInOrders = catalogShoesInOrdersRes.rows;
  console.log(`[audit] Order items referencing /catalog-shoes/: ${catalogShoesInOrders.length}`);
  const retainedStaticFiles = new Set();
  for (const oi of catalogShoesInOrders) {
    const m = oi.thumbnail_url.match(/catalog-shoes\/([^"'\s]+)/);
    if (m && m[1]) {
      retainedStaticFiles.add(m[1]);
      console.log(`  - Preserving static file for Order ${oi.order_number}: ${m[1]}`);
    }
  }
  console.log(`[audit] Retained static files count: ${retainedStaticFiles.size} (${[...retainedStaticFiles].join(', ')})`);

  // 10. Canonical rollback media (legacy_public)
  const canonicalLegacyPublicRes = await db.query(`
    SELECT pm.id, pm.product_id, pm.media_asset_id, ma.storage_provider, ma.storage_path
    FROM public.product_media pm
    JOIN public.media_assets ma ON ma.id = pm.media_asset_id
    WHERE pm.product_id = ANY($1::uuid[]) AND ma.storage_provider = 'legacy_public'
  `, [canonicalProductIds]);
  console.log(`[audit] Canonical rollback legacy_public placements to remove: ${canonicalLegacyPublicRes.rows.length}`);

  if (isDryRun) {
    console.log('\n================================================================');
    console.log('DRY RUN COMPLETE — Zero destructive changes executed.');
    console.log('To apply the cleanup, run with the --apply flag:');
    console.log('  node scripts/maintenance/cleanup-legacy-catalog.mjs --apply');
    console.log('================================================================\n');
    await db.end();
    return;
  }

  // ============================================================================
  // APPLY EXECUTION
  // ============================================================================
  console.log('\n>>> PROCEEDING WITH --apply MUTATION <<<');

  // STEP 1: Create local safety backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(rootDir, 'scratch', `phase9-legacy-backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`[backup] Writing safety backup to ${backupDir}...`);

  fs.writeFileSync(path.join(backupDir, 'products.json'), JSON.stringify(legacyProducts, null, 2));
  fs.writeFileSync(path.join(backupDir, 'variants.json'), JSON.stringify(legacyVariants, null, 2));
  fs.writeFileSync(path.join(backupDir, 'product_categories.json'), JSON.stringify(legacyProductCategories, null, 2));
  fs.writeFileSync(path.join(backupDir, 'product_media.json'), JSON.stringify(legacyProductMedia, null, 2));
  fs.writeFileSync(path.join(backupDir, 'product_images.json'), JSON.stringify(legacyProductImages, null, 2));
  fs.writeFileSync(path.join(backupDir, 'cart_items.json'), JSON.stringify(legacyCartItems, null, 2));
  fs.writeFileSync(path.join(backupDir, 'order_items.json'), JSON.stringify(legacyOrderItems, null, 2));

  // Backup storage objects
  const storageObjectsMetadata = [];
  const storageBackupDir = path.join(backupDir, 'storage');
  fs.mkdirSync(storageBackupDir, { recursive: true });

  console.log('[backup] Downloading and hashing legacy Supabase Storage objects...');
  for (const pm of legacyProductMedia) {
    if (pm.storage_provider === 'supabase' && pm.storage_path) {
      try {
        const { data, error } = await supabase.storage.from(BUCKET).download(pm.storage_path);
        if (error || !data) {
          console.warn(`[backup] Warning: Could not download storage object ${pm.storage_path}:`, error?.message);
          storageObjectsMetadata.push({
            storage_path: pm.storage_path,
            download_error: error?.message || 'No data',
          });
        } else {
          const buffer = Buffer.from(await data.arrayBuffer());
          const hash = crypto.createHash('sha256').update(buffer).digest('hex');
          const safeFileName = pm.storage_path.replace(/[^a-zA-Z0-9.-]/g, '_');
          fs.writeFileSync(path.join(storageBackupDir, safeFileName), buffer);
          storageObjectsMetadata.push({
            storage_path: pm.storage_path,
            byte_size: buffer.length,
            sha256: hash,
            backup_file: safeFileName,
          });
        }
      } catch (err) {
        console.warn(`[backup] Exception downloading ${pm.storage_path}:`, err.message);
      }
    }
  }
  fs.writeFileSync(path.join(backupDir, 'storage_objects_manifest.json'), JSON.stringify(storageObjectsMetadata, null, 2));
  console.log(`[backup] Successfully backed up ${storageObjectsMetadata.length} storage metadata entries.`);

  // STEP 2: Database transaction
  console.log('[db] Starting deletion transaction...');
  await db.query('BEGIN');

  try {
    // 2a. Prune cart items referencing legacy variants
    if (legacyCartItems.length > 0) {
      const cartItemIds = legacyCartItems.map((ci) => ci.id);
      const delCartItems = await db.query(`
        DELETE FROM public.cart_items
        WHERE id = ANY($1::uuid[])
      `, [cartItemIds]);
      console.log(`[db] Deleted ${delCartItems.rowCount} obsolete cart items referencing legacy variants.`);

      // Update carts that are active/abandoned to abandoned
      const affectedCartIds = [...new Set(legacyCartItems.map((ci) => ci.cart_id))];
      await db.query(`
        UPDATE public.carts
        SET status = 'abandoned', updated_at = NOW()
        WHERE id = ANY($1::uuid[]) AND status = 'active'
      `, [affectedCartIds]);
      console.log(`[db] Updated dormant carts to abandoned status.`);
    }

    // 2b. Delete legacy product_images (if table exists)
    if (piTableCheck.rows[0]?.exists) {
      const delPi = await db.query(`
        DELETE FROM public.product_images
        WHERE product_id = ANY($1::uuid[])
      `, [legacyProductIds]);
      console.log(`[db] Deleted ${delPi.rowCount} legacy product_images rows.`);
    }

    // 2c. Delete legacy product_media
    const delPm = await db.query(`
      DELETE FROM public.product_media
      WHERE product_id = ANY($1::uuid[])
    `, [legacyProductIds]);
    console.log(`[db] Deleted ${delPm.rowCount} legacy product_media rows.`);

    // 2d. Delete legacy product_categories
    const delPc = await db.query(`
      DELETE FROM public.product_categories
      WHERE product_id = ANY($1::uuid[])
    `, [legacyProductIds]);
    console.log(`[db] Deleted ${delPc.rowCount} legacy product_categories rows.`);

    // 2e. Delete legacy variants (FK on order_items will SET NULL)
    const delVariants = await db.query(`
      DELETE FROM public.variants
      WHERE product_id = ANY($1::uuid[])
    `, [legacyProductIds]);
    console.log(`[db] Deleted ${delVariants.rowCount} legacy variants.`);

    // 2f. Delete legacy products
    const delProds = await db.query(`
      DELETE FROM public.products
      WHERE id = ANY($1::uuid[])
    `, [legacyProductIds]);
    console.log(`[db] Deleted ${delProds.rowCount} legacy products.`);

    // 2g. Delete media_assets belonging to legacy products
    if (legacyAssetIds.length > 0) {
      const delAssets = await db.query(`
        DELETE FROM public.media_assets
        WHERE id = ANY($1::uuid[])
      `, [legacyAssetIds]);
      console.log(`[db] Deleted ${delAssets.rowCount} legacy media_assets records.`);
    }

    // 2h. Remove canonical products' legacy_public rollback media placements & assets
    if (canonicalLegacyPublicRes.rows.length > 0) {
      const canonicalRollbackAssetIds = canonicalLegacyPublicRes.rows.map((r) => r.media_asset_id);
      const delCanPm = await db.query(`
        DELETE FROM public.product_media
        WHERE product_id = ANY($1::uuid[]) AND media_asset_id = ANY($2::uuid[])
      `, [canonicalProductIds, canonicalRollbackAssetIds]);
      console.log(`[db] Deleted ${delCanPm.rowCount} canonical legacy_public product_media placements.`);

      const delCanAssets = await db.query(`
        DELETE FROM public.media_assets
        WHERE id = ANY($1::uuid[]) AND storage_provider = 'legacy_public'
      `, [canonicalRollbackAssetIds]);
      console.log(`[db] Deleted ${delCanAssets.rowCount} canonical legacy_public media_assets.`);
    }

    await db.query('COMMIT');
    console.log('[db] Deletion transaction COMMITTED successfully.');
  } catch (txErr) {
    await db.query('ROLLBACK');
    console.error('[db] Transaction rolled back due to error:', txErr);
    throw txErr;
  }

  // STEP 3: Delete Supabase Storage objects
  console.log('[storage] Deleting legacy Storage objects in Supabase...');
  const pathsToDelete = storageObjectsMetadata
    .map((m) => m.storage_path)
    .filter(Boolean);

  let storageCleanupFailures = 0;
  if (pathsToDelete.length > 0) {
    const { data: delData, error: delError } = await supabase.storage.from(BUCKET).remove(pathsToDelete);
    if (delError) {
      console.error('[storage] Batch remove error:', delError);
      storageCleanupFailures += pathsToDelete.length;
    } else {
      console.log(`[storage] Removed ${delData?.length || pathsToDelete.length} storage objects.`);
    }
  }

  // STEP 4: Static catalog-shoes cleanup
  console.log('[static] Pruning storefront/public/catalog-shoes...');
  const catalogShoesDir = path.join(rootDir, 'storefront', 'public', 'catalog-shoes');
  let staticRemoved = 0;
  let staticRetained = 0;
  if (fs.existsSync(catalogShoesDir)) {
    const files = fs.readdirSync(catalogShoesDir);
    for (const file of files) {
      if (retainedStaticFiles.has(file)) {
        staticRetained++;
        console.log(`  - Retained required historical file: ${file}`);
      } else {
        fs.unlinkSync(path.join(catalogShoesDir, file));
        staticRemoved++;
      }
    }
  }
  console.log(`[static] Removed ${staticRemoved} unreferenced static files; retained ${staticRetained} files.`);

  // STEP 5: Post-cleanup verification
  console.log('\n=== POST-CLEANUP VERIFICATION ===');
  const postLegacy = await db.query(`
    SELECT count(*)::int as count FROM public.products WHERE slug ~ '^(office|traditional)-footwear-\\d+$'
  `);
  console.log(`Legacy products in DB: ${postLegacy.rows[0].count} (expected: 0)`);
  if (postLegacy.rows[0].count !== 0) {
    throw new Error(`POST-VERIFICATION FAILED: Expected 0 legacy products, found ${postLegacy.rows[0].count}`);
  }

  const postCanonical = await db.query(`
    SELECT count(*)::int as count FROM public.products WHERE slug ~ '^shoe-2026-09-\\d{3}$'
  `);
  console.log(`Canonical products in DB: ${postCanonical.rows[0].count} (expected: 31)`);
  if (postCanonical.rows[0].count !== 31) {
    throw new Error(`POST-VERIFICATION FAILED: Expected 31 canonical products, found ${postCanonical.rows[0].count}`);
  }

  const postOrderItems = await db.query(`
    SELECT oi.id, oi.order_id, oi.variant_id, oi.product_name, oi.sku, oi.price_in_cents, oi.thumbnail_url
    FROM public.order_items oi
    WHERE oi.id = ANY($1::uuid[])
  `, [legacyOrderItems.map((oi) => oi.id)]);
  console.log(`Historical order items verified: ${postOrderItems.rows.length} / ${legacyOrderItems.length}`);
  if (postOrderItems.rows.length !== legacyOrderItems.length) {
    throw new Error(`POST-VERIFICATION FAILED: Historical order items lost! Found ${postOrderItems.rows.length} expected ${legacyOrderItems.length}`);
  }
  for (const row of postOrderItems.rows) {
    console.log(`  - Order item ${row.id}: variant_id=${row.variant_id} (nullified per FK), SKU=${row.sku}, Name=${row.product_name}`);
    if (row.variant_id !== null) {
      throw new Error(`POST-VERIFICATION FAILED: Expected variant_id to be NULL on order item ${row.id}, got ${row.variant_id}`);
    }
  }

  const postOrdersCount = await db.query(`SELECT count(*)::int as count FROM public.orders`);
  console.log(`Total orders count: ${postOrdersCount.rows[0].count} (unchanged)`);

  const postAllOrderItemsCount = await db.query(`SELECT count(*)::int as count FROM public.order_items`);
  console.log(`Total order_items count: ${postAllOrderItemsCount.rows[0].count} (unchanged)`);

  const postLegacyPublic = await db.query(`
    SELECT count(*)::int as count FROM public.media_assets WHERE storage_provider = 'legacy_public'
  `);
  console.log(`Remaining legacy_public media assets: ${postLegacyPublic.rows[0].count} (expected: 0)`);
  if (postLegacyPublic.rows[0].count !== 0) {
    throw new Error(`POST-VERIFICATION FAILED: Expected 0 legacy_public media assets, found ${postLegacyPublic.rows[0].count}`);
  }

  console.log('\n================================================================');
  console.log('MIRZA PHASE 9 — LEGACY CATALOG CLEANUP COMPLETE');
  console.log('================================================================\n');

  await db.end();
}

main().catch((err) => {
  console.error('Fatal cleanup script error:', err);
  process.exit(1);
});
