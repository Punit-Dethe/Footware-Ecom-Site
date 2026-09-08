import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

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
    <section className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-amber-800 uppercase mb-3">
            {t("badge")}
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight text-gray-900 leading-tight">
            {t("welcome")}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {t("heroDescription")}
          </p>
          <div className="mt-8 flex justify-center gap-3 sm:gap-4 flex-wrap">
            <Button size="lg" asChild>
              <Link href={`${basePath}/products`}>{t("shopNow")}</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={`${basePath}/c/formal-office`}>
                {t("exploreFormals")}
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={`${basePath}/c/traditional-indian`}>
                {t("shopTraditional")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
