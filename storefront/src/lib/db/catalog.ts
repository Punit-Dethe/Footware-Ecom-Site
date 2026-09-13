import type { QueryResultRow } from "pg";
import { query } from "./index";

export interface DbCatalogProductImageJson {
  id: string;
  storage_path: string;
  alt_text: string | null;
  position: number;
  is_hero: boolean;
  width: number | null;
  height: number | null;
  dominant_color: string | null;
  lqip: string | null;
  processed_variants: Record<string, { avif?: string; webp?: string }> | null;
}

export interface DbCatalogProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  description_html: string | null;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at: Date;
  updated_at: Date;
  images?: DbCatalogProductImageJson[];
}

export interface DbCatalogCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface DbCatalogVariantRow {
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
  created_at?: Date;
  updated_at?: Date;
}

export interface DbProductCategoryJoinRow {
  product_id: string;
  category_id: string;
}

export interface PublicCatalogRawData {
  products: DbCatalogProductRow[];
  categories: DbCatalogCategoryRow[];
  variants: DbCatalogVariantRow[];
  productCategories: DbProductCategoryJoinRow[];
}

export interface DbVariantDetailRow extends DbCatalogVariantRow {
  product_name: string;
  product_slug: string;
  product_status: string;
  product_description: string | null;
  product_sku: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
}

export interface QueryableClient {
  query<R extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<{ rows: R[] }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Loads the complete raw dataset for the public catalog snapshot in bounded parallel queries.
 * Only loads active products, active variants, categories, and their relationships.
 * Guaranteed 0 N+1 queries.
 */
export async function loadPublicCatalogRows(
  client?: QueryableClient,
): Promise<PublicCatalogRawData> {
  const runner: QueryableClient = client ?? { query };

  const [productsRes, categoriesRes, variantsRes, pcRes] = await Promise.all([
    runner.query<DbCatalogProductRow>(
      `SELECT p.id, p.name, p.slug, p.sku, p.description, p.description_html, p.status,
              p.meta_title, p.meta_description, p.meta_keywords, p.created_at, p.updated_at,
              COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'id', pi.id,
                      'storage_path', pi.storage_path,
                      'alt_text', pi.alt_text,
                      'position', pi.position,
                      'is_hero', pi.is_hero,
                      'width', pi.width,
                      'height', pi.height,
                      'dominant_color', pi.dominant_color,
                      'lqip', pi.lqip,
                      'processed_variants', pi.processed_variants
                    ) ORDER BY pi.position ASC, pi.created_at ASC
                  )
                  FROM public.product_images pi
                  WHERE pi.product_id = p.id
                ),
                '[]'::json
              ) AS images
       FROM public.products p
       WHERE p.status = 'active'
       ORDER BY p.created_at ASC;`,
    ),
    runner.query<DbCatalogCategoryRow>(
      `SELECT id, name, slug, description, parent_id, position, created_at, updated_at
       FROM public.categories
       ORDER BY position ASC;`,
    ),
    runner.query<DbCatalogVariantRow>(
      `SELECT v.id, v.product_id, v.sku, v.size_option, v.price_in_cents,
              v.compare_at_price_in_cents, v.currency, v.quantity_on_hand,
              v.backorderable, v.position, v.is_default, v.active
       FROM public.variants v
       JOIN public.products p ON p.id = v.product_id
       WHERE v.active = TRUE AND p.status = 'active'
       ORDER BY v.position ASC, v.sku ASC;`,
    ),
    runner.query<DbProductCategoryJoinRow>(
      `SELECT product_id, category_id
       FROM public.product_categories;`,
    ),
  ]);

  return {
    products: productsRes.rows,
    categories: categoriesRes.rows,
    variants: variantsRes.rows,
    productCategories: pcRes.rows,
  };
}

/**
 * Resolves a single variant by UUID or SKU directly from PostgreSQL.
 * Joins parent product details. Can take a transaction-local client.
 */
export async function getVariantByIdOrSku(
  idOrSku: string,
  client?: QueryableClient,
): Promise<DbVariantDetailRow | null> {
  const runner: QueryableClient = client ?? { query };

  const isUuid = UUID_REGEX.test(idOrSku);
  const sql = isUuid
    ? `SELECT v.id, v.product_id, v.sku, v.size_option, v.price_in_cents,
              v.compare_at_price_in_cents, v.currency, v.quantity_on_hand,
              v.backorderable, v.position, v.is_default, v.active,
              p.name AS product_name, p.slug AS product_slug, p.status AS product_status,
              p.sku AS product_sku, p.description AS product_description,
              p.meta_title, p.meta_description, p.meta_keywords
       FROM public.variants v
       JOIN public.products p ON p.id = v.product_id
       WHERE v.id = $1::uuid
       LIMIT 1;`
    : `SELECT v.id, v.product_id, v.sku, v.size_option, v.price_in_cents,
              v.compare_at_price_in_cents, v.currency, v.quantity_on_hand,
              v.backorderable, v.position, v.is_default, v.active,
              p.name AS product_name, p.slug AS product_slug, p.status AS product_status,
              p.sku AS product_sku, p.description AS product_description,
              p.meta_title, p.meta_description, p.meta_keywords
       FROM public.variants v
       JOIN public.products p ON p.id = v.product_id
       WHERE v.sku = $1
       LIMIT 1;`;

  const res = await runner.query<DbVariantDetailRow>(sql, [idOrSku]);
  return res.rows[0] || null;
}

/**
 * Resolves multiple variants by UUIDs or SKUs in a single bounded bulk query.
 * Can take a transaction-local client.
 */
export async function getVariantsByIdsOrSkus(
  idsOrSkus: string[],
  client?: QueryableClient,
): Promise<DbVariantDetailRow[]> {
  if (idsOrSkus.length === 0) return [];
  const runner: QueryableClient = client ?? { query };

  const uuids = idsOrSkus.filter((id) => UUID_REGEX.test(id));
  const skus = idsOrSkus; // match all against SKU column safely

  const res = await runner.query<DbVariantDetailRow>(
    `SELECT v.id, v.product_id, v.sku, v.size_option, v.price_in_cents,
            v.compare_at_price_in_cents, v.currency, v.quantity_on_hand,
            v.backorderable, v.position, v.is_default, v.active,
            p.name AS product_name, p.slug AS product_slug, p.status AS product_status,
            p.sku AS product_sku, p.description AS product_description,
            p.meta_title, p.meta_description, p.meta_keywords
     FROM public.variants v
     JOIN public.products p ON p.id = v.product_id
     WHERE v.sku = ANY($1::text[])
        OR ($2::uuid[] IS NOT NULL AND v.id = ANY($2::uuid[]));`,
    [skus, uuids.length > 0 ? uuids : null],
  );

  return res.rows;
}

/**
 * Lists all active product slugs for build-time static generation and sitemap.
 */
export async function listActiveProductSlugs(
  client?: QueryableClient,
): Promise<string[]> {
  const runner: QueryableClient = client ?? { query };
  const res = await runner.query<{ slug: string }>(
    `SELECT slug FROM public.products WHERE status = 'active' ORDER BY created_at ASC;`,
  );
  return res.rows.map((r: { slug: string }) => r.slug);
}
