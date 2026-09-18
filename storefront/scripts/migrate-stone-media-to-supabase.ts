import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import sharp from "sharp";

export const PRODUCT_MEDIA_BUCKET = "product-media";
export const CANONICAL_BACKGROUND = "#ece7de";
export const MIRZA_MEDIA_NAMESPACE = "e8c07e26-f762-4b71-b0e6-54a7c0618031";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storefrontRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(storefrontRoot, "..");

// Safely load .env.local if running directly and variables are not yet in process.env
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(path.join(storefrontRoot, ".env.local"));
  } catch {
    // Ignore if not present or already provided by environment
  }
}

export interface ManifestEntry {
  productSlug: string;
  productName: string;
  sourceFilename: string;
  outputFilename: string;
  width: number;
  height: number;
  format: string;
  outputBytes: number;
  sha256: string;
  canonicalBackground: string;
}

export interface CanonicalProductRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  pm_id: string;
  is_hero: boolean;
  position: number;
  ma_id: string;
  storage_provider: string;
  storage_path: string;
}

export interface MigrationPlanItem {
  productId: string;
  productSlug: string;
  productName: string;
  legacyMediaAssetId: string;
  legacyStoragePath: string;
  newAssetId: string;
  newStoragePath: string;
  publicUrl: string;
  localFilePath: string;
  outputFilename: string;
  sha256: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  lqip: string;
  dominantColor: string;
  storageAction: "upload" | "already_complete";
}

