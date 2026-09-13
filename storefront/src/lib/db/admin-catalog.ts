import "server-only";
import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { query, transaction } from "./index";
import { formatSafeDescription } from "@/lib/catalog/description";
import { listProductMedia, type DbProductImageRow } from "./media";

export interface AdminProductSummary {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: "draft" | "active" | "archived";
  variantCount: number;
  minPriceInCents: number | null;
  maxPriceInCents: number | null;
  totalStock: number;
  categories: Array<{ id: string; name: string; slug: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminVariantRecord {
  id: string;
  productId: string;
  sku: string;
  sizeOption: string | null;
  priceInCents: number;
  compareAtPriceInCents: number | null;
  currency: string;
  quantityOnHand: number;
  backorderable: boolean;
  position: number;
  isDefault: boolean;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  descriptionHtml: string | null;
  status: "draft" | "active" | "archived";
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  categories: Array<{ id: string; name: string; slug: string }>;
  variants: AdminVariantRecord[];
  images: DbProductImageRow[];
}

export interface AdminCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parentName?: string | null;
  position: number;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveProductVariantInput {
  id?: string; // If absent, created as new variant
  sku: string;
  sizeOption?: string | null;
  priceInCents: number;
  compareAtPriceInCents?: number | null;
  quantityOnHand: number;
  backorderable: boolean;
  position?: number;
  isDefault: boolean;
  active: boolean;
}

export interface SaveProductInput {
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  status?: "draft" | "active" | "archived";
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  categoryIds?: string[];
  variants?: SaveProductVariantInput[];
}

export class CatalogValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = "CatalogValidationError";
  }
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export function validateUuid(id: unknown, fieldName: string): string {
  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
    throw new CatalogValidationError(
      `Invalid UUID format for ${fieldName}`,
      fieldName,
    );
  }
  return id;
}

export function validateSlug(slug: unknown, fieldName: string = "slug"): string {
  if (
    typeof slug !== "string" ||
    slug.length < 1 ||
    slug.length > 255 ||
    !SLUG_REGEX.test(slug)
  ) {
    throw new CatalogValidationError(
      `Invalid slug for ${fieldName}. Must be lowercase alphanumeric characters separated by single hyphens, up to 255 characters.`,
      fieldName,
    );
  }
  return slug;
}

export function validateStatus(
  status: unknown,
  fieldName: string = "status",
): "draft" | "active" | "archived" {
  if (status !== "draft" && status !== "active" && status !== "archived") {
    throw new CatalogValidationError(
      `Invalid status for ${fieldName}. Must be 'draft', 'active', or 'archived'.`,
      fieldName,
    );
  }
  return status;
}

export function validateStringLength(
  val: unknown,
  fieldName: string,
  max: number,
  required: boolean = false,
): string | null {
  if (val == null || val === "") {
    if (required) {
      throw new CatalogValidationError(`${fieldName} is required`, fieldName);
    }
    return null;
  }
  if (typeof val !== "string") {
    throw new CatalogValidationError(`${fieldName} must be a string`, fieldName);
  }
  const trimmed = val.trim();
  if (required && !trimmed) {
    throw new CatalogValidationError(`${fieldName} cannot be empty`, fieldName);
  }
  if (trimmed.length > max) {
    throw new CatalogValidationError(
      `${fieldName} exceeds maximum length of ${max} characters`,
      fieldName,
    );
  }
  return trimmed;
}

export function validateInteger(
  val: unknown,
  fieldName: string,
  { min = 0, allowNull = false } = {},
): number | null {
  if (val == null && allowNull) return null;
  if (
    typeof val !== "number" ||
    !Number.isFinite(val) ||
    !Number.isInteger(val) ||
    val < min
  ) {
    throw new CatalogValidationError(
      `Invalid value for ${fieldName}. Must be an integer >= ${min}.`,
      fieldName,
    );
  }
  return val;
}

export function validateBoolean(val: unknown, fieldName: string): boolean {
  if (typeof val !== "boolean") {
    throw new CatalogValidationError(
      `Invalid value for ${fieldName}. Must be a boolean (true or false).`,
      fieldName,
    );
  }
  return val;
}

