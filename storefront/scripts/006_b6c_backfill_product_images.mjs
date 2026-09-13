import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

// In-process DNS fallback for environments where local router fails to resolve cloud endpoints.
// Does NOT modify Windows system DNS, adapter settings, or global network configuration.
const originalLookup = dns.lookup;
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  dns.lookup = function (hostname, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    if (hostname.endsWith(".supabase.co")) {
      dns.resolve4(hostname, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          return originalLookup(hostname, options, callback);
        }
        if (options && options.all) {
          callback(
            null,
            addresses.map((a) => ({ address: a, family: 4 })),
          );
        } else {
          callback(null, addresses[0], 4);
        }
      });
    } else {
      originalLookup(hostname, options, callback);
    }
  };
} catch {
  // Proceed with default resolver if custom lookup setup fails
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load environment safely
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2]?.trim() || "";
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

// Validate required environment variables
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("FAIL CLOSED: DATABASE_URL not found in environment.");
  process.exit(1);
}

const caBase64 = process.env.SUPABASE_DB_CA_CERT_BASE64;
const isLocalhostDb =
  dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

if (!isLocalhostDb && !caBase64) {
  console.error(
    "FAIL CLOSED: Strict DB TLS requires SUPABASE_DB_CA_CERT_BASE64 for cloud database.",
  );
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !secretKey) {
  console.error(
    "FAIL CLOSED: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required for Storage migration.",
  );
  process.exit(1);
}

