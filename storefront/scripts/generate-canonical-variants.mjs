import crypto from "node:crypto";
import path from "node:path";
import { createRequire } from "node:module";

const storefrontRoot = path.resolve(import.meta.dirname, "..");
process.loadEnvFile(path.join(storefrontRoot, ".env.local"));

const require = createRequire(path.join(storefrontRoot, "package.json"));
const { Client } = require("pg");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

export const PRODUCT_MEDIA_BUCKET = "product-media";
export const CANONICAL_BACKGROUND = "#ece7de";
export const TARGET_WIDTHS = [320, 640, 960, 1200];
export const CANARY_SLUGS = [
  "shoe-2026-09-001",
  "shoe-2026-09-010",
  "shoe-2026-09-031",
];
export const CANONICAL_SLUG_REGEX = /^shoe-2026-09-\d{3}$/;

export async function createDbClient() {
  const ca = Buffer.from(process.env.SUPABASE_DB_CA_CERT_BASE64, "base64").toString("utf8");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { ca, rejectUnauthorized: true },
  });
  await client.connect();
  return client;
}

export function createStorageClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });
}

async function uploadOrReuseVariant(supabase, variantPath, buffer, contentType, expectedSha) {
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .upload(variantPath, buffer, {
      contentType,
      upsert: false,
      cacheControl: "31536000",
    });

  if (uploadError) {
    // If object already exists or duplicate key conflict, download and verify
    console.log(`  Upload notice for ${variantPath}: ${uploadError.message}. Verifying existing object...`);
    const { data: dlData, error: dlError } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .download(variantPath);

    if (dlError || !dlData) {
      throw new Error(`Failed to upload ${variantPath} (${uploadError.message}) and failed to download existing object (${dlError?.message})`);
    }

    const dlBuf = Buffer.from(await dlData.arrayBuffer());
    const dlSha = crypto.createHash("sha256").update(dlBuf).digest("hex");
    if (dlSha !== expectedSha) {
      throw new Error(`Integrity violation on existing object ${variantPath}: storage SHA=${dlSha} !== generated SHA=${expectedSha}`);
    }
    console.log(`  Existing immutable object verified and reused: ${variantPath}`);
  }
}

async function verifyVariantObject(variantPath, expectedMime, expectedSha, expectedWidth, expectedHeight) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_MEDIA_BUCKET}/${variantPath}`;
  const res = await fetch(url);
  if (res.status !== 200) {
    throw new Error(`HTTP verification failed for ${variantPath}: expected 200, got ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes(expectedMime)) {
    throw new Error(`Content-Type verification failed for ${variantPath}: expected ${expectedMime}, got ${contentType}`);
  }

  const downloadedBuf = Buffer.from(await res.arrayBuffer());
  const downloadedSha = crypto.createHash("sha256").update(downloadedBuf).digest("hex");
  if (downloadedSha !== expectedSha) {
    throw new Error(`SHA verification failed for ${variantPath}: expected ${expectedSha}, got ${downloadedSha}`);
  }

  const downloadedMeta = await sharp(downloadedBuf).metadata();
  if (downloadedMeta.width !== expectedWidth || downloadedMeta.height !== expectedHeight) {
    throw new Error(`Dimension verification failed for ${variantPath}: expected ${expectedWidth}x${expectedHeight}, got ${downloadedMeta.width}x${downloadedMeta.height}`);
  }

  return {
    status: res.status,
    contentType,
    sha: downloadedSha,
    width: downloadedMeta.width,
    height: downloadedMeta.height,
  };
}

