import type { Metadata } from "next";
import {
  CategorySection,
  ClosingStatement,
  CraftSection,
  HeritageSection,
} from "@/components/home/EditorialSections";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { HeroSection } from "@/components/home/HeroSection";
import { WholesaleSection } from "@/components/home/WholesaleSection";
import { resolveCurrency } from "@/lib/data/markets";
import { generateHomeMetadata } from "@/lib/metadata/home";

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
    <div className="home-page">
      <HeroSection basePath={basePath} locale={locale} />
      <FeaturedProductsSection
        basePath={basePath}
        locale={locale}
        country={country}
        currency={currency}
      />
      <CraftSection basePath={basePath} locale={locale} />
      <HeritageSection basePath={basePath} locale={locale} />
      <CategorySection basePath={basePath} locale={locale} />
      <WholesaleSection basePath={basePath} locale={locale} />
      <ClosingStatement locale={locale} />
    </div>
  );
}
