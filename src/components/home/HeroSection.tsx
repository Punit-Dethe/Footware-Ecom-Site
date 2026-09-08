import {
  ArrowRight,
  CheckCircle2,
  Crown,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
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
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-950 via-[#181614] to-stone-950 text-stone-100 border-b border-stone-800">
      {/* Warm ambient glows */}
      <div
        className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-12 right-1/4 w-[32rem] h-[32rem] bg-orange-800/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Brand Story & Navigation Gateways */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/25 mb-6 backdrop-blur-sm">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{t("badge")}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-100 leading-[1.12]">
              {t("welcome")}
            </h1>

            {/* Narrative Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-stone-300 max-w-xl leading-relaxed font-light">
              {t("heroDescription")}
            </p>

            {/* Primary Action Gateways */}
            <div className="mt-8 flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link
                href={`${basePath}/c/formal-office`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg shadow-amber-950/40 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <span>{t("exploreFormals")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={`${basePath}/c/traditional-indian`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-all duration-200"
              >
                <span>{t("shopTraditional")}</span>
              </Link>

              <Link
                href={`${basePath}/products`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-stone-400 hover:text-amber-300 transition-colors font-medium ml-1 sm:ml-2 py-2"
              >
                <span>{t("viewCatalog")}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            {/* Quick Guarantees / Badges */}
            <div className="mt-10 pt-8 border-t border-stone-800/80 grid grid-cols-3 gap-4 w-full max-w-lg">
              <div className="flex flex-col">
                <span className="font-serif text-amber-400 text-lg sm:text-xl font-bold">
                  100%
                </span>
                <span className="text-xs text-stone-400 mt-0.5 font-medium">
                  Full-Grain Leather
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-amber-400 text-lg sm:text-xl font-bold">
                  Goodyear
                </span>
                <span className="text-xs text-stone-400 mt-0.5 font-medium">
                  Welted Resoleable
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-amber-400 text-lg sm:text-xl font-bold">
                  Dabka & Zardozi
                </span>
                <span className="text-xs text-stone-400 mt-0.5 font-medium">
                  Hand-Embroidered
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Product Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Product Card 1: Sovereign Oxford */}
              <Link
                href={`${basePath}/products/mirza-imperial-wholecut-oxford`}
                className="group block relative rounded-2xl overflow-hidden bg-stone-900/90 border border-stone-800 shadow-2xl shadow-black/80 transition-all duration-300 hover:border-amber-500/40 hover:-translate-y-1"
              >
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-stone-900">
                  <Image
                    src="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=85"
                    alt="Mirza Imperial Wholecut Oxford in Mahogany Tan"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, 450px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                  <span className="absolute top-4 left-4 px-2.5 py-1 rounded text-[11px] font-semibold tracking-wider uppercase bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30">
                    Goodyear 360°
                  </span>
                  <span className="absolute top-4 right-4 px-2.5 py-1 rounded text-xs font-bold bg-amber-500 text-stone-950 shadow-md">
                    $185.00
                  </span>
                </div>
                <div className="p-5">
                  <span className="text-xs text-amber-400/90 tracking-wider uppercase font-semibold">
                    Formal Executive
                  </span>
                  <h2 className="font-serif text-lg font-bold text-stone-100 group-hover:text-amber-300 transition-colors mt-0.5">
                    Mirza Imperial Wholecut Oxford
                  </h2>
                  <p className="text-xs text-stone-400 mt-1 line-clamp-1">
                    Single-piece Italian calfskin with hand-burnished mahogany
                    patina.
                  </p>
                </div>
              </Link>

              {/* Product Card 2: Royal Embroidered Jutti (Nested Overlap) */}
              <Link
                href={`${basePath}/products/mirza-royal-embroidered-jutti`}
                className="group relative -mt-10 ml-6 sm:ml-12 block rounded-2xl overflow-hidden bg-stone-900/95 border border-stone-700/80 shadow-2xl shadow-black/90 transition-all duration-300 hover:border-amber-400/60 hover:-translate-y-1"
              >
                <div className="flex items-center p-3 gap-4">
                  <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-stone-800">
                    <Image
                      src="https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=300&q=80"
                      alt="Mirza Royal Embroidered Jutti"
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-amber-400 uppercase font-semibold tracking-wider">
                        Ceremonial Heritage
                      </span>
                      <span className="text-xs font-bold text-amber-300">
                        $95.00
                      </span>
                    </div>
                    <h3 className="font-serif text-sm font-bold text-stone-100 group-hover:text-amber-300 transition-colors truncate mt-0.5">
                      Mirza Royal Embroidered Jutti
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>In Stock · Ready to Ship</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Excellence Bar */}
        <div className="mt-16 pt-10 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5 p-3 rounded-lg bg-stone-900/40 border border-stone-800/50">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-stone-200">
                {t("qualityProducts")}
              </h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                {t("qualityDescription")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-lg bg-stone-900/40 border border-stone-800/50">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-stone-200">
                Master Craftsmen
              </h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Decades of artisan shoe-making tradition and fine
                hand-needlework.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-lg bg-stone-900/40 border border-stone-800/50">
            <Truck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-stone-200">
                {t("fastShipping")}
              </h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                {t("shippingDescription")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-lg bg-stone-900/40 border border-stone-800/50">
            <RotateCcw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-stone-200">
                {t("support")}
              </h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                {t("supportDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