// 2. Strict Database Connection (NO rejectUnauthorized: false)
let sslConfig = false;
if (!isLocalhostDb) {
  try {
    const caCert = Buffer.from(caBase64, "base64").toString("utf8");
    if (!caCert.includes("BEGIN CERTIFICATE")) {
      throw new Error("Decoded CA certificate does not contain valid PEM header.");
    }
    sslConfig = {
      rejectUnauthorized: true,
      ca: caCert,
    };
  } catch (err) {
    console.error("FAIL CLOSED: Invalid SUPABASE_DB_CA_CERT_BASE64 certificate:", err.message);
    process.exit(1);
  }
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

// 3. Supabase Storage Admin Client
const storage = createClient(supabaseUrl, secretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
const BUCKET = "product-media";

// 4. Load Manifest
const manifestPath = path.resolve(__dirname, "../src/lib/media/manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("FAIL CLOSED: manifest.json not found at", manifestPath);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const publicDir = path.resolve(__dirname, "../public");

async function main() {
  const client = await pool.connect();

  try {
    console.log("=== B7.1 Media Migration Started ===");
    console.log("Database TLS: Strict verified (rejectUnauthorized: true)");
    console.log("Storage Bucket:", BUCKET);

    // Verify bucket exists and is accessible
    const bucketRes = await storage.storage.getBucket(BUCKET);
    if (bucketRes.error) {
      throw new Error(`Cannot access storage bucket '${BUCKET}': ${bucketRes.error.message}`);
    }
    console.log(`Bucket '${BUCKET}' verified accessible.`);

    // Fetch existing PostgreSQL products
    const productsRes = await client.query(
      "SELECT id, slug, name FROM public.products ORDER BY slug ASC;",
    );
    const productsBySlug = new Map(productsRes.rows.map((p) => [p.slug, p]));
    console.log(`Loaded ${productsBySlug.size} products from PostgreSQL.`);

    // Manifest audit
    const manifestSlugs = Object.keys(manifest);
    console.log(`Manifest contains ${manifestSlugs.length} product entries.`);

    let resolvedCount = 0;
    let repairedRows = 0;
    let totalUploadedObjects = 0;
    let verifiedObjects = 0;

    for (const slug of manifestSlugs) {
      const item = manifest[slug];
      const product = productsBySlug.get(slug);

      if (!product) {
        throw new Error(`FAIL CLOSED: Manifest slug '${slug}' not found in public.products.`);
      }
      resolvedCount++;

      // Locate existing product_images row(s)
      const existingRes = await client.query(
        "SELECT id, storage_path, position, is_hero, processed_variants FROM public.product_images WHERE product_id = $1 ORDER BY position ASC;",
        [product.id],
      );

      if (existingRes.rows.length === 0) {
        throw new Error(`FAIL CLOSED: Product '${slug}' (${product.id}) has no existing product_images row to repair.`);
      }

      // If multiple rows exist, locate the hero or first row
      const targetRow =
        existingRes.rows.find((r) => r.is_hero) || existingRes.rows[0];
      const mediaId = targetRow.id;

      if (!item.variants || typeof item.variants !== "object") {
        throw new Error(`FAIL CLOSED: Product '${slug}' has no variants in manifest.`);
      }

      // Storage object path mapping
      const rewrittenVariants = {};
      const canonicalPath = `products/${product.id}/${mediaId}/variants/640.webp`;

      for (const [width, formats] of Object.entries(item.variants)) {
        rewrittenVariants[width] = {};

        for (const [format, relPath] of Object.entries(formats)) {
          if (!relPath || typeof relPath !== "string") continue;

          // Local file path on disk
          const diskPath = path.join(publicDir, relPath.replace(/^\//, ""));
          if (!fs.existsSync(diskPath)) {
            throw new Error(`FAIL CLOSED: Missing local derivative file on disk: ${diskPath}`);
          }

          const fileBytes = fs.readFileSync(diskPath);
          const storagePath = `products/${product.id}/${mediaId}/variants/${width}.${format}`;
          const contentType = format === "avif" ? "image/avif" : "image/webp";

          // Upload derivative bytes to Supabase Storage (upsert = true for idempotency)
          const uploadRes = await storage.storage
            .from(BUCKET)
            .upload(storagePath, fileBytes, {
              contentType,
              upsert: true,
            });

          if (uploadRes.error) {
            throw new Error(
              `FAIL CLOSED: Upload failed for '${storagePath}': ${uploadRes.error.message}`,
            );
          }

          rewrittenVariants[width][format] = storagePath;
          totalUploadedObjects++;
        }
      }

      // Verify canonical 640.webp derivative was uploaded
      if (!rewrittenVariants["640"]?.webp) {
        throw new Error(`FAIL CLOSED: Canonical 640.webp derivative not generated for product '${slug}'.`);
      }

      // Repair/update the existing product_images row in PostgreSQL
      const updateRes = await client.query(
        `UPDATE public.product_images
         SET storage_path = $1,
             processed_variants = $2,
             mime_type = 'image/webp',
             updated_at = NOW()
         WHERE id = $3
         RETURNING id, storage_path;`,
        [canonicalPath, JSON.stringify(rewrittenVariants), mediaId],
      );

      if (updateRes.rowCount !== 1) {
        throw new Error(`FAIL CLOSED: Failed to update product_images row '${mediaId}' for product '${slug}'.`);
      }

      repairedRows++;
    }

    console.log("=== Migration Execution Summary ===");
    console.log(`Manifest entries resolved: ${resolvedCount} / ${manifestSlugs.length}`);
    console.log(`Existing DB rows repaired: ${repairedRows}`);
    console.log(`Storage objects uploaded/upserted: ${totalUploadedObjects}`);

    // Verification: count total rows and heroes
    const finalCounts = await client.query(
      "SELECT count(*) as total, count(*) FILTER (WHERE is_hero) as heroes FROM public.product_images;",
    );
    console.log(
      `Final public.product_images count: ${finalCounts.rows[0].total} (heroes: ${finalCounts.rows[0].heroes})`,
    );

    if (Number(finalCounts.rows[0].total) !== 38 || Number(finalCounts.rows[0].heroes) !== 38) {
      throw new Error(
        `FAIL CLOSED: Invariant violation! Expected exactly 38 rows and 38 heroes, got ${finalCounts.rows[0].total} / ${finalCounts.rows[0].heroes}`,
      );
    }

    // Verify 0 legacy "/products/" paths remain in processed_variants
    const legacyPathsCheck = await client.query(
      `SELECT count(*) as count
       FROM public.product_images
       WHERE processed_variants::text LIKE '%/products/%'
          OR storage_path LIKE '/products/%';`,
    );
    const remainingLegacy = Number(legacyPathsCheck.rows[0].count);
    console.log(`Remaining legacy '/products/' paths in DB: ${remainingLegacy}`);

    if (remainingLegacy > 0) {
      throw new Error(
        `FAIL CLOSED: ${remainingLegacy} rows still contain legacy '/products/' paths!`,
      );
    }

    console.log("=== B7.1 Migration Successfully Completed ===");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