export function generateDeterministicAssetId(
  productSlug: string,
  sha256: string,
  namespace: string = MIRZA_MEDIA_NAMESPACE,
): string {
  const name = `${productSlug}:${sha256}`;
  const ns = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = crypto.createHash("sha1").update(ns).update(name).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // RFC 4122 v5
  hash[8] = (hash[8] & 0x3f) | 0x80; // RFC 4122 variant 1
  const hex = hash.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

export async function computeLqip(filePath: string): Promise<string> {
  const buf = await sharp(filePath)
    .resize(16, 16, { fit: "contain", background: CANONICAL_BACKGROUND })
    .webp({ quality: 20 })
    .toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

export async function computeDominantColor(filePath: string): Promise<string> {
  const { dominant } = await sharp(filePath).stats();
  return `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;
}

export function getDbClient(): Client {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required.");
  }
  const caCertB64 = process.env.SUPABASE_DB_CA_CERT_BASE64;
  const ca = caCertB64 ? Buffer.from(caCertB64, "base64").toString("utf8") : undefined;

  return new Client({
    connectionString,
    ssl: ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true },
  });
}

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY environment variables are required.");
  }
  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface CanonicalProductData {
  id: string;
  slug: string;
  name: string;
  status: string;
  legacyMedia?: {
    pm_id: string;
    ma_id: string;
    storage_path: string;
    is_hero: boolean;
    position: number;
  };
  stoneMedia?: {
    pm_id: string;
    ma_id: string;
    storage_path: string;
    is_hero: boolean;
    position: number;
  };
}

export interface MigrationPlanItem {
  productId: string;
  productSlug: string;
  productName: string;
  legacyMediaAssetId: string;
  legacyStoragePath: string;
  newAssetId: string;
  newStoragePath: string;
  publicUrl: string;
  localFilePath: string;
  outputFilename: string;
  sha256: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  lqip: string;
  dominantColor: string;
  storageAction: "upload" | "already_complete";
  databaseAction: "update" | "already_complete";
}

export async function fetchCanonicalProducts(db: Client): Promise<CanonicalProductData[]> {
  const productsRes = await db.query(`
    SELECT id, slug, name, status
    FROM public.products
    WHERE slug LIKE 'shoe-2026-09-%'
    ORDER BY slug;
  `);

  if (productsRes.rows.length !== 31) {
    throw new Error(`Expected exactly 31 canonical products, found ${productsRes.rows.length}.`);
  }

  const mediaRes = await db.query(
    `SELECT pm.id as pm_id, pm.product_id, pm.is_hero, pm.position,
            ma.id as ma_id, ma.storage_provider, ma.storage_path
     FROM public.product_media pm
     JOIN public.media_assets ma ON ma.id = pm.media_asset_id
     WHERE pm.product_id = ANY($1)
     ORDER BY pm.position ASC`,
    [productsRes.rows.map((p) => p.id)],
  );

  const mediaByProduct = new Map<string, any[]>();
  for (const row of mediaRes.rows) {
    const list = mediaByProduct.get(row.product_id) || [];
    list.push(row);
    mediaByProduct.set(row.product_id, list);
  }

  return productsRes.rows.map((p) => {
    const media = mediaByProduct.get(p.id) || [];
    const legacy = media.find((m) => m.storage_provider === "legacy_public");
    const stone = media.find((m) => m.storage_provider === "supabase" && m.storage_path?.startsWith("media/"));

    if (!legacy) {
      throw new Error(`Product ${p.slug} is missing its legacy_public rollback media asset.`);
    }

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      status: p.status,
      legacyMedia: {
        pm_id: legacy.pm_id,
        ma_id: legacy.ma_id,
        storage_path: legacy.storage_path,
        is_hero: legacy.is_hero,
        position: legacy.position,
      },
      stoneMedia: stone
        ? {
            pm_id: stone.pm_id,
            ma_id: stone.ma_id,
            storage_path: stone.storage_path,
            is_hero: stone.is_hero,
            position: stone.position,
          }
        : undefined,
    };
  });
}

export async function buildMigrationPlan(
  db: Client,
  storage: ReturnType<typeof getSupabaseAdminClient>,
  options: { rootDir?: string } = {},
): Promise<MigrationPlanItem[]> {
  const root = options.rootDir || repoRoot;
  const manifestPath = path.join(root, "artifacts/media-v1/stone-catalog/manifest.json");

  let manifestContent: string;
  try {
    manifestContent = await fs.readFile(manifestPath, "utf8");
  } catch (err: any) {
    throw new Error(
      `Failed to read stone catalog manifest at ${manifestPath}. Run 'pnpm image:prepare-stone' first. Error: ${err.message}`,
    );
  }

  const manifest: ManifestEntry[] = JSON.parse(manifestContent);
  if (manifest.length !== 31) {
    throw new Error(`Manifest must contain exactly 31 entries, found ${manifest.length}.`);
  }

  const dbProducts = await fetchCanonicalProducts(db);
  const dbProductMap = new Map<string, CanonicalProductData>();
  for (const row of dbProducts) {
    dbProductMap.set(row.slug, row);
  }

  const plan: MigrationPlanItem[] = [];

  for (const entry of manifest) {
    const dbProduct = dbProductMap.get(entry.productSlug);
    if (!dbProduct) {
      throw new Error(`Manifest product ${entry.productSlug} not found in canonical database products.`);
    }

    const localFilePath = path.join(root, "artifacts/media-v1/stone-catalog", entry.outputFilename);
    const fileBytes = await fs.readFile(localFilePath);
    const actualHash = crypto.createHash("sha256").update(fileBytes).digest("hex");
    if (actualHash !== entry.sha256) {
      throw new Error(
        `SHA-256 mismatch for ${entry.outputFilename}: manifest has ${entry.sha256}, disk file has ${actualHash}.`,
      );
    }

    const newAssetId = generateDeterministicAssetId(entry.productSlug, entry.sha256);
    const newStoragePath = `media/${newAssetId}/original.webp`;
    const { data: urlData } = storage.storage.from(PRODUCT_MEDIA_BUCKET).getPublicUrl(newStoragePath);

    // Check if object already exists in Storage
    let storageAction: "upload" | "already_complete" = "upload";
    const { data: existingData, error: downloadError } = await storage.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .download(newStoragePath);

    if (!downloadError && existingData) {
      const existingBytes = Buffer.from(await existingData.arrayBuffer());
      const existingHash = crypto.createHash("sha256").update(existingBytes).digest("hex");
      if (existingHash === entry.sha256) {
        storageAction = "already_complete";
      } else {
        throw new Error(
          `Storage collision at ${newStoragePath}: existing object SHA-256 (${existingHash}) differs from expected (${entry.sha256}). Halting to prevent silent overwrite.`,
        );
      }
    }

    const isAlreadyMigrated =
      dbProduct.stoneMedia?.is_hero === true &&
      dbProduct.stoneMedia?.position === 0 &&
      dbProduct.stoneMedia?.storage_path === newStoragePath;

    const databaseAction: "update" | "already_complete" = isAlreadyMigrated ? "already_complete" : "update";

    const lqip = await computeLqip(localFilePath);
    const dominantColor = await computeDominantColor(localFilePath);

    plan.push({
      productId: dbProduct.id,
      productSlug: dbProduct.slug,
      productName: dbProduct.name,
      legacyMediaAssetId: dbProduct.legacyMedia!.ma_id,
      legacyStoragePath: dbProduct.legacyMedia!.storage_path,
      newAssetId,
      newStoragePath,
      publicUrl: urlData.publicUrl,
      localFilePath,
      outputFilename: entry.outputFilename,
      sha256: entry.sha256,
      fileSizeBytes: entry.outputBytes,
      width: entry.width,
      height: entry.height,
      lqip,
      dominantColor,
      storageAction,
      databaseAction,
    });
  }

  return plan;
}

export async function executeStorageUploads(
  storage: ReturnType<typeof getSupabaseAdminClient>,
  plan: MigrationPlanItem[],
) {
  let uploadedCount = 0;
  let alreadyExistingCount = 0;

  for (const item of plan) {
    if (item.storageAction === "already_complete") {
      alreadyExistingCount++;
      continue;
    }

    const fileBytes = await fs.readFile(item.localFilePath);
    const { error } = await storage.storage.from(PRODUCT_MEDIA_BUCKET).upload(item.newStoragePath, fileBytes, {
      contentType: "image/webp",
      upsert: false,
    });

    if (error) {
      throw new Error(`Failed to upload ${item.newStoragePath} to Supabase bucket '${PRODUCT_MEDIA_BUCKET}': ${error.message}`);
    }
    uploadedCount++;
  }

  return { uploadedCount, alreadyExistingCount };
}

export async function verifyPublicHttp(plan: MigrationPlanItem[]) {
  for (const item of plan) {
    const res = await fetch(item.publicUrl, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Public verification failed for ${item.publicUrl}: HTTP ${res.status} ${res.statusText}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("image/webp")) {
      throw new Error(`Expected content-type image/webp for ${item.publicUrl}, received '${contentType}'`);
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length !== item.fileSizeBytes) {
      throw new Error(
        `Byte length mismatch for ${item.publicUrl}: expected ${item.fileSizeBytes}, received ${bytes.length}`,
      );
    }
    const retrievedHash = crypto.createHash("sha256").update(bytes).digest("hex");
    if (retrievedHash !== item.sha256) {
      throw new Error(
        `SHA-256 hash mismatch for ${item.publicUrl}: expected ${item.sha256}, received ${retrievedHash}`,
      );
    }
  }
}

export async function executeDatabaseMigration(db: Client, plan: MigrationPlanItem[]) {
  await db.query("BEGIN");
  try {
    for (const item of plan) {
      // 1. Demote existing hero for this product to non-hero at position 1
      await db.query(
        `UPDATE public.product_media
         SET is_hero = false, position = 1
         WHERE product_id = $1 AND is_hero = true`,
        [item.productId],
      );

      // 2. Insert or update media_assets for the new stone asset
      await db.query(
        `INSERT INTO public.media_assets
         (id, storage_provider, storage_path, width, height, file_size_bytes, mime_type, original_filename, dominant_color, lqip, processed_variants, created_at, updated_at)
         VALUES ($1, 'supabase', $2, $3, $4, $5, 'image/webp', $6, $7, $8, null, NOW(), NOW())
         ON CONFLICT (storage_provider, storage_path)
         DO UPDATE SET
           file_size_bytes = EXCLUDED.file_size_bytes,
           dominant_color = EXCLUDED.dominant_color,
           lqip = EXCLUDED.lqip,
           updated_at = NOW()`,
        [
          item.newAssetId,
          item.newStoragePath,
          item.width,
          item.height,
          item.fileSizeBytes,
          item.outputFilename,
          item.dominantColor,
          item.lqip,
        ],
      );

      // 3. Attach new stone asset as hero (position 0)
      await db.query(
        `INSERT INTO public.product_media
         (product_id, media_asset_id, position, is_hero, alt_text, created_at)
         VALUES ($1, $2, 0, true, $3, NOW())
         ON CONFLICT (product_id, media_asset_id)
         DO UPDATE SET
           position = 0,
           is_hero = true,
           alt_text = EXCLUDED.alt_text`,
        [item.productId, item.newAssetId, `${item.productName} product image`],
      );
    }

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
}

export async function writeOperationalManifest(plan: MigrationPlanItem[], rootDir: string = repoRoot) {
  const manifestDir = path.join(rootDir, "artifacts/media-v1");
  await fs.mkdir(manifestDir, { recursive: true });
  const manifestFile = path.join(manifestDir, "supabase-stone-migration.json");

  const records = plan.map((p) => ({
    productId: p.productId,
    productSlug: p.productSlug,
    productName: p.productName,
    legacyMediaAssetId: p.legacyMediaAssetId,
    legacyStoragePath: p.legacyStoragePath,
    newStoneMediaAssetId: p.newAssetId,
    newStoragePath: p.newStoragePath,
    publicUrl: p.publicUrl,
    imageSha256: p.sha256,
    fileSize: p.fileSizeBytes,
    width: p.width,
    height: p.height,
    resultingHeroState: "hero (position 0)",
    legacyHeroState: "rollback copy (position 1, non-hero)",
  }));

  await fs.writeFile(manifestFile, JSON.stringify(records, null, 2), "utf8");
  return manifestFile;
}

export async function executeRollback(
  db: Client,
  storage: ReturnType<typeof getSupabaseAdminClient>,
  plan: MigrationPlanItem[],
  apply: boolean,
) {
  console.log(`\n=== ROLLBACK TARGETING ${plan.length} ASSETS ===`);
  for (const item of plan) {
    console.log(`- Product ${item.productSlug}: delete stone asset ${item.newAssetId}, restore legacy hero ${item.legacyMediaAssetId}`);
  }

  if (!apply) {
    console.log("\nDRY RUN ONLY. Pass --apply to execute rollback.");
    return;
  }

  await db.query("BEGIN");
  try {
    for (const item of plan) {
      // 1. Remove new product_media association
      await db.query(
        "DELETE FROM public.product_media WHERE product_id = $1 AND media_asset_id = $2",
        [item.productId, item.newAssetId],
      );

      // 2. Restore legacy asset as hero
      await db.query(
        "UPDATE public.product_media SET is_hero = true, position = 0 WHERE product_id = $1 AND media_asset_id = $2",
        [item.productId, item.legacyMediaAssetId],
      );

      // 3. Delete media_assets row
      await db.query(
        "DELETE FROM public.media_assets WHERE id = $1 AND storage_provider = 'supabase'",
        [item.newAssetId],
      );
    }
    await db.query("COMMIT");
    console.log("Database rollback transaction committed.");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }

  // Delete storage objects
  const pathsToDelete = plan.map((p) => p.newStoragePath);
  const { error } = await storage.storage.from(PRODUCT_MEDIA_BUCKET).remove(pathsToDelete);
  if (error) {
    console.error(`Warning: Storage object cleanup failed during rollback: ${error.message}`);
  } else {
    console.log(`Deleted ${pathsToDelete.length} storage objects from bucket '${PRODUCT_MEDIA_BUCKET}'.`);
  }
}

async function main() {
  const isApply = process.argv.includes("--apply");
  const isRollback = process.argv.includes("--rollback");

  console.log("=== Mirza Stone Supabase Migration (Phase 3) ===");
  console.log(`Mode: ${isRollback ? "ROLLBACK" : "MIGRATION"} | Apply: ${isApply ? "TRUE" : "DRY RUN"}\n`);

  const db = getDbClient();
  const storage = getSupabaseAdminClient();

  await db.connect();
  try {
    const plan = await buildMigrationPlan(db, storage);
    console.log(`Loaded canonical migration plan for ${plan.length} products.`);

    if (isRollback) {
      await executeRollback(db, storage, plan, isApply);
      return;
    }

    console.log("\n--- PRE-FLIGHT MIGRATION PLAN ---");
    const needUpload = plan.filter((p) => p.storageAction === "upload").length;
    const alreadyComplete = plan.filter((p) => p.storageAction === "already_complete").length;
    const needDbUpdate = plan.filter((p) => p.databaseAction === "update").length;
    const dbAlreadyComplete = plan.filter((p) => p.databaseAction === "already_complete").length;
    console.log(`Total Products: ${plan.length}`);
    console.log(`Storage Objects To Upload: ${needUpload}`);
    console.log(`Storage Objects Already Uploaded: ${alreadyComplete}`);
    console.log(`Database Associations To Update: ${needDbUpdate}`);
    console.log(`Database Associations Already Complete: ${dbAlreadyComplete}`);
    console.log(`First Plan Item: ${plan[0].productSlug} -> ${plan[0].newStoragePath}`);
    console.log(`Last Plan Item: ${plan[30].productSlug} -> ${plan[30].newStoragePath}`);

    if (needUpload === 0 && needDbUpdate === 0) {
      console.log("\n[IDEMPOTENT STATE VERIFIED] All 31 canonical products are already migrated with stone masters in Supabase Storage and associated as heroes in product_media.");
      console.log("No storage uploads or database updates needed.");
      return;
    }

    if (!isApply) {
      console.log("\n[DRY RUN COMPLETE] No Storage objects uploaded or Database rows modified.");
      console.log("To execute the migration, run with --apply:\n  pnpm --prefix storefront exec tsx scripts/migrate-stone-media-to-supabase.ts --apply\n");
      return;
    }

    console.log("\n[1/3] Uploading Stone Masters to Supabase Storage...");
    const uploadStats = await executeStorageUploads(storage, plan);
    console.log(`Uploads complete: ${uploadStats.uploadedCount} uploaded, ${uploadStats.alreadyExistingCount} already present.`);

    console.log("\n[2/3] Verifying Public HTTP 200 & Content Fidelity...");
    await verifyPublicHttp(plan);
    console.log(`All ${plan.length} storage objects verified via public HTTP GET (200 OK, image/webp, byte/hash match).`);

    console.log("\n[3/3] Performing Atomic Database Association Update...");
    await executeDatabaseMigration(db, plan);
    console.log("Database transaction committed successfully.");

    const manifestPath = await writeOperationalManifest(plan);
    console.log(`\nOperational migration manifest written to: ${manifestPath}`);

    console.log("\n=== MIGRATION COMPLETE ===");
  } finally {
    await db.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error("\nFATAL ERROR during migration:", err);
    process.exit(1);
  });
}
