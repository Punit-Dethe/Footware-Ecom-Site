# Mirza Stone Product Master Pipeline (Phase 2)

> Canonical offline preparation pipeline baking the Mirza `#ece7de` stone background directly into the 31 catalog product master assets.

---

## 1. Overview & Problem Solved

In the legacy implementation, the 31 shoe catalog assets (`storefront/public/catalog-shoes/shoe-01.webp` through `shoe-31.webp`) were prepared with white (`#ffffff`) backgrounds. The browser was forced to compute runtime CSS blending via:

```css
mix-blend-mode: multiply;
```

over container surfaces styled with `#ece7de` (or `#ebe5dc` on the PDP).

While visually effective, this runtime blending introduced:
1. **GPU compositing overhead** across homepage ambient carousels, catalog grids, and PDP galleries.
2. **Inconsistent background rendering** between native and canvas surfaces.
3. **Email client failures**: email renderers (Gmail, Apple Mail, Outlook) do not support `mix-blend-mode`, leading to stark white rectangular boxes over stone backgrounds in outbound emails.

### The Phase 2 Offline Solution

Phase 2 establishes an offline, deterministic build pipeline using Sharp/libvips:

```text
High-Resolution Source PNG (Shoes/*.png)
                 ↓
      EXIF Orientation Normalization
                 ↓
  1200 × 1200 Contain Scaling (#ffffff)
                 ↓
Sharp Composite (Multiply onto #ece7de canvas)
                 ↓
  WebP Encoding (Quality 84, Effort 5)
                 ↓
Finished 1200 × 1200 Stone-Baked Master Candidate
```

Because `(Source / 255) * (#ece7de / 255) * 255` matches the exact W3C Compositing & Blending Level 1 formula used by modern browsers, the finished pixels stored in the WebP file are visually identical to the runtime blended result, but require **zero** browser or email client compositing.

---

## 2. Pipeline Execution

Run the deterministic pipeline via npm/pnpm script:

```bash
pnpm image:prepare-stone
# or directly:
node scripts/catalog/prepare-stone-shoe-images.mjs
```

### Script Invariants & Enforcement
1. **Manifest Parity**: Reads `scripts/catalog/shoes-2026-09.json` and requires exactly 31 items.
2. **Source Integrity**: Matches exactly one source PNG in `Shoes/` per manifest item. Rejects duplicates or missing sources with fatal errors.
3. **Dimensions**: All outputs are strictly 1200 × 1200.
4. **Format & Channels**: Strict 3-channel RGB WebP (`hasAlpha: false`).
5. **Corner Validation**: Tests four corner pixels on every output file against canonical `#ece7de` (`[236, 231, 222]`), enforcing a maximum encoding deviation of $\le 6$.
6. **Deterministic Hashes**: Repeated runs against identical inputs produce byte-for-byte identical SHA-256 digests.

---

## 3. Audited Runtime `mix-blend-mode: multiply` Locations

For the upcoming Phase 3 & 4 cutover, the following 6 CSS selectors across 4 files currently depend on `mix-blend-mode: multiply` and will be retired once the stone-baked images are live:

1. `storefront/src/app/home-experiment.css`: line 396
   ```css
   .product-card__image img {
     mix-blend-mode: multiply;
   }
   ```
2. `storefront/src/app/catalog-page.css`: line 356
   ```css
   .product-card__image img {
     mix-blend-mode: multiply;
   }
   ```
3. `storefront/src/app/cart-page.css`: line 121
   ```css
   .cart-item__image img {
     mix-blend-mode: multiply;
   }
   ```
4. `storefront/src/app/product-page.css`: line 63
   ```css
   .pdp-overview .media-gallery--editorial .media-gallery__main img {
     object-fit: contain;
     mix-blend-mode: multiply;
   }
   ```
5. `storefront/src/app/product-page.css`: line 69
   ```css
   .pdp-overview .media-gallery--editorial .media-gallery__thumb img {
     object-fit: contain;
     mix-blend-mode: multiply;
   }
   ```
6. `storefront/src/app/product-page.css`: line 159
   ```css
   .pdp-related .product-card__image img {
     object-fit: contain;
     mix-blend-mode: multiply;
   }
   ```

*Note: In Phase 2, zero storefront CSS files were altered. All CSS rules remain active on the live site.*

---

## 4. Asset Metrics & Byte Efficiency

Comparing the current 31 catalog images (`storefront/public/catalog-shoes/`) against the newly prepared 31 stone-baked images (`artifacts/media-v1/stone-catalog/`):

| Metric | Old (White + Runtime Multiply) | New (Stone-Baked Master) | Difference |
| :--- | :--- | :--- | :--- |
| **Total Bytes** | 2,956,078 bytes (~2.96 MB) | 2,788,516 bytes (~2.79 MB) | **-5.67% (-167.6 KB)** |
| **Median File Size** | 104,954 bytes (~105.0 KB) | 98,584 bytes (~98.6 KB) | **-6.07%** |
| **Largest Asset** | 145,082 bytes (`shoe-21`) | 135,880 bytes (`shoe-21`) | **-6.34%** |
| **Smallest Asset** | 43,720 bytes (`shoe-01`) | 40,204 bytes (`shoe-01`) | **-8.04%** |

---

## 5. Visual Equivalence Verification

Representative samples were verified by compositing the old white WebP with multiply on `#ece7de` (Column A) and comparing it against the newly baked stone master (Column B):

| Sample | Product Name | Avg Pixel Delta (0–255) | Visual Result |
| :--- | :--- | :--- | :--- |
| **`shoe-01`** | The Ivory Toe-Loop Slide | **0.791** | Indistinguishable; shadows & leather texture preserved |
| **`shoe-08`** | The Burgundy Monk Strap | **1.541** | Deep burnished leather tone preserved; crisp edges |
| **`shoe-16`** | The Leopard Print Mule | **1.125** | Intricate printed texture & fringe cleanly preserved |
| **`shoe-24`** | The Bronze Textured Slingback | **1.146** | Subtle metallic sheen & background transition seamless |
| **`shoe-31`** | The Blush Croc Slide | **1.018** | Subtle pastel tone & croc embossing intact; zero halo |

### Side-by-Side Contact Sheet
The side-by-side visual contact sheet is generated locally at:
`artifacts/media-v1/stone-catalog/visual-comparison-contact-sheet.webp`
- **Dimensions**: 1200 × 3220
- **Size**: ~244 KB
- **Content**: 5 dual-column rows with descriptive headers comparing Column A (Old + CSS Multiply) with Column B (New Stone Baked).
