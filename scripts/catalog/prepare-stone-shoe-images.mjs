import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

export const CANONICAL_BACKGROUND = "#ece7de";
export const CANONICAL_BG_RGB = { r: 236, g: 231, b: 222 };
export const TARGET_DIMENSION = 1200;
export const WEBP_QUALITY = 84;
export const WEBP_EFFORT = 5;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRoot = path.resolve(__dirname, "../..");

/**
 * Validates and matches source images with manifest entries.
 * Fails if manifest count != 31, if source files count != 31, or if any mapping is ambiguous.
 */
export async function resolveSourceMappings(rootDir = defaultRoot) {
  const manifestPath = path.join(rootDir, "scripts/catalog/shoes-2026-09.json");
  const sourceDirectory = path.join(rootDir, "Shoes");

  const manifestContent = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestContent);

  if (manifest.length !== 31) {
    throw new Error(`Expected exactly 31 manifest entries, found ${manifest.length}.`);
  }

  let dirEntries;
  try {
    dirEntries = await fs.readdir(sourceDirectory);
  } catch (err) {
    throw new Error(`Source directory Shoes/ not found at ${sourceDirectory}: ${err.message}`);
  }

  const sourceFiles = dirEntries.filter((file) => file.toLowerCase().endsWith(".png"));
  if (sourceFiles.length !== 31) {
    throw new Error(`Expected exactly 31 source PNG files in ${sourceDirectory}, found ${sourceFiles.length}.`);
  }

  const matchedSources = new Set();
  const mappings = [];

  for (const [index, product] of manifest.entries()) {
    const number = String(index + 1).padStart(3, "0");
    const slug = `shoe-2026-09-${number}`;
    const outputFilename = `shoe-${String(index + 1).padStart(2, "0")}.webp`;

    const matches = sourceFiles.filter((file) => file.includes(product.source));
    if (matches.length === 0) {
      throw new Error(`Missing source image for product ${slug} (source: ${product.source}).`);
    }
    if (matches.length > 1) {
      throw new Error(`Ambiguous source mapping for ${product.source}: matched ${matches.join(", ")}.`);
    }

    const sourceFilename = matches[0];
    if (matchedSources.has(sourceFilename)) {
      throw new Error(`Duplicate source image mapping: ${sourceFilename} mapped more than once.`);
    }
    matchedSources.add(sourceFilename);

    mappings.push({
      index,
      productSlug: slug,
      productName: product.name,
      sourceIdentifier: product.source,
      sourceFilename,
      sourcePath: path.join(sourceDirectory, sourceFilename),
      outputFilename,
      category: product.category,
      price: product.price,
    });
  }

  if (matchedSources.size !== 31) {
    throw new Error(`Expected 31 unique source images, matched ${matchedSources.size}.`);
  }

  return mappings;
}

/**
 * Validates the pixel values of a generated stone-baked image.
 * Verifies dimensions, format, absence of alpha, and corner background accuracy.
 */
export async function validateStoneImagePixels(filePath) {
  const meta = await sharp(filePath).metadata();
  if (meta.format !== "webp") {
    throw new Error(`Expected format webp for ${filePath}, got ${meta.format}.`);
  }
  if (meta.width !== TARGET_DIMENSION || meta.height !== TARGET_DIMENSION) {
    throw new Error(
      `Expected dimensions ${TARGET_DIMENSION}x${TARGET_DIMENSION} for ${filePath}, got ${meta.width}x${meta.height}.`,
    );
  }
  if (meta.hasAlpha) {
    throw new Error(`Expected no alpha channel in ${filePath}, found hasAlpha: true.`);
  }

  const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
  if (info.width !== TARGET_DIMENSION || info.height !== TARGET_DIMENSION || info.channels !== 3) {
    throw new Error(`Unexpected raw buffer characteristics for ${filePath}: ${JSON.stringify(info)}`);
  }

  const getPixel = (x, y) => {
    const offset = (y * TARGET_DIMENSION + x) * 3;
    return {
      r: data[offset],
      g: data[offset + 1],
      b: data[offset + 2],
    };
  };

  const corners = [
    { name: "top-left", x: 2, y: 2 },
    { name: "top-right", x: TARGET_DIMENSION - 3, y: 2 },
    { name: "bottom-left", x: 2, y: TARGET_DIMENSION - 3 },
    { name: "bottom-right", x: TARGET_DIMENSION - 3, y: TARGET_DIMENSION - 3 },
  ];

  // Maximum allowed deviation from canonical #ece7de [236, 231, 222] due to WebP lossy encoding
  const MAX_DELTA = 6;
  const cornerResults = [];

  for (const corner of corners) {
    const px = getPixel(corner.x, corner.y);
    const deltaR = Math.abs(px.r - CANONICAL_BG_RGB.r);
    const deltaG = Math.abs(px.g - CANONICAL_BG_RGB.g);
    const deltaB = Math.abs(px.b - CANONICAL_BG_RGB.b);

    cornerResults.push({ corner: corner.name, pixel: px, delta: { r: deltaR, g: deltaG, b: deltaB } });

    if (deltaR > MAX_DELTA || deltaG > MAX_DELTA || deltaB > MAX_DELTA) {
      throw new Error(
        `Corner ${corner.name} of ${filePath} has unexpected color [${px.r}, ${px.g}, ${px.b}], delta from #ece7de exceeds ${MAX_DELTA}.`,
      );
    }
  }

  return {
    meta,
    corners: cornerResults,
  };
}