export async function processAsset(db, supabase, row) {
  const {
    product_slug,
    product_name,
    media_asset_id,
    storage_provider,
    storage_path,
    width: dbWidth,
    height: dbHeight,
  } = row;

  if (!CANONICAL_SLUG_REGEX.test(product_slug)) {
    throw new Error(`Harden guard failed: product_slug ${product_slug} does not match ^shoe-2026-09-\\d{3}$`);
  }
  if (storage_provider !== "supabase") {
    throw new Error(`Harden guard failed: storage_provider for ${product_slug} is ${storage_provider}, expected 'supabase'`);
  }
  if (!storage_path || !storage_path.startsWith("media/")) {
    throw new Error(`Harden guard failed: storage_path ${storage_path} does not start with 'media/'`);
  }
  if (dbWidth > 1200 || dbHeight > 1200 || dbWidth !== 1200 || dbHeight !== 1200) {
    throw new Error(`Harden guard failed: canonical source dimensions for ${product_slug} are ${dbWidth}x${dbHeight}, expected 1200x1200`);
  }

  console.log(`\nProcessing ${product_slug} (${product_name})...`);
  console.log(`  Source: ${storage_path}`);

  // Download original from Storage
  const { data: origData, error: downloadError } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .download(storage_path);

  if (downloadError || !origData) {
    throw new Error(`Failed to download ${storage_path}: ${downloadError?.message}`);
  }

  const origBuf = Buffer.from(await origData.arrayBuffer());
  const origSha256 = crypto.createHash("sha256").update(origBuf).digest("hex");
  const meta = await sharp(origBuf).metadata();
  console.log(`  Original: ${meta.width}x${meta.height}, ${origBuf.length} bytes, SHA: ${origSha256.slice(0, 12)}...`);

  if (meta.width > 1200 || meta.height > 1200 || meta.width !== 1200 || meta.height !== 1200) {
    throw new Error(`Source image dimensions for ${product_slug} are ${meta.width}x${meta.height}, expected 1200x1200`);
  }

  const processedVariants = {};
  const pendingVerifications = [];

  for (const width of TARGET_WIDTHS) {
    // Generate WebP with withoutEnlargement: true
    const webpBuf = await sharp(origBuf)
      .resize(width, width, {
        fit: "contain",
        background: CANONICAL_BACKGROUND,
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
    const webpSha = crypto.createHash("sha256").update(webpBuf).digest("hex");
    const webpSha12 = webpSha.slice(0, 12);
    const webpPath = `media/${media_asset_id}/variants/${width}-${webpSha12}.webp`;

    // Generate AVIF with withoutEnlargement: true
    const avifBuf = await sharp(origBuf)
      .resize(width, width, {
        fit: "contain",
        background: CANONICAL_BACKGROUND,
        withoutEnlargement: true,
      })
      .avif({ quality: 65 })
      .toBuffer();
    const avifSha = crypto.createHash("sha256").update(avifBuf).digest("hex");
    const avifSha12 = avifSha.slice(0, 12);
    const avifPath = `media/${media_asset_id}/variants/${width}-${avifSha12}.avif`;

    // Upload with upsert: false, cacheControl: "31536000", or reuse if exists
    await uploadOrReuseVariant(supabase, webpPath, webpBuf, "image/webp", webpSha);
    await uploadOrReuseVariant(supabase, avifPath, avifBuf, "image/avif", avifSha);

    pendingVerifications.push({
      path: webpPath,
      mime: "image/webp",
      sha: webpSha,
      width,
      height: width,
    });
    pendingVerifications.push({
      path: avifPath,
      mime: "image/avif",
      sha: avifSha,
      width,
      height: width,
    });

    processedVariants[String(width)] = {
      avif: avifPath,
      webp: webpPath,
    };
  }

  // Verify all 8 objects before updating DB
  for (const item of pendingVerifications) {
    const verified = await verifyVariantObject(item.path, item.mime, item.sha, item.width, item.height);
    console.log(`  Verified ${item.path}: HTTP ${verified.status}, ${verified.contentType}, SHA ${verified.sha.slice(0, 12)}..., ${verified.width}x${verified.height}`);
  }

  // Update PostgreSQL media_assets row atomically and assert exactly 1 row affected
  const updateRes = await db.query(
    `UPDATE media_assets
     SET processed_variants = $1::jsonb,
         updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(processedVariants), media_asset_id]
  );

  if (updateRes.rowCount !== 1) {
    throw new Error(`Expected exactly 1 media_assets row updated for ID ${media_asset_id}, got ${updateRes.rowCount}`);
  }

  console.log(`  Updated media_assets row for ${media_asset_id} with processed_variants (rowCount: 1).`);
  return { product_slug, media_asset_id, processedVariants };
}

async function main() {
  const isCanary = process.argv.includes("--canary");
  const isAll = process.argv.includes("--all");

  if (!isCanary && !isAll) {
    console.error("Usage: node generate-canonical-variants.mjs [--canary | --all]");
    process.exit(1);
  }

  console.log(`Starting variant generation in ${isCanary ? "CANARY (3 products)" : "FULL (31 canonical products)"} mode...`);

  const db = await createDbClient();
  const supabase = createStorageClient();

  try {
    let sql = `
      SELECT p.id as product_id, p.slug as product_slug, p.name as product_name,
             pm.id as product_media_id, ma.id as media_asset_id, ma.storage_provider, ma.storage_path,
             ma.width, ma.height, ma.file_size_bytes, ma.processed_variants
      FROM products p
      JOIN product_media pm ON pm.product_id = p.id
      JOIN media_assets ma ON ma.id = pm.media_asset_id
      WHERE pm.is_hero = TRUE 
        AND p.status = 'active'
        AND p.slug ~ '^shoe-2026-09-[0-9]{3}$'
    `;

    if (isCanary) {
      sql += ` AND p.slug IN ('${CANARY_SLUGS.join("', '")}')`;
    }

    sql += ` ORDER BY p.slug ASC;`;

    const res = await db.query(sql);

    // Hard assert counts
    if (isCanary && res.rows.length !== 3) {
      throw new Error(`Target hardening violation: --canary expected exactly 3 canonical products, found ${res.rows.length}`);
    }
    if (isAll && res.rows.length !== 31) {
      throw new Error(`Target hardening violation: --all expected exactly 31 canonical products, found ${res.rows.length}`);
    }

    console.log(`Found ${res.rows.length} canonical hero assets to process.`);

    for (const row of res.rows) {
      await processAsset(db, supabase, row);
    }

    console.log(`\nCompleted processing ${res.rows.length} canonical hero assets!`);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