/**
 * Lists all products in the database regardless of status (draft, active, archived).
 * Single bounded query that aggregates variant statistics and category names without N+1.
 */
export async function listAdminProducts(): Promise<AdminProductSummary[]> {
  const sql = `
    WITH variant_stats AS (
      SELECT
        product_id,
        COUNT(id)::int AS variant_count,
        MIN(price_in_cents) AS min_price_in_cents,
        MAX(price_in_cents) AS max_price_in_cents,
        COALESCE(SUM(quantity_on_hand), 0)::int AS total_stock
      FROM public.variants
      GROUP BY product_id
    ),
    cat_agg AS (
      SELECT
        pc.product_id,
        COALESCE(
          json_agg(jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug) ORDER BY c.name)
          FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) AS categories
      FROM public.product_categories pc
      JOIN public.categories c ON c.id = pc.category_id
      GROUP BY pc.product_id
    )
    SELECT
      p.id,
      p.name,
      p.slug,
      p.sku,
      p.status,
      p.created_at,
      p.updated_at,
      COALESCE(vs.variant_count, 0)::int AS variant_count,
      vs.min_price_in_cents,
      vs.max_price_in_cents,
      COALESCE(vs.total_stock, 0)::int AS total_stock,
      COALESCE(ca.categories, '[]'::json) AS categories
    FROM public.products p
    LEFT JOIN variant_stats vs ON vs.product_id = p.id
    LEFT JOIN cat_agg ca ON ca.product_id = p.id
    ORDER BY p.updated_at DESC;
  `;

  const res = await query<{
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    status: "draft" | "active" | "archived";
    created_at: Date;
    updated_at: Date;
    variant_count: number;
    min_price_in_cents: number | null;
    max_price_in_cents: number | null;
    total_stock: number;
    categories: Array<{ id: string; name: string; slug: string }>;
  }>(sql);

  return res.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    status: row.status,
    variantCount: row.variant_count,
    minPriceInCents: row.min_price_in_cents,
    maxPriceInCents: row.max_price_in_cents,
    totalStock: row.total_stock,
    categories: Array.isArray(row.categories) ? row.categories : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Retrieves a single product with full category and variant detail.
 */
export async function getAdminProduct(
  id: string,
): Promise<AdminProductDetail | null> {
  if (!isValidUuid(id)) {
    return null;
  }

  const prodRes = await query<{
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    description: string | null;
    description_html: string | null;
    status: "draft" | "active" | "archived";
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, name, slug, sku, description, description_html, status,
            meta_title, meta_description, meta_keywords, created_at, updated_at
     FROM public.products
     WHERE id = $1;`,
    [id],
  );

  if (prodRes.rows.length === 0) {
    return null;
  }
  const p = prodRes.rows[0];

  const [catRes, varRes, images] = await Promise.all([
    query<{ id: string; name: string; slug: string }>(
      `SELECT c.id, c.name, c.slug
       FROM public.categories c
       JOIN public.product_categories pc ON pc.category_id = c.id
       WHERE pc.product_id = $1
       ORDER BY c.name ASC;`,
      [id],
    ),
    query<{
      id: string;
      product_id: string;
      sku: string;
      size_option: string | null;
      price_in_cents: number;
      compare_at_price_in_cents: number | null;
      currency: string;
      quantity_on_hand: number;
      backorderable: boolean;
      position: number;
      is_default: boolean;
      active: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, product_id, sku, size_option, price_in_cents, compare_at_price_in_cents,
              currency, quantity_on_hand, backorderable, position, is_default, active,
              created_at, updated_at
       FROM public.variants
       WHERE product_id = $1
       ORDER BY position ASC, created_at ASC;`,
      [id],
    ),
    listProductMedia(id),
  ]);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    descriptionHtml: p.description_html,
    status: p.status,
    metaTitle: p.meta_title,
    metaDescription: p.meta_description,
    metaKeywords: p.meta_keywords,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    categories: catRes.rows,
    variants: varRes.rows.map((v) => ({
      id: v.id,
      productId: v.product_id,
      sku: v.sku,
      sizeOption: v.size_option,
      priceInCents: v.price_in_cents,
      compareAtPriceInCents: v.compare_at_price_in_cents,
      currency: v.currency,
      quantityOnHand: v.quantity_on_hand,
      backorderable: v.backorderable,
      position: v.position,
      isDefault: v.is_default,
      active: v.active,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    })),
    images,
  };
}

