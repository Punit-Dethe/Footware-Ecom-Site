import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { POLICY_LINKS } from "@/lib/constants/policies";
import { getStoreDescription, getStoreName } from "@/lib/store";
import { isWholesaleEnabled } from "@/lib/storefront";
import type { Category } from "@/types/commerce";
import { CurrentYear } from "./CurrentYear";

const storeName = getStoreName();
const storeDescription = getStoreDescription();

interface FooterProps {
  basePath: string;
  locale: Locale;
  categoryLinks: ReactNode;
}

interface FooterCategoryLinksProps {
  rootCategories: Category[];
  basePath: string;
}

export function FooterCategoryLinks({
  rootCategories,
  basePath,
}: FooterCategoryLinksProps) {
  return rootCategories.map((category) => (
    <li key={category.id}>
      <Link
        href={`${basePath}/c/${category.permalink}`}
        className="editorial-footer__link"
      >
        {category.name}
      </Link>
    </li>
  ));
}

export async function Footer({ basePath, locale, categoryLinks }: FooterProps) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tp = await getTranslations({ locale, namespace: "policies" });
  const wholesaleEnabled = isWholesaleEnabled();

  return (
    <footer className="editorial-footer">
      <div className="editorial-footer__inner">
        <div className="editorial-footer__grid">
          {/* Brand */}
          <div>
            <Link
              href={basePath}
              className="editorial-footer__brand"
              aria-label={storeName}
            >
              <span>MIRZA</span>
              <small>FOOTWEAR</small>
            </Link>
            <p className="editorial-footer__description">
              {t("description") || storeDescription}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="editorial-footer__heading">{t("shop")}</h3>
            <ul className="editorial-footer__links">
              <li>
                <Link
                  href={`${basePath}/products`}
                  className="editorial-footer__link"
                >
                  {t("allProducts")}
                </Link>
              </li>
              {categoryLinks}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="editorial-footer__heading">{t("account")}</h3>
            <ul className="editorial-footer__links">
              <li>
                <Link
                  href={`${basePath}/account`}
                  className="editorial-footer__link"
                >
                  {t("myAccount")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/account/orders`}
                  className="editorial-footer__link"
                >
                  {t("orderHistory")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/cart`}
                  className="editorial-footer__link"
                >
                  {t("cart")}
                </Link>
              </li>
              {wholesaleEnabled && (
                <li>
                  <Link
                    href={`${basePath}/wholesale`}
                    className="editorial-footer__link"
                  >
                    {t("wholesale")}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="editorial-footer__heading">{t("policies")}</h3>
            <ul className="editorial-footer__links">
              {POLICY_LINKS.map((policy) => (
                <li key={policy.slug}>
                  <Link
                    href={`${basePath}/policies/${policy.slug}`}
                    className="editorial-footer__link"
                  >
                    {tp(policy.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="editorial-footer__bottom">
          <p>
            &copy; <CurrentYear /> {storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
