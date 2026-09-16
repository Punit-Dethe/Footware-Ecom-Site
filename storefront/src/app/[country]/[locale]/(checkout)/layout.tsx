"use client";

import "../../../checkout-page.css";
import { ArrowLeft, ChevronDown, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { AuthRouteSync } from "@/components/auth/AuthRouteSync";
import {
  CheckoutProvider,
  CheckoutSummary,
  useCheckout,
} from "@/contexts/CheckoutContext";
import { POLICY_LINKS } from "@/lib/constants/policies";
import { getStoreName } from "@/lib/store";
import { extractBasePath } from "@/lib/utils/path";

const storeName = getStoreName();

function CheckoutHeader() {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("checkoutLayout");
  const checkout = useTranslations("checkout");

  return (
    <header className="checkout-header">
      <Link href={basePath || "/"} className="checkout-brand">
        <span className="checkout-brand__name">MIRZA</span>
        <span className="checkout-brand__descriptor">FOOTWEAR</span>
      </Link>
      <span className="checkout-header__context">{checkout("checkout")}</span>
      <Link
        href={basePath || "/"}
        className="checkout-header__back"
        aria-label={t("backToStore")}
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t("backToStore")}
      </Link>
    </header>
  );
}

function CheckoutFooter() {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("checkoutLayout");
  const tp = useTranslations("policies");

  return (
    <footer className="checkout-footer">
      <p>{t("allRightsReserved", { year: 2026, storeName })}</p>
      {POLICY_LINKS.map((policy) => (
        <Link
          key={policy.slug}
          href={`${basePath}/policies/${policy.slug}`}
          target="_blank"
          className="checkout-footer__link"
        >
          {tp(policy.nameKey)}
        </Link>
      ))}
    </footer>
  );
}

function MobileSummaryToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("checkoutLayout");
  const { summaryContent } = useCheckout();

  // Hide the toggle entirely when there's no summary to show (e.g. the
  // order-placed page clears summaryContent because the page already
  // displays the order details inline).
  if (summaryContent === null) return null;

  return (
    <div className="checkout-mobile-summary lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="checkout-mobile-summary__toggle"
        aria-expanded={isOpen}
        aria-controls="checkout-summary-panel"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ShoppingBag className="w-5 h-5" />
          {isOpen ? t("hideOrderSummary") : t("showOrderSummary")}
        </span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          id="checkout-summary-panel"
          className="checkout-mobile-summary__panel"
        >
          <CheckoutSummary />
        </div>
      )}
    </div>
  );
}

interface CheckoutLayoutProps {
  children: React.ReactNode;
}

function CheckoutLayoutContent({ children }: CheckoutLayoutProps) {
  const { summaryContent } = useCheckout();
  const hasSummary = summaryContent !== null;

  return (
    <div className="checkout-shell min-h-screen flex flex-col">
      {/* Mobile header */}
      <div className="checkout-shell__mobile-header lg:hidden">
        <div>
          <CheckoutHeader />
        </div>
      </div>

      {/* Mobile summary toggle */}
      <MobileSummaryToggle />

      {/* Main checkout grid — Shopify proportions */}
      <div
        className={`checkout-shell__grid ${
          hasSummary ? "" : "checkout-shell__grid--without-summary"
        }`}
      >
        {/* Main content area — white bg */}
        <div className="checkout-shell__main">
          <div className="checkout-shell__content">
            {/* Desktop header */}
            <div className="checkout-shell__desktop-header hidden lg:block">
              <CheckoutHeader />
            </div>
            {children}
          </div>
          <div className="checkout-shell__footer-wrap">
            <CheckoutFooter />
          </div>
        </div>

        {/* Desktop summary sidebar — Shopify: light gray bg with left border */}
        {hasSummary && (
          <aside className="checkout-shell__summary hidden lg:block">
            <div className="checkout-shell__summary-inner">
              <CheckoutSummary />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <CheckoutProvider>
      <Suspense fallback={null}>
        <AuthRouteSync>
          <CheckoutLayoutContent>{children}</CheckoutLayoutContent>
        </AuthRouteSync>
      </Suspense>
    </CheckoutProvider>
  );
}