/**
 * Prepares the 31 stone-baked shoe images deterministically.
 */
export async function prepareStoneShoeImages(options = {}) {
  const rootDir = options.rootDir || defaultRoot;
  const outputDir = options.outputDir || path.join(rootDir, "artifacts/media-v1/stone-catalog");
  const mappings = await resolveSourceMappings(rootDir);

  await fs.mkdir(outputDir, { recursive: true });

  const manifestEntries = [];

  // Generate stone canvas base buffer once
  const stoneBaseBuffer = await sharp({
    create: {
      width: TARGET_DIMENSION,
      height: TARGET_DIMENSION,
      channels: 3,
      background: CANONICAL_BACKGROUND,
    },
  })
    .raw()
    .toBuffer();

  for (const item of mappings) {
    const targetFile = path.join(outputDir, item.outputFilename);

    // 1. Normalize orientation & resize source shoe to 1200x1200 contain on #ffffff
    const shoeBuffer = await sharp(item.sourcePath)
      .rotate()
      .resize(TARGET_DIMENSION, TARGET_DIMENSION, {
        fit: "contain",
        background: "#ffffff",
      })
      .raw()
      .toBuffer();

    // 2. Composite onto #ece7de using multiply blend mode (reproducing CSS mix-blend-mode: multiply)
    const bakedWebp = await sharp(stoneBaseBuffer, {
      raw: {
        width: TARGET_DIMENSION,
        height: TARGET_DIMENSION,
        channels: 3,
      },
    })
      .composite([
        {
          input: shoeBuffer,
          raw: {
            width: TARGET_DIMENSION,
            height: TARGET_DIMENSION,
            channels: 3,
          },
          blend: "multiply",
        },
      ])
      .webp({
        quality: WEBP_QUALITY,
        effort: WEBP_EFFORT,
      })
      .toBuffer();

    await fs.writeFile(targetFile, bakedWebp);

    // Validate pixel characteristics
    await validateStoneImagePixels(targetFile);

    const hash = crypto.createHash("sha256").update(bakedWebp).digest("hex");

    manifestEntries.push({
      productSlug: item.productSlug,
      productName: item.productName,
      sourceFilename: item.sourceFilename,
      outputFilename: item.outputFilename,
      width: TARGET_DIMENSION,
      height: TARGET_DIMENSION,
      format: "webp",
      outputBytes: bakedWebp.length,
      sha256: hash,
      canonicalBackground: CANONICAL_BACKGROUND,
    });
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifestEntries, null, 2), "utf8");

  return {
    outputDir,
    manifestPath,
    manifestEntries,
  };
}

/**
 * Generates a side-by-side visual comparison contact sheet for representative products:
 * shoe-01, shoe-08, shoe-16, shoe-24, shoe-31.
 *
 * For each product:
 * A = old white image composited with CSS-like multiply on #ece7de
 * B = newly baked stone image rendered normally
 */
