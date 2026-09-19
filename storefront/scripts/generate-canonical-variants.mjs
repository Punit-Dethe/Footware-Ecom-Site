import crypto from "node:crypto";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const storefrontRoot = path.resolve(import.meta.dirname, "..");
process.loadEnvFile(path.join(storefrontRoot, ".env.local"));

const require = createRequire(path.join(storefrontRoot, "package.json"));
const { Client } = require("pg");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");
const { Agent, setGlobalDispatcher } = require(
  path.join(storefrontRoot, "node_modules/.pnpm/undici@7.29.1/node_modules/undici")
);

const customLookup = (hostname, opts, cb) => {
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }
  dns.resolve4(hostname, (err, addrs) => {
    if (err) return cb(err);
    if (!addrs || !addrs.length) return cb(new Error("No addresses resolved"));
    if (opts.all) {
      cb(null, addrs.map((a) => ({ address: a, family: 4 })));
    } else {
      cb(null, addrs[0], 4);
    }
  });
};

setGlobalDispatcher(new Agent({ connect: { lookup: customLookup } }));

export const PRODUCT_MEDIA_BUCKET = "product-media";
export const CANONICAL_BACKGROUND = "#ece7de";
export const TARGET_WIDTHS = [320, 640, 960, 1200];
export const CANARY_SLUGS = [
  "shoe-2026-09-001",
  "shoe-2026-09-010",
  "shoe-2026-09-031",
];

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

export async function processAsset(db, supabase, row) {
  const { product_slug, product_name, media_asset_id, storage_path } = row;
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

  const processedVariants = {};

  for (const width of TARGET_WIDTHS) {
    // Generate WebP
    const webpBuf = await sharp(origBuf)
      .resize(width, width, { fit: "contain", background: CANONICAL_BACKGROUND })
      .webp({ quality: 80 })
      .toBuffer();
    const webpSha = crypto.createHash("sha256").update(webpBuf).digest("hex");
    const webpPath = `media/${media_asset_id}/variants/${width}.webp`;

    // Generate AVIF
    const avifBuf = await sharp(origBuf)
      .resize(width, width, { fit: "contain", background: CANONICAL_BACKGROUND })
      .avif({ quality: 65 })
      .toBuffer();
    const avifSha = crypto.createHash("sha256").update(avifBuf).digest("hex");
    const avifPath = `media/${media_asset_id}/variants/${width}.avif`;

    // Upload WebP
    const { error: webpUpErr } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .upload(webpPath, webpBuf, { contentType: "image/webp", upsert: true });
    if (webpUpErr) throw new Error(`Failed to upload ${webpPath}: ${webpUpErr.message}`);

    // Upload AVIF
    const { error: avifUpErr } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .upload(avifPath, avifBuf, { contentType: "image/avif", upsert: true });
    if (avifUpErr) throw new Error(`Failed to upload ${avifPath}: ${avifUpErr.message}`);

    // Verify HTTP 200 public URL
    const webpUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_MEDIA_BUCKET}/${webpPath}`;
    const avifUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_MEDIA_BUCKET}/${avifPath}`;

    const [wRes, aRes] = await Promise.all([fetch(webpUrl), fetch(avifUrl)]);
    if (!wRes.ok || !aRes.ok) {
      throw new Error(`Public verification failed: WebP ${wRes.status}, AVIF ${aRes.status}`);
    }

    processedVariants[String(width)] = {
      avif: avifPath,
      webp: webpPath,
    };

    console.log(`  Width ${width}: WebP ${webpBuf.length}B (HTTP ${wRes.status}), AVIF ${avifBuf.length}B (HTTP ${aRes.status})`);
  }

  // Update PostgreSQL media_assets row atomically
  await db.query(
    `UPDATE media_assets
     SET processed_variants = $1::jsonb,
         updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(processedVariants), media_asset_id]
  );

  console.log(`  Updated media_assets row for ${media_asset_id} with processed_variants.`);
  return { product_slug, media_asset_id, processedVariants };
}

async function main() {
  const isCanary = process.argv.includes("--canary");
  const isAll = process.argv.includes("--all");

  if (!isCanary && !isAll) {
    console.error("Usage: node generate-canonical-variants.mjs [--canary | --all]");
    process.exit(1);
  }

  console.log(`Starting variant generation in ${isCanary ? "CANARY (3 products)" : "FULL (all products)"} mode...`);

  const db = await createDbClient();
  const supabase = createStorageClient();

  try {
    let sql = `
      SELECT p.id as product_id, p.slug as product_slug, p.name as product_name,
             pm.id as product_media_id, ma.id as media_asset_id, ma.storage_path,
             ma.width, ma.height, ma.file_size_bytes, ma.processed_variants
      FROM products p
      JOIN product_media pm ON pm.product_id = p.id
      JOIN media_assets ma ON ma.id = pm.media_asset_id
      WHERE pm.is_hero = TRUE AND p.status = 'active'
    `;

    if (isCanary) {
      sql += ` AND p.slug IN ('${CANARY_SLUGS.join("', '")}')`;
    }

    sql += ` ORDER BY p.slug ASC;`;

    const res = await db.query(sql);
    console.log(`Found ${res.rows.length} hero assets to process.`);

    for (const row of res.rows) {
      await processAsset(db, supabase, row);
    }

    console.log(`\nCompleted processing ${res.rows.length} hero assets!`);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

