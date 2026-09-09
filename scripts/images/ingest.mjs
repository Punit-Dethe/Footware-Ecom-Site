import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SIZES = [
  { name: 'thumb', width: 160 },
  { name: 'card-sm', width: 320 },
  { name: 'card', width: 480 },
  { name: 'card-lg', width: 640 },
  { name: 'pdp', width: 960 },
  { name: 'pdp-lg', width: 1280 },
  { name: 'zoom', width: 1600 }
];

const BG_COLOR = '#f8f8f8';

/**
 * Extract dominant RGB color from image stats and return hex string
 */
async function getDominantColor(image) {
  try {
    const { dominant } = await image.stats();
    if (dominant) {
      const r = dominant.r.toString(16).padStart(2, '0');
      const g = dominant.g.toString(16).padStart(2, '0');
      const b = dominant.b.toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  } catch (e) {
    // fallback
  }
  return '#f5f5f5';
}

/**
 * Generate a tiny ~16px blurred WebP data URI placeholder
 */
async function generateLqip(image) {
  const lqipBuffer = await image
    .clone()
    .resize(16, 16, { fit: 'contain', background: BG_COLOR })
    .webp({ quality: 20 })
    .toBuffer();
  return `data:image/webp;base64,${lqipBuffer.toString('base64')}`;
}

export async function processImage(sourceFilePath, productSlug, outputBaseDir) {
  const fileBuffer = fs.readFileSync(sourceFilePath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').slice(0, 8);

  const baseImage = sharp(fileBuffer).rotate();
  const metadata = await baseImage.metadata();
  const dominantColor = await getDominantColor(baseImage);
  const lqip = await generateLqip(baseImage);

  const productOutDir = path.join(outputBaseDir, productSlug, hash);
  fs.mkdirSync(productOutDir, { recursive: true });

  const variants = {};

  for (const { name, width } of SIZES) {
    variants[width] = {};

    // 1:1 Aspect ratio square container for deterministic zero-CLS layouts
    const resized = baseImage
      .clone()
      .resize(width, width, {
        fit: 'contain',
        background: BG_COLOR
      });

    // AVIF
    const avifFilename = `${name}-${width}.avif`;
    const avifPath = path.join(productOutDir, avifFilename);
    await resized
      .clone()
      .avif({ quality: 65, effort: 4 })
      .toFile(avifPath);

    variants[width].avif = `/products/${productSlug}/${hash}/${avifFilename}`;

    // WebP Fallback
    const webpFilename = `${name}-${width}.webp`;
    const webpPath = path.join(productOutDir, webpFilename);
    await resized
      .clone()
      .webp({ quality: 75, effort: 4 })
      .toFile(webpPath);

    variants[width].webp = `/products/${productSlug}/${hash}/${webpFilename}`;
  }

  return {
    slug: productSlug,
    hash,
    originalName: path.basename(sourceFilePath),
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    dominantColor,
    lqip,
    mainUrl: variants[640].webp,
    variants
  };
}

async function run() {
  const mediaDir = path.resolve('media');
  const outputDir = path.resolve('storefront/public/products');
  const manifestPath = path.resolve('scripts/images/manifest.json');

  if (!fs.existsSync(mediaDir)) {
    console.error(`Media directory not found: ${mediaDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(mediaDir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort();

  console.log(`Starting automated image ingestion for ${files.length} images...`);
  console.log(`Target destination: ${outputDir}`);

  // Products definition mapping
  const manifest = {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const sourcePath = path.join(mediaDir, file);
    // Categorize: 0-18 = office, 19-37 = traditional
    const isOffice = i < 19;
    const catPrefix = isOffice ? 'office' : 'traditional';
    const indexStr = String(i + 1).padStart(2, '0');
    const slug = `${catPrefix}-footwear-${indexStr}`;

    console.log(`[${i + 1}/${files.length}] Processing ${file} -> ${slug}...`);
    const result = await processImage(sourcePath, slug, outputDir);
    manifest[slug] = result;
  }

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\nSuccessfully processed ${files.length} images!`);
  console.log(`Manifest written to: ${manifestPath}`);
}

run().catch(console.error);
