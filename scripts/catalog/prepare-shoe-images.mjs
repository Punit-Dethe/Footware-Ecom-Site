import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(
  await fs.readFile(path.join(root, "scripts/catalog/shoes-2026-09.json"), "utf8"),
);
const sourceDirectory = path.join(root, "Shoes");
const targetDirectory = path.join(root, "storefront/public/catalog-shoes");
const sourceFiles = (await fs.readdir(sourceDirectory)).filter((file) =>
  file.toLowerCase().endsWith(".png"),
);

if (manifest.length !== 31 || sourceFiles.length !== manifest.length) {
  throw new Error("Expected exactly 31 source images and 31 manifest entries.");
}

await fs.mkdir(targetDirectory, { recursive: true });

for (const [index, product] of manifest.entries()) {
  const matches = sourceFiles.filter((file) => file.includes(product.source));
  if (matches.length !== 1) {
    throw new Error(`Expected one source image for ${product.source}.`);
  }

  const target = path.join(
    targetDirectory,
    `shoe-${String(index + 1).padStart(2, "0")}.webp`,
  );
  await sharp(path.join(sourceDirectory, matches[0]))
    .resize(1200, 1200, { fit: "contain", background: "#ffffff" })
    .webp({ quality: 84, effort: 5 })
    .toFile(target);
}

console.log(`Prepared ${manifest.length} shoe images in storefront/public/catalog-shoes.`);
