import { ArrowUpRight } from "lucide-react";
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
    <section className="mirza-opening-field" aria-labelledby="home-hero-title">
      <div className="mirza-opening mirza-frame">
        <h1 id="home-hero-title" className="mirza-display mirza-opening__title">
          <span>{t("journal.heroTitle")}</span>
          <em>{t("journal.heroTitleAccent")}</em>
        </h1>
        <div className="mirza-opening__copy">
          <p className="mirza-opening__description">
            {t("journal.heroDescription")}
          </p>
          <Link className="mirza-button" href={`${basePath}/products`}>
            {t("journal.heroCta")}
            <ArrowUpRight size={17} strokeWidth={1.4} aria-hidden="true" />
          </Link>
        </div>
        <div className="mirza-opening__image">
          <Image
            src="/editorial/campaign-hero.webp"
            alt={t("journal.heroImageAlt")}
            fill
            priority
            sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1440px) 61vw, 960px"
          />
        </div>
        <figure className="mirza-opening__craft">
          <div className="mirza-opening__craft-image">
            <Image
              src="/editorial/craft-hands.webp"
              alt={t("journal.craftImageAlt")}
              fill
              sizes="(max-width: 760px) 42vw, (max-width: 1440px) 28vw, 440px"
            />
          </div>
          <figcaption>
            <a className="mirza-opening__craft-link" href="#craft">
              {t("journal.heroCraftCta")}
              <ArrowUpRight size={16} strokeWidth={1.4} aria-hidden="true" />
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
