import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(
  await fs.readFile(path.join(root, "scripts/catalog/shoes-2026-09.json"), "utf8"),
);
const apply = process.argv.includes("--apply");
const expectedOldSlugs = /^(office|traditional)-footwear-\d+$/;
const sslCertificate = process.env.SUPABASE_DB_CA_CERT_BASE64
  ? Buffer.from(process.env.SUPABASE_DB_CA_CERT_BASE64, "base64").toString("utf8")
  : undefined;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (manifest.length !== 31) throw new Error("Expected 31 manifest entries.");

const imagePaths = await Promise.all(
  manifest.map(async (_, index) => {
    const imagePath = `/catalog-shoes/shoe-${String(index + 1).padStart(2, "0")}.webp`;
    const diskPath = path.join(root, "storefront/public", imagePath.slice(1));
    const stats = await fs.stat(diskPath);
    if (stats.size === 0) throw new Error(`Empty image: ${diskPath}`);
    return { imagePath, size: stats.size };
  }),
);

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: sslCertificate
    ? { ca: sslCertificate, rejectUnauthorized: true }
    : { rejectUnauthorized: true },
});

const descriptionFor = (name) => {
  const style = name.toLowerCase().includes("boot")
    ? "boot"
    : name.toLowerCase().includes("loafer")
      ? "loafer"
      : name.toLowerCase().includes("sandal") ||
          name.toLowerCase().includes("slide")
        ? "open silhouette"
        : "shoe";
  return `${name} brings a distinctive ${style} shape to a considered wardrobe. Its visual details make it an easy focal point for everyday styling and special occasions alike.`;
};

try {
  await client.connect();
  const oldProducts = (
    await client.query("SELECT * FROM public.products WHERE status = 'active' ORDER BY slug")
  ).rows;
  if (
    oldProducts.length !== 38 ||
    oldProducts.some((product) => !expectedOldSlugs.test(product.slug))
  ) {
    throw new Error("Active catalog no longer matches the expected 38 legacy products; no changes made.");
  }

  const categories = (
    await client.query("SELECT id, slug FROM public.categories WHERE slug = ANY($1)", [
      ["office-wear", "traditional"],
    ])
  ).rows;
  if (categories.length !== 2) throw new Error("Expected legacy categories are missing.");
  const categoryIds = new Map(categories.map((category) => [category.slug, category.id]));
  if (manifest.some((product) => !categoryIds.has(product.category))) {
    throw new Error("Manifest contains an unknown category.");
  }

  const legacyIds = oldProducts.map((product) => product.id);
  const variants = await client.query(
    "SELECT * FROM public.variants WHERE product_id = ANY($1)",
    [legacyIds],
  );
  const images = await client.query(
    "SELECT * FROM public.product_images WHERE product_id = ANY($1)",
    [legacyIds],
  );
  const productCategories = await client.query(
    "SELECT * FROM public.product_categories WHERE product_id = ANY($1)",
    [legacyIds],
  );
  const cartReferences = await client.query(
    "SELECT COUNT(*)::int AS count FROM public.cart_items ci JOIN public.variants v ON v.id = ci.variant_id WHERE v.product_id = ANY($1)",
    [legacyIds],
  );

  console.log(
    `Ready: archive ${oldProducts.length} legacy products, create ${manifest.length} new products with ${manifest.length * 7} variants and images. ${cartReferences.rows[0].count} cart items reference legacy variants.`,
  );
  if (!apply) {
    console.log("Dry run only. Pass --apply to write the catalog.");
    process.exitCode = 0;
  } else {
    const backupDirectory = path.join(root, "scratch");
    await fs.mkdir(backupDirectory, { recursive: true });
    const backupPath = path.join(
      backupDirectory,
      `catalog-backup-${new Date().toISOString().replaceAll(":", "-")}.json`,
    );
    await fs.writeFile(
      backupPath,
      JSON.stringify(
        {
          products: oldProducts,
          variants: variants.rows,
          images: images.rows,
          productCategories: productCategories.rows,
        },
        null,
        2,
      ),
      { flag: "wx" },
    );

    await client.query("BEGIN");
    try {
      await client.query(
        "UPDATE public.products SET status = 'archived', updated_at = NOW() WHERE id = ANY($1)",
        [legacyIds],
      );

      for (const [index, product] of manifest.entries()) {
        const number = String(index + 1).padStart(3, "0");
        const slug = `shoe-2026-09-${number}`;
        const sku = `MIRZA-SH-${number}`;
        const description = descriptionFor(product.name);
        const inserted = await client.query(
          `INSERT INTO public.products
           (name, slug, sku, description, description_html, status, meta_title, meta_description, meta_keywords)
           VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8) RETURNING id`,
          [
            product.name,
            slug,
            sku,
            description,
            `<p>${description}</p>`,
            `${product.name} | Mirza Footwear`,
            description,
            `${product.name}, Mirza Footwear, shoes`,
          ],
        );
        const productId = inserted.rows[0].id;
        await client.query(
          "INSERT INTO public.product_categories (product_id, category_id) VALUES ($1, $2)",
          [productId, categoryIds.get(product.category)],
        );
        await client.query(
          `INSERT INTO public.product_images
           (product_id, storage_path, alt_text, position, is_hero, width, height, original_filename, mime_type, file_size_bytes)
           VALUES ($1, $2, $3, 0, TRUE, 1200, 1200, $4, 'image/webp', $5)`,
          [
            productId,
            imagePaths[index].imagePath,
            `${product.name} product image`,
            `${slug}.webp`,
            imagePaths[index].size,
          ],
        );
        for (let size = 6; size <= 12; size += 1) {
          const quantity = 7 + ((index * 11 + size * 3) % 19);
          await client.query(
            `INSERT INTO public.variants
             (product_id, sku, size_option, price_in_cents, currency, quantity_on_hand, position, is_default, active)
             VALUES ($1, $2, $3, $4, 'USD', $5, $6, $7, TRUE)`,
            [
              productId,
              `${sku}-${size}`,
              String(size),
              product.price * 100,
              quantity,
              size - 6,
              size === 9,
            ],
          );
        }
      }
      await client.query("COMMIT");
      console.log(`Catalog replaced. Local backup: ${backupPath}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}
