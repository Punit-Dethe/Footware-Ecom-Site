import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
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

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL not found in environment or .env.local");
  process.exit(1);
}

const manifestPath = path.resolve(__dirname, "../src/lib/media/manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("Error: manifest.json not found at", manifestPath);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Connected to database. Starting product_images backfill...");

    // Fetch all existing products
    const productsRes = await client.query(
      "SELECT id, slug, name FROM public.products ORDER BY slug ASC;",
    );
    const productsBySlug = new Map(productsRes.rows.map((p) => [p.slug, p]));

    let insertedCount = 0;
    let skippedCount = 0;

    for (const [slug, item] of Object.entries(manifest)) {
      const product = productsBySlug.get(slug);
      if (!product) {
        console.warn(`[WARN] Product not found in DB for manifest slug: ${slug}`);
        continue;
      }

      // Check if image already exists
      const existing = await client.query(
        "SELECT id FROM public.product_images WHERE product_id = $1 LIMIT 1;",
        [product.id],
      );

      if (existing.rows.length > 0) {
        skippedCount++;
        continue;
      }

      const storagePath = `products/${product.id}/${slug}.webp`;

      await client.query(
        `INSERT INTO public.product_images (
          product_id,
          storage_path,
          alt_text,
          position,
          is_hero,
          width,
          height,
          dominant_color,
          lqip,
          processed_variants,
          original_filename,
          mime_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
        [
          product.id,
          storagePath,
          product.name,
          1,
          true,
          item.originalWidth || null,
          item.originalHeight || null,
          item.dominantColor || "#f5f5f5",
          item.lqip || null,
          JSON.stringify(item.variants || {}),
          item.originalName || `${slug}.webp`,
          "image/webp",
        ],
      );

      insertedCount++;
    }

    console.log(
      `Backfill completed successfully. Inserted: ${insertedCount}, Already present / skipped: ${skippedCount}`,
    );

    // Verify total images
    const countRes = await client.query("SELECT count(*) FROM public.product_images;");
    console.log(`Total rows in public.product_images: ${countRes.rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
