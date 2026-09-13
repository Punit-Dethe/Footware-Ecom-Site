import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
      <div className="home-craft__visual">
        <div className="home-craft__photo">
          <Image
            src="/editorial/campaign-hero.webp"
            alt={t("craftImageAlt")}
            fill
            sizes="(max-width: 900px) 100vw, 60vw"
            className="object-cover"
          />
        </div>
        <div className="home-craft__note home-craft__note--top">
          <span className="home-craft__note-dot" aria-hidden="true" />
          <strong>{t("craftFeatureOne")}</strong>
          <span>{t("craftFeatureOneDescription")}</span>
        </div>
        <div className="home-craft__note home-craft__note--bottom">
          <span className="home-craft__note-dot" aria-hidden="true" />
          <strong>{t("craftFeatureTwo")}</strong>
          <span>{t("craftFeatureTwoDescription")}</span>
        </div>
      </div>
    </section>
  );
}

export async function HeritageSection({ basePath, locale }: HomeSectionProps) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });

  return (
    <section
      id="heritage"
      className="home-heritage"
      aria-labelledby="home-heritage-title"
    >
      <div className="home-heritage__image home-heritage__image--craft">
        <Image
          src="/editorial/craft-hands.webp"
          alt={t("heritageCraftAlt")}
          fill
          sizes="(max-width: 900px) 100vw, 38vw"
          className="object-cover"
        />
      </div>
      <div className="home-heritage__copy">
        <p className="home-eyebrow">{t("heritageLabel")}</p>
        <h2
          id="home-heritage-title"
          className="home-display home-heritage__title"
        >
          {t("heritageTitle")}
        </h2>
        <p>{t("heritageDescription")}</p>
        <Link
          className="home-button home-button--outline"
          href={`${basePath}/products`}
        >
          {t("viewCatalog")} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="home-heritage__image home-heritage__image--place">
        <Image
          src="/editorial/heritage-architecture.webp"
          alt={t("heritagePlaceAlt")}
          fill
          sizes="(max-width: 900px) 100vw, 30vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}

export async function CategorySection({ basePath, locale }: HomeSectionProps) {
  const [t, snapshot] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "home" }),
    getPublicCatalogSnapshot().catch(() => null),
  ]);
  const categories =
    snapshot?.categories.filter((category) => category.parent_id === null) ??
    [];

  if (categories.length === 0) return null;

  return (
    <section
      id="categories"
      className="home-categories"
      aria-labelledby="home-categories-title"
    >
      <div className="home-section-heading">
        <h2 id="home-categories-title" className="home-section-label">
          {t("categoriesTitle")}
        </h2>
        <Link className="home-text-link" href={`${basePath}/products`}>
          {t("viewAll")} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="home-categories__grid">
        {categories.map((category) => {
          const imageUrl = snapshot?.products.find((product) =>
            product.categories.some((entry) => entry.id === category.id),
          )?.thumbnail_url;

          if (!imageUrl) return null;

          return (
            <Link
              href={`${basePath}/c/${category.permalink}`}
              className="home-category"
              key={category.id}
            >
              <span className="home-category__image">
                <Image
                  src={imageUrl}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-contain"
                />
              </span>
              <span className="home-category__caption">
                <span>{category.name}</span>
                <span className="home-category__action">
                  {t("shopCategory")} <span aria-hidden="true">→</span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
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
      <p className="home-display">“{t("closingStatement")}”</p>
      <span>Mirza Footwear</span>
    </section>
  );
}
