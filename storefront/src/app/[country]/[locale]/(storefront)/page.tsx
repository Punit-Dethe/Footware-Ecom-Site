import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import "../../../home-experiment.css";
import "../../../home-folio-two.css";
import "../../../home-folio-three.css";
import {
  CollectionStories,
  CraftStory,
} from "@/components/home/CollectionStories";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeProductScroller } from "@/components/home/HomeProductScroller";
import { WholesaleSection } from "@/components/home/WholesaleSection";
import { resolveCurrency } from "@/lib/data/markets";
import { generateHomeMetadata } from "@/lib/metadata/home";

const folioItalic = EB_Garamond({
  variable: "--font-folio-italic",
  subsets: ["latin"],
  style: "italic",
  weight: "400",
  display: "swap",
});

interface HomePageProps {
  params: Promise<{
    country: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { country, locale } = await params;
  return generateHomeMetadata({ country, locale });
}

export default async function HomePage({ params }: HomePageProps) {
  const { country, locale } = await params;
  const basePath = `/${country}/${locale}`;
  const currency = await resolveCurrency(country);

  return (
    <div className={`home-page mirza-home ${folioItalic.variable}`}>
      <HeroSection basePath={basePath} locale={locale} />
      <FeaturedProductsSection
        basePath={basePath}
        locale={locale}
        country={country}
        currency={currency}
      />
      <CraftStory basePath={basePath} locale={locale} />
      <HomeProductScroller
        basePath={basePath}
        locale={locale}
        country={country}
        currency={currency}
      />
      <CollectionStories basePath={basePath} locale={locale} />
      <WholesaleSection basePath={basePath} locale={locale} />
    </div>
  );
}
