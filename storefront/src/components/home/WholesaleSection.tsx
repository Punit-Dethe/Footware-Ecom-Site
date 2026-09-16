import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { isWholesaleEnabled } from "@/lib/storefront";

interface WholesaleSectionProps {
  basePath: string;
  locale: string;
}

/**
 * Optional trade entry point, kept within the homepage's editorial system.
 */
export async function WholesaleSection({
  basePath,
  locale,
}: WholesaleSectionProps) {
  // Opt-in addon: no wholesale pitch on DTC-only storefronts.
  if (!isWholesaleEnabled()) return null;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });

  const benefits = [
    {
      title: t("wholesaleBenefitPricingTitle"),
      description: t("wholesaleBenefitPricingDescription"),
    },
    {
      title: t("wholesaleBenefitQuickOrderTitle"),
      description: t("wholesaleBenefitQuickOrderDescription"),
    },
    {
      title: t("wholesaleBenefitOrdersTitle"),
      description: t("wholesaleBenefitOrdersDescription"),
    },
  ];

  return (
    <section className="mirza-wholesale mirza-frame">
      <div className="mirza-wholesale__grid">
        {/* Pitch + CTAs */}
        <div>
          <h2 className="mirza-display">{t("wholesaleTitle")}</h2>
          <p className="mirza-wholesale__description">
            {t("wholesaleDescription")}
          </p>
          <div className="mirza-wholesale__actions">
            <Link className="mirza-button" href={`${basePath}/wholesale`}>
              {t("wholesaleCtaPrimary")}
              <ArrowUpRight size={17} strokeWidth={1.4} aria-hidden="true" />
            </Link>
            <Link className="mirza-link" href={`${basePath}/wholesale/apply`}>
              {t("wholesaleCtaSecondary")}
            </Link>
          </div>
        </div>

        <ul className="mirza-wholesale__benefits">
          {benefits.map((benefit) => (
            <li key={benefit.title}>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