export async function generateComparisonContactSheet(options = {}) {
  const rootDir = options.rootDir || defaultRoot;
  const outputDir = options.outputDir || path.join(rootDir, "artifacts/media-v1/stone-catalog");
  const oldDir = path.join(rootDir, "storefront/public/catalog-shoes");

  const sampleIndices = [1, 8, 16, 24, 31];
  const tileDim = 600;
  const labelHeight = 44;
  const rowHeight = tileDim + labelHeight;
  const totalWidth = tileDim * 2;
  const totalHeight = rowHeight * sampleIndices.length;

  const compositeOperations = [];

  for (const [rowIndex, shoeNum] of sampleIndices.entries()) {
    const numStr = String(shoeNum).padStart(2, "0");
    const oldFileName = `shoe-${numStr}.webp`;
    const newFileName = `shoe-${numStr}.webp`;

    const oldFilePath = path.join(oldDir, oldFileName);
    const newFilePath = path.join(outputDir, newFileName);

    const yOffset = rowIndex * rowHeight;

    // Create label bar for this row
    const labelSvg = `
      <svg width="${totalWidth}" height="${labelHeight}">
        <rect width="${totalWidth}" height="${labelHeight}" fill="#2a2723"/>
        <text x="16" y="27" font-family="monospace" font-size="14" font-weight="bold" fill="#ffffff">SHOE-${numStr} | (A) OLD + CSS MULTIPLY [#ece7de]</text>
        <text x="${tileDim + 16}" y="27" font-family="monospace" font-size="14" font-weight="bold" fill="#d8cbb8">SHOE-${numStr} | (B) NEW BAKED STONE [#ece7de]</text>
      </svg>
    `;

    compositeOperations.push({
      input: Buffer.from(labelSvg),
      top: yOffset,
      left: 0,
    });

    // Column A: Old white image resized to tileDim x tileDim, composited onto #ece7de via multiply
    const oldResized = await sharp(oldFilePath)
      .resize(tileDim, tileDim, { fit: "contain", background: "#ffffff" })
      .toBuffer();

    const colABuffer = await sharp({
      create: {
        width: tileDim,
        height: tileDim,
        channels: 3,
        background: CANONICAL_BACKGROUND,
      },
    })
      .composite([{ input: oldResized, blend: "multiply" }])
      .png()
      .toBuffer();

    compositeOperations.push({
      input: colABuffer,
      top: yOffset + labelHeight,
      left: 0,
    });

    // Column B: Newly baked stone image resized to tileDim x tileDim, rendered normally
    const colBBuffer = await sharp(newFilePath)
      .resize(tileDim, tileDim, { fit: "contain" })
      .png()
      .toBuffer();

    compositeOperations.push({
      input: colBBuffer,
      top: yOffset + labelHeight,
      left: tileDim,
    });
  }

  // Create full background canvas and composite all tiles
  const contactSheetBuffer = await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 3,
      background: "#1e1c19",
    },
  })
    .composite(compositeOperations)
    .webp({ quality: 86, effort: 5 })
    .toBuffer();

  const contactSheetPath = path.join(outputDir, "visual-comparison-contact-sheet.webp");
  await fs.writeFile(contactSheetPath, contactSheetBuffer);

  return {
    contactSheetPath,
    sampleIndices,
    totalWidth,
    totalHeight,
    byteSize: contactSheetBuffer.length,
  };
}

// CLI execution
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log("=== Mirza Stone Product Master Pipeline ===");
  console.log(`Canonical Background: ${CANONICAL_BACKGROUND}`);
  console.log(`Target Dimensions: ${TARGET_DIMENSION}x${TARGET_DIMENSION}`);
  console.log("Processing 31 catalog products...\n");

  const startTime = Date.now();
  const { outputDir, manifestPath, manifestEntries } = await prepareStoneShoeImages();
  const prepDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`Successfully generated ${manifestEntries.length} stone-baked images in ${prepDuration}s.`);
  console.log(`Output Directory: ${outputDir}`);
  console.log(`Manifest: ${manifestPath}\n`);

  console.log("Generating visual comparison contact sheet...");
  const { contactSheetPath, sampleIndices, byteSize } = await generateComparisonContactSheet();
  console.log(`Visual Comparison Sheet generated: ${contactSheetPath} (${(byteSize / 1024).toFixed(1)} KB)`);
  console.log(`Compared representative samples: ${sampleIndices.map((i) => `shoe-${String(i).padStart(2, "0")}`).join(", ")}\n`);
}
