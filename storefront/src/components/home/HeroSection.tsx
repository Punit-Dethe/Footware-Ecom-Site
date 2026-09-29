import { ArrowRight } from "lucide-react";
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
    <section className="mirza-evening-hero" aria-labelledby="home-hero-title">
      <Image
        className="mirza-evening-hero__image"
        src="/editorial/traditional-courtyard-dusk.webp"
        alt=""
        fill
        priority
        sizes="(max-aspect-ratio: 2.28/1) 228vh, 100vw"
      />
      <div className="mirza-evening-hero__content mirza-frame">
        <div className="mirza-evening-hero__copy">
          <h1 id="home-hero-title" className="mirza-evening-hero__title mirza-display">
            <span>{t("heroOverlayTitle")}</span>
            <em>{t("heroOverlayAccent")}</em>
          </h1>
          <p className="mirza-evening-hero__subtitle mirza-display">
            {t("heroOverlaySubtitle")}
          </p>
          <Link className="mirza-evening-hero__link" href={`${basePath}/products`}>
            <span>{t("heroOverlayCta")}</span>
            <ArrowRight size={17} strokeWidth={1.2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
