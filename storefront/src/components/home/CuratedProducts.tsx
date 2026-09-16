import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/products/ProductCard";
import { PRODUCT_CARD_FIELDS } from "@/lib/data/cached";
import { cachedListProducts } from "@/lib/data/products";

const EDIT_SLUGS = [
  "shoe-2026-09-007",
  "shoe-2026-09-005",
  "shoe-2026-09-010",
  "shoe-2026-09-001",
];

interface CuratedProductsProps {
  basePath: string;
  locale: string;
  country: string;
  currency?: string;
}

export async function CuratedProducts({
  basePath,
  locale,
  country,
  currency,
}: CuratedProductsProps) {
  const [t, response] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "home.journal" }),
    cachedListProducts(
      { limit: 100, fields: PRODUCT_CARD_FIELDS },
      { locale, country },
      "dtc",
    ).catch((error: unknown) => {
      console.error("Homepage: could not load the curated collection", error);
      return null;
    }),
  ]);

  if (!response?.data.length) {
    return (
      <div className="mirza-selection__unavailable">
        <p>{t(response ? "selectionEmpty" : "selectionUnavailable")}</p>
        <Link className="mirza-link" href={`${basePath}/products`}>
          {t("selectionCta")}
        </Link>
      </div>
    );
  }

  const catalog = response.data;
  const selected = EDIT_SLUGS.flatMap((slug) => {
    const product = catalog.find((item) => item.slug === slug);
    return product ? [product] : [];
  });
  const selectedIds = new Set(selected.map((product) => product.id));
  const products = [
    ...selected,
    ...catalog.filter((product) => !selectedIds.has(product.id)),
  ].slice(0, 4);

  return (
    <ul className="mirza-selection__grid">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            basePath={basePath}
            index={index}
            listId="homepage-considered-edit"
            listName="The considered edit"
            currency={currency}
          />
        </li>
      ))}
    </ul>
  );
}