/**
 * Creates a brand new product in draft status.
 */
export async function createAdminProduct(
  input: SaveProductInput,
): Promise<string> {
  const name = validateStringLength(input.name, "name", 255, true)!;
  const rawSlug = (input.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-|-$/g, "");
  const slug = validateSlug(rawSlug, "slug");
  const sku = validateStringLength(input.sku, "sku", 100);

  if (input.status !== undefined && input.status !== null) {
    const validatedStatus = validateStatus(input.status, "status");
    if (validatedStatus !== "draft") {
      throw new CatalogValidationError(
        "New products must be created as draft before publishing.",
        "status",
      );
    }
  }

  const metaTitle = validateStringLength(input.metaTitle, "metaTitle", 255);
  const metaDescription = typeof input.metaDescription === "string" ? input.metaDescription.trim() || null : null;
  const metaKeywords = typeof input.metaKeywords === "string" ? input.metaKeywords.trim() || null : null;

  if (input.categoryIds && input.categoryIds.length > 0) {
    for (let i = 0; i < input.categoryIds.length; i++) {
      validateUuid(input.categoryIds[i], `categoryIds[${i}]`);
    }
  }

  const productId = crypto.randomUUID();
  const safeDesc = formatSafeDescription(input.description);

  return transaction(async (client) => {
    try {
      await client.query(
        `INSERT INTO public.products (
          id, name, slug, sku, description, description_html,
          status, meta_title, meta_description, meta_keywords,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9, NOW(), NOW());`,
        [
          productId,
          name,
          slug,
          sku,
          safeDesc.description || null,
          safeDesc.description_html || null,
          metaTitle,
          metaDescription,
          metaKeywords,
        ],
      );
    } catch (err: any) {
      handleConstraintViolation(err);
    }

    if (input.categoryIds && input.categoryIds.length > 0) {
      for (const catId of input.categoryIds) {
        await client.query(
          `INSERT INTO public.product_categories (product_id, category_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [productId, catId],
        );
      }
    }

    if (input.variants && input.variants.length > 0) {
      await syncVariants(client, productId, input.variants);
    }

    return productId;
  });
}

/**
 * Atomically updates a product, its category associations, and its variants.
 * Validates publish invariants if target status is 'active'.
 */
export async function saveAdminProduct(
  productId: string,
  input: SaveProductInput,
): Promise<AdminProductDetail> {
  validateUuid(productId, "productId");
  const name = validateStringLength(input.name, "name", 255, true)!;
  const slug = validateSlug(input.slug?.trim().toLowerCase(), "slug");
  const sku = validateStringLength(input.sku, "sku", 100);
  const targetStatus = input.status ? validateStatus(input.status, "status") : undefined;
  const metaTitle = validateStringLength(input.metaTitle, "metaTitle", 255);
  const metaDescription = typeof input.metaDescription === "string" ? input.metaDescription.trim() || null : null;
  const metaKeywords = typeof input.metaKeywords === "string" ? input.metaKeywords.trim() || null : null;

  if (input.categoryIds) {
    for (let i = 0; i < input.categoryIds.length; i++) {
      validateUuid(input.categoryIds[i], `categoryIds[${i}]`);
    }
  }

  return transaction(async (client) => {
    // 1. Verify target product exists
    const existing = await client.query<{ id: string; status: string }>(
      `SELECT id, status FROM public.products WHERE id = $1 FOR UPDATE;`,
      [productId],
    );
    if (existing.rows.length === 0) {
      throw new CatalogValidationError(`Product ${productId} not found`);
    }

    const safeDesc = formatSafeDescription(input.description);
    const finalStatus = targetStatus || (existing.rows[0].status as "draft" | "active" | "archived");

    // 2. Update product row
    try {
      await client.query(
        `UPDATE public.products SET
           name = $1,
           slug = $2,
           sku = $3,
           description = $4,
           description_html = $5,
           status = $6,
           meta_title = $7,
           meta_description = $8,
           meta_keywords = $9,
           updated_at = NOW()
         WHERE id = $10;`,
        [
          name,
          slug,
          sku,
          safeDesc.description || null,
          safeDesc.description_html || null,
          finalStatus,
          metaTitle,
          metaDescription,
          metaKeywords,
          productId,
        ],
      );
    } catch (err: any) {
      handleConstraintViolation(err);
    }

    // 3. Sync category associations
    if (input.categoryIds !== undefined) {
      await client.query(
        `DELETE FROM public.product_categories WHERE product_id = $1;`,
        [productId],
      );
      for (const catId of input.categoryIds) {
        await client.query(
          `INSERT INTO public.product_categories (product_id, category_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [productId, catId],
        );
      }
    }

    // 4. Sync variants
    if (input.variants !== undefined) {
      await syncVariants(client, productId, input.variants);
    }

    // 5. If publishing / activating, enforce strict transactional publish invariants
    if (targetStatus === "active") {
      await validatePublishInvariants(client, productId, name, slug, input.sku);
    }

    // 6. Return fresh updated product
    const updated = await getAdminProductWithClient(client, productId);
    if (!updated) {
      throw new Error("Failed to load product after save");
    }
    return updated;
  });
}

/**
 * Synchronizes variants for a product:
 * - Validates existing variant ownership (prevents cross-product ID tampering)
 * - Prevents renaming existing variant SKUs
 * - Updates existing variants
 * - Inserts newly submitted variants
 */
async function syncVariants(
  client: PoolClient,
  productId: string,
  variantsInput: SaveProductVariantInput[],
): Promise<void> {
  const existingRes = await client.query<{ id: string; sku: string }>(
    `SELECT id, sku FROM public.variants WHERE product_id = $1;`,
    [productId],
  );
  const existingMap = new Map<string, string>(
    existingRes.rows.map((r) => [r.id, r.sku]),
  );

  const defaultCount = variantsInput.filter((v) => v.isDefault).length;
  if (defaultCount > 1) {
    throw new CatalogValidationError(
      "Multiple default variants specified. At most one default variant is allowed.",
      "variants",
    );
  }

  // If a default variant is submitted, clear existing defaults first inside the transaction
  // to avoid order-dependent violations of idx_variants_product_default (e.g. old default updated after new default)
  if (defaultCount === 1) {
    await client.query(
      `UPDATE public.variants SET is_default = false WHERE product_id = $1 AND is_default = true;`,
      [productId],
    );
  }

  const seenSkus = new Set<string>();

  for (let i = 0; i < variantsInput.length; i++) {
    const v = variantsInput[i];
    if (v.id) {
      validateUuid(v.id, `variants[${i}].id`);
    }

    const trimmedSku = validateStringLength(v.sku, `variants[${i}].sku`, 100, true)!;
    const sizeOption = validateStringLength(v.sizeOption, `variants[${i}].sizeOption`, 50);
    const priceInCents = validateInteger(v.priceInCents, `variants[${i}].priceInCents`, { min: 0 })!;
    const compareAtPriceInCents = validateInteger(v.compareAtPriceInCents, `variants[${i}].compareAtPriceInCents`, { min: 0, allowNull: true });
    const quantityOnHand = validateInteger(v.quantityOnHand, `variants[${i}].quantityOnHand`, { min: 0 })!;
    const position = v.position != null ? validateInteger(v.position, `variants[${i}].position`, { min: 0 })! : i;
    const backorderable = validateBoolean(v.backorderable, `variants[${i}].backorderable`);
    const isDefault = validateBoolean(v.isDefault, `variants[${i}].isDefault`);
    const active = validateBoolean(v.active, `variants[${i}].active`);

    const lowerSku = trimmedSku.toLowerCase();
    if (seenSkus.has(lowerSku)) {
      throw new CatalogValidationError(
        `Duplicate SKU "${trimmedSku}" submitted in variants list`,
        `variants[${i}].sku`,
      );
    }
    seenSkus.add(lowerSku);

    if (v.id) {
      // Existing variant: verify ownership
      if (!existingMap.has(v.id)) {
        throw new CatalogValidationError(
          `Variant ${v.id} does not belong to product ${productId}`,
          `variants[${i}].id`,
        );
      }

      // Existing SKU is immutable
      const currentSku = existingMap.get(v.id)!;
      if (currentSku.toLowerCase() !== lowerSku) {
        throw new CatalogValidationError(
          `Existing variant SKU "${currentSku}" cannot be renamed to "${trimmedSku}".`,
          `variants[${i}].sku`,
        );
      }

      // Update existing variant
      try {
        await client.query(
          `UPDATE public.variants SET
             size_option = $1,
             price_in_cents = $2,
             compare_at_price_in_cents = $3,
             quantity_on_hand = $4,
             backorderable = $5,
             position = $6,
             is_default = $7,
             active = $8,
             updated_at = NOW()
           WHERE id = $9 AND product_id = $10;`,
          [
            sizeOption,
            priceInCents,
            compareAtPriceInCents,
            quantityOnHand,
            backorderable,
            position,
            isDefault,
            active,
            v.id,
            productId,
          ],
        );
      } catch (err: any) {
        handleConstraintViolation(err);
      }
    } else {
      // New variant: generate UUID and insert
      const newVariantId = crypto.randomUUID();
      try {
        await client.query(
          `INSERT INTO public.variants (
             id, product_id, sku, size_option, price_in_cents,
             compare_at_price_in_cents, currency, quantity_on_hand,
             backorderable, position, is_default, active,
             created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, 'USD', $7, $8, $9, $10, $11, NOW(), NOW());`,
          [
            newVariantId,
            productId,
            trimmedSku,
            sizeOption,
            priceInCents,
            compareAtPriceInCents,
            quantityOnHand,
            backorderable,
            position,
            isDefault,
            active,
          ],
        );
      } catch (err: any) {
        handleConstraintViolation(err);
      }
    }
  }
}

/**
 * Validates all invariants required before a product can transition to 'active'.
 */
async function validatePublishInvariants(
  client: PoolClient,
  productId: string,
  name: string,
  slug: string,
  baseSku?: string | null,
): Promise<void> {
  if (!name.trim()) {
    throw new CatalogValidationError("Active product must have a non-empty name");
  }

  if (!slug.trim()) {
    throw new CatalogValidationError("Active product must have a valid slug");
  }

  if (!baseSku?.trim()) {
    throw new CatalogValidationError("Active product must have a unique base product SKU", "sku");
  }

  // 1. Must have at least 1 valid category relationship
  const catCountRes = await client.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM public.product_categories WHERE product_id = $1;`,
    [productId],
  );
  if (Number(catCountRes.rows[0]?.count || 0) < 1) {
    throw new CatalogValidationError(
      "Cannot publish product: At least one category relationship is required",
      "categoryIds",
    );
  }

  // 2. Fetch all variants
  const varRes = await client.query<{
    id: string;
    sku: string;
    size_option: string | null;
    price_in_cents: number;
    compare_at_price_in_cents: number | null;
    currency: string;
    quantity_on_hand: number;
    is_default: boolean;
    active: boolean;
  }>(
    `SELECT id, sku, size_option, price_in_cents, compare_at_price_in_cents,
            currency, quantity_on_hand, is_default, active
     FROM public.variants
     WHERE product_id = $1;`,
    [productId],
  );

  const activeVariants = varRes.rows.filter((v) => v.active);
  if (activeVariants.length === 0) {
    throw new CatalogValidationError(
      "Cannot publish product: At least one active variant is required",
      "variants",
    );
  }

  // 3. Exactly one active default variant
  const activeDefaultVariants = activeVariants.filter((v) => v.is_default);
  if (activeDefaultVariants.length === 0) {
    throw new CatalogValidationError(
      "Cannot publish product: Exactly one active variant must be designated as default",
      "variants",
    );
  }
  if (activeDefaultVariants.length > 1) {
    throw new CatalogValidationError(
      "Cannot publish product: Multiple active default variants found. Only one default allowed.",
      "variants",
    );
  }

  // 4. Validate every active variant details
  for (const v of activeVariants) {
    if (!v.sku?.trim()) {
      throw new CatalogValidationError(
        `Active variant ${v.id} must have a non-empty SKU`,
      );
    }
    if (!v.size_option?.trim()) {
      throw new CatalogValidationError(
        `Active variant ${v.sku} must have a non-empty size option`,
      );
    }
    if (v.price_in_cents <= 0) {
      throw new CatalogValidationError(
        `Active variant ${v.sku} must have a price greater than 0`,
      );
    }
    if (v.quantity_on_hand < 0) {
      throw new CatalogValidationError(
        `Active variant ${v.sku} cannot have a negative quantity on hand`,
      );
    }
    if (v.currency !== "USD") {
      throw new CatalogValidationError(
        `Active variant ${v.sku} must use USD currency`,
      );
    }
    if (
      v.compare_at_price_in_cents != null &&
      v.compare_at_price_in_cents < v.price_in_cents
    ) {
      throw new CatalogValidationError(
        `Active variant ${v.sku} compare-at price cannot be less than actual price`,
      );
    }
  }
}

/**
 * Archives an active or draft product. Variants remain intact.
 */
export async function archiveAdminProduct(productId: string): Promise<void> {
  validateUuid(productId, "productId");
  const res = await query(
    `UPDATE public.products SET status = 'archived', updated_at = NOW() WHERE id = $1 RETURNING id;`,
    [productId],
  );
  if (res.rows.length === 0) {
    throw new CatalogValidationError(`Product ${productId} not found`);
  }
}

/**
 * Restores an archived product back to draft status.
 */
export async function restoreAdminProduct(productId: string): Promise<void> {
  validateUuid(productId, "productId");
  const res = await query(
    `UPDATE public.products SET status = 'draft', updated_at = NOW() WHERE id = $1 RETURNING id;`,
    [productId],
  );
  if (res.rows.length === 0) {
    throw new CatalogValidationError(`Product ${productId} not found`);
  }
}

/**
 * Category Administration
 */
export async function listAdminCategories(): Promise<AdminCategoryRecord[]> {
  const res = await query<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parent_id: string | null;
    parent_name: string | null;
    position: number;
    product_count: number;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT c.id, c.name, c.slug, c.description, c.parent_id, c.position,
            c.created_at, c.updated_at,
            COUNT(pc.product_id)::int AS product_count,
            p.name AS parent_name
     FROM public.categories c
     LEFT JOIN public.categories p ON p.id = c.parent_id
     LEFT JOIN public.product_categories pc ON pc.category_id = c.id
     GROUP BY c.id, p.name
     ORDER BY c.position ASC, c.name ASC;`,
  );

  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    parentId: r.parent_id,
    parentName: r.parent_name,
    position: r.position,
    productCount: r.product_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getAdminCategory(
  id: string,
): Promise<AdminCategoryRecord | null> {
  if (!isValidUuid(id)) {
    return null;
  }

  const res = await query<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parent_id: string | null;
    parent_name: string | null;
    position: number;
    product_count: number;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT c.id, c.name, c.slug, c.description, c.parent_id, c.position,
            c.created_at, c.updated_at,
            COUNT(pc.product_id)::int AS product_count,
            p.name AS parent_name
     FROM public.categories c
     LEFT JOIN public.categories p ON p.id = c.parent_id
     LEFT JOIN public.product_categories pc ON pc.category_id = c.id
     WHERE c.id = $1
     GROUP BY c.id, p.name;`,
    [id],
  );

  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    parentId: r.parent_id,
    parentName: r.parent_name,
    position: r.position,
    productCount: r.product_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function createAdminCategory(data: {
  name: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  position?: number;
}): Promise<string> {
  const name = validateStringLength(data.name, "name", 255, true)!;
  const rawSlug = (data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-|-$/g, "");
  const slug = validateSlug(rawSlug, "slug");
  const position = data.position != null ? validateInteger(data.position, "position", { min: 0 })! : 0;

  // If parentId is specified, verify parent exists
  if (data.parentId) {
    validateUuid(data.parentId, "parentId");
    const parentCheck = await query<{ id: string }>(
      `SELECT id FROM public.categories WHERE id = $1;`,
      [data.parentId],
    );
    if (parentCheck.rows.length === 0) {
      throw new CatalogValidationError("Parent category does not exist", "parentId");
    }
  }

  const categoryId = crypto.randomUUID();
  try {
    await query(
      `INSERT INTO public.categories (
         id, name, slug, description, parent_id, position, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());`,
      [
        categoryId,
        name,
        slug,
        data.description?.trim() || null,
        data.parentId || null,
        position,
      ],
    );
    return categoryId;
  } catch (err: any) {
    handleConstraintViolation(err);
    throw err;
  }
}

export async function updateAdminCategory(
  id: string,
  data: {
    name: string;
    slug?: string;
    description?: string | null;
    parentId?: string | null;
    position?: number;
  },
): Promise<void> {
  validateUuid(id, "categoryId");
  const name = validateStringLength(data.name, "name", 255, true)!;
  const slug = validateSlug(data.slug?.trim().toLowerCase(), "slug");
  const position = data.position != null ? validateInteger(data.position, "position", { min: 0 })! : 0;

  // Prevent self parent cycle
  if (data.parentId === id) {
    throw new CatalogValidationError("Category cannot be its own parent", "parentId");
  }

  // If parentId is specified, verify parent exists and verify no transitive cycles
  if (data.parentId) {
    validateUuid(data.parentId, "parentId");
    const parentCheck = await query<{ id: string }>(
      `SELECT id FROM public.categories WHERE id = $1;`,
      [data.parentId],
    );
    if (parentCheck.rows.length === 0) {
      throw new CatalogValidationError("Parent category does not exist", "parentId");
    }

    // Check transitive cycle: if 'id' is in the ancestor chain of 'data.parentId'
    const cycleCheck = await query<{ id: string }>(
      `WITH RECURSIVE ancestors AS (
         SELECT id, parent_id, 1 AS depth
         FROM public.categories
         WHERE id = $1
         UNION ALL
         SELECT c.id, c.parent_id, a.depth + 1
         FROM public.categories c
         JOIN ancestors a ON c.id = a.parent_id
         WHERE a.depth < 50
       )
       SELECT id FROM ancestors WHERE id = $2 LIMIT 1;`,
      [data.parentId, id],
    );

    if (cycleCheck.rows.length > 0) {
      throw new CatalogValidationError(
        "Cannot set category parent: cycle detected in category hierarchy",
        "parentId",
      );
    }
  }

  try {
    const res = await query(
      `UPDATE public.categories SET
         name = $1,
         slug = $2,
         description = $3,
         parent_id = $4,
         position = $5,
         updated_at = NOW()
       WHERE id = $6 RETURNING id;`,
      [
        name,
        slug,
        data.description?.trim() || null,
        data.parentId || null,
        position,
        id,
      ],
    );
    if (res.rows.length === 0) {
      throw new CatalogValidationError(`Category ${id} not found`);
    }
  } catch (err: any) {
    handleConstraintViolation(err);
  }
}

/**
 * Safely deletes a category ONLY if it has 0 associated products and 0 child categories.
 * Uses atomic conditional DELETE to prevent check-then-delete race conditions.
 */
export async function deleteAdminCategoryIfSafe(id: string): Promise<void> {
  validateUuid(id, "categoryId");
  const deleteRes = await query<{ id: string }>(
    `DELETE FROM public.categories
     WHERE id = $1
       AND NOT EXISTS (
         SELECT 1 FROM public.product_categories WHERE category_id = $1
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.categories WHERE parent_id = $1
       )
     RETURNING id;`,
    [id],
  );

  if (deleteRes.rows.length > 0) {
    return;
  }

  // If 0 rows deleted, determine exact cause for user feedback:
  const existsRes = await query<{ id: string }>(
    `SELECT id FROM public.categories WHERE id = $1;`,
    [id],
  );
  if (existsRes.rows.length === 0) {
    throw new CatalogValidationError(`Category ${id} not found`);
  }

  const prodRes = await query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM public.product_categories WHERE category_id = $1;`,
    [id],
  );
  if (Number(prodRes.rows[0]?.count || 0) > 0) {
    throw new CatalogValidationError(
      "Cannot delete category: Category is associated with one or more products.",
      "category",
    );
  }

  const childRes = await query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM public.categories WHERE parent_id = $1;`,
    [id],
  );
  if (Number(childRes.rows[0]?.count || 0) > 0) {
    throw new CatalogValidationError(
      "Cannot delete category: Category has child subcategories.",
      "category",
    );
  }

  throw new CatalogValidationError("Cannot delete category: Category is not eligible for deletion.");
}

function handleConstraintViolation(err: any): never {
  if (err && err.code === "23505") {
    const detail = String(err.detail || "");
    const constraint = String(err.constraint || "");

    if (constraint.includes("slug") || detail.includes("slug")) {
      throw new CatalogValidationError("Slug already exists", "slug");
    }
    if (
      constraint.includes("sku") ||
      detail.includes("sku") ||
      detail.includes("Key (sku)")
    ) {
      if (constraint.includes("variants") || detail.includes("variants")) {
        throw new CatalogValidationError("Variant SKU already exists", "sku");
      }
      throw new CatalogValidationError("Product SKU already exists", "sku");
    }
    throw new CatalogValidationError(`Unique constraint violation: ${detail || constraint}`);
  }
  throw err;
}

async function getAdminProductWithClient(
  client: PoolClient,
  id: string,
): Promise<AdminProductDetail | null> {
  const prodRes = await client.query<{
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    description: string | null;
    description_html: string | null;
    status: "draft" | "active" | "archived";
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, name, slug, sku, description, description_html, status,
            meta_title, meta_description, meta_keywords, created_at, updated_at
     FROM public.products
     WHERE id = $1;`,
    [id],
  );

  if (prodRes.rows.length === 0) return null;
  const p = prodRes.rows[0];

  const [catRes, varRes, images] = await Promise.all([
    client.query<{ id: string; name: string; slug: string }>(
      `SELECT c.id, c.name, c.slug
       FROM public.categories c
       JOIN public.product_categories pc ON pc.category_id = c.id
       WHERE pc.product_id = $1
       ORDER BY c.name ASC;`,
      [id],
    ),
    client.query<{
      id: string;
      product_id: string;
      sku: string;
      size_option: string | null;
      price_in_cents: number;
      compare_at_price_in_cents: number | null;
      currency: string;
      quantity_on_hand: number;
      backorderable: boolean;
      position: number;
      is_default: boolean;
      active: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, product_id, sku, size_option, price_in_cents, compare_at_price_in_cents,
              currency, quantity_on_hand, backorderable, position, is_default, active,
              created_at, updated_at
       FROM public.variants
       WHERE product_id = $1
       ORDER BY position ASC, created_at ASC;`,
      [id],
    ),
    listProductMedia(id, client),
  ]);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    descriptionHtml: p.description_html,
    status: p.status,
    metaTitle: p.meta_title,
    metaDescription: p.meta_description,
    metaKeywords: p.meta_keywords,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    categories: catRes.rows,
    variants: varRes.rows.map((v) => ({
      id: v.id,
      productId: v.product_id,
      sku: v.sku,
      sizeOption: v.size_option,
      priceInCents: v.price_in_cents,
      compareAtPriceInCents: v.compare_at_price_in_cents,
      currency: v.currency,
      quantityOnHand: v.quantity_on_hand,
      backorderable: v.backorderable,
      position: v.position,
      isDefault: v.is_default,
      active: v.active,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    })),
    images,
  };
}
