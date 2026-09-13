import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProductCarousel } from "@/components/products/ProductCarousel";
import { getPublicCatalogSnapshot } from "@/lib/catalog/catalog-repository";

interface HomeSectionProps {
  basePath: string;
  locale: string;
}

export async function CraftSection({ basePath, locale }: HomeSectionProps) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });

  return (
    <section
      id="craft"
      className="home-craft"
      aria-labelledby="home-craft-title"
    >
      <div className="home-craft__photo">
        <Image
          src="/editorial/campaign-hero.webp"
          alt={t("craftImageAlt")}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="home-craft__wash" aria-hidden="true" />
      <div className="home-craft__copy">
        <p className="home-eyebrow">{t("craftLabel")}</p>
        <h2 id="home-craft-title" className="home-display home-craft__title">
          {t("craftTitle")}
        </h2>
        <p className="home-craft__description">{t("craftDescription")}</p>
        <Link
          className="home-button home-button--outline"
          href={`${basePath}/products`}
        >
          {t("viewCatalog")} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

export async function EditorialProductRow({
  basePath,
  locale,
  currency,
}: HomeSectionProps & { currency?: string }) {
  const [tHome, tProducts, snapshot] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "home" }),
    getTranslations({ locale: locale as Locale, namespace: "products" }),
    getPublicCatalogSnapshot().catch(() => null),
  ]);

  if (!snapshot?.products.length) return null;

  return (
    <section className="home-edit-row" aria-label={tProducts("allProducts")}>
      <div className="home-edit-row__copy">
        <div>
          <h2 className="home-display home-edit-row__title">
            {tHome("editTitle")}
          </h2>
          <p className="home-edit-row__description">
            {tHome("editDescription")}
          </p>
        </div>
        <Link className="home-text-link" href={`${basePath}/products`}>
          {tHome("viewAll")} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="home-edit-row__products">
        <ProductCarousel
          products={snapshot.products}
          basePath={basePath}
          currency={currency}
          ariaLabel={tProducts("allProducts")}
          listId="editorial-all-products"
          listName="All Products"
          priorityFirst={false}
        />
      </div>
    </section>
  );
}

export async function CultureMosaicSection({ locale }: { locale: string }) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });
  return (
    <section className="home-culture-mosaic" aria-label={t("cultureGallery")}>
      <div className="home-culture-mosaic__tile home-culture-mosaic__tile--architecture">
        <Image
          src="/editorial/heritage-architecture.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="home-culture-mosaic__tile home-culture-mosaic__tile--craft">
        <Image
          src="/editorial/craft-hands.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
      <div className="home-culture-mosaic__tile home-culture-mosaic__tile--detail">
        <Image
          src="/editorial/heritage-architecture.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
      <div className="home-culture-mosaic__tile home-culture-mosaic__tile--footwear">
        <Image
          src="/editorial/campaign-hero.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}

export async function MoreProductsSection({
  basePath,
  locale,
  currency,
}: HomeSectionProps & { currency?: string }) {
  const [t, snapshot] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "home" }),
    getPublicCatalogSnapshot().catch(() => null),
  ]);
  if (!snapshot?.products.length) return null;

  const products =
    snapshot.products.length > 8
      ? snapshot.products.slice(8)
      : snapshot.products;

  return (
    <section
      className="home-highlights home-more-products"
      aria-labelledby="home-more-products-title"
    >
      <div className="home-section-heading">
        <h2 id="home-more-products-title" className="home-section-label">
          {t("moreToDiscover")}
        </h2>
        <Link className="home-text-link" href={`${basePath}/products`}>
          {t("viewAll")} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ProductCarousel
        products={products}
        basePath={basePath}
        currency={currency}
        ariaLabel={t("moreToDiscover")}
        listId="more-products"
        listName="More Products"
        priorityFirst={false}
      />
    </section>
  );
}

export async function ClosingStatement({ locale }: { locale: string }) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });

  return (
    <section className="home-closing" aria-label={t("closingStatement")}>
      <Image
        src="/editorial/craft-hands.webp"
        alt=""
        fill
        sizes="100vw"
        className="home-closing__image"
      />
      <div className="home-closing__shade" aria-hidden="true" />
      <p className="home-display">“{t("closingStatement")}”</p>
      <span>Mirza Footwear</span>
    </section>
  );
}
