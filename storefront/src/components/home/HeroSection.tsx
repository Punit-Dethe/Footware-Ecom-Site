import Image from "next/image";
import { getTranslations } from "next-intl/server";

interface HeroSectionProps {
  basePath?: string;
  locale: string;
}

const TRADITIONAL_HERITAGE_IMAGE =
  "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E";

export async function HeroSection({ locale }: HeroSectionProps) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });

  return (
    <section className="border-b border-gray-100 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left-aligned text & description - simple, no buttons */}
          <div className="text-left lg:col-span-6 space-y-4">
            <p className="text-xs sm:text-sm font-semibold tracking-widest text-amber-800 uppercase">
              {t("badge")}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-gray-900 leading-tight">
              {t("welcome")}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl">
              {t("heroDescription")}
            </p>
          </div>

          {/* Normal good traditional image */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
              <Image
                src={TRADITIONAL_HERITAGE_IMAGE}
                alt="Traditional Indian heritage architecture"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
