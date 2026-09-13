import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface HeroSectionProps {
  basePath: string;
  locale: string;
}

export async function HeroSection({ basePath, locale }: HeroSectionProps) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__image" aria-hidden="true">
        <Image
          src="/editorial/campaign-hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="home-hero__wash" aria-hidden="true" />
      <div className="home-hero__inner">
        <div className="home-hero__copy">
          <p className="home-eyebrow">{t("badge")}</p>
          <h1 id="home-hero-title" className="home-display home-hero__title">
            {t("welcome")}
          </h1>
          <span className="home-rule" aria-hidden="true" />
          <p className="home-hero__description">{t("heroDescription")}</p>
          <Link
            className="home-button home-button--dark"
            href={`${basePath}/products`}
          >
            {t("viewCatalog")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="home-hero__side-note">{t("heroSideNote")}</p>
        <p className="home-hero__footnote">{t("heroFootnote")}</p>
      </div>
    </section>
  );
}
