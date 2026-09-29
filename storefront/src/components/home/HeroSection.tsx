import Image from "next/image";
import { getTranslations } from "next-intl/server";

interface HeroSectionProps {
  basePath: string;
  locale: string;
}

export async function HeroSection({ locale }: HeroSectionProps) {
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
      <h1 id="home-hero-title" className="sr-only">
        {t("journal.heroTitle")} {t("journal.heroTitleAccent")}
      </h1>
    </section>
  );
}
