"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

interface AdminSidebarProps {
  basePath: string;
  storefrontPath: string;
  adminEmail: string;
}

interface NavLinkItem {
  label: string;
  href: string;
}

export function AdminSidebar({
  basePath,
  storefrontPath,
  adminEmail,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLinkActive = (href: string) => {
    if (href === basePath) {
      return pathname === basePath || pathname === `${basePath}/`;
    }
    return pathname === href || (Boolean(pathname) && pathname.startsWith(`${href}/`));
  };

  const catalogLinks: NavLinkItem[] = [
    { label: "Products", href: `${basePath}/products` },
    { label: "Categories", href: `${basePath}/categories` },
    { label: "Media", href: `${basePath}/media` },
  ];

  const commerceLinks: NavLinkItem[] = [
    { label: "Orders", href: `${basePath}/orders` },
    { label: "Customers", href: `${basePath}/customers` },
  ];

  const overviewActive = isLinkActive(basePath);

  const renderNavContent = (onLinkClick?: () => void) => (
    <nav className="flex-1 flex flex-col justify-between py-4" aria-label="Studio Navigation">
      <div className="space-y-6">
        {/* Overview Top Level */}
        <div>
          <Link
            href={basePath}
            onClick={onLinkClick}
            className={`admin-sidebar-link ${
              overviewActive ? "admin-sidebar-link--active" : ""
            }`}
            aria-current={overviewActive ? "page" : undefined}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#706257]/60" aria-hidden="true" />
            <span>Overview</span>
          </Link>
        </div>

        {/* Catalog Section */}
        <div className="admin-sidebar-group">
          <div className="admin-sidebar-group-title">Catalog</div>
          <div className="space-y-1">
            {catalogLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onLinkClick}
                  className={`admin-sidebar-link ${
                    active ? "admin-sidebar-link--active" : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? "bg-[#30261f]" : "bg-transparent"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Commerce Section */}
        <div className="admin-sidebar-group">
          <div className="admin-sidebar-group-title">Commerce</div>
          <div className="space-y-1">
            {commerceLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onLinkClick}
                  className={`admin-sidebar-link ${
                    active ? "admin-sidebar-link--active" : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? "bg-[#30261f]" : "bg-transparent"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className="pt-6 border-t border-[#cfc4b6] space-y-3">
        <Link
          href={storefrontPath}
          onClick={onLinkClick}
          className="flex items-center justify-between text-xs text-[#706257] hover:text-[#30261f] transition-colors py-1 px-2 rounded-[2px] hover:bg-[#e9e2d6]/40"
        >
          <span>View Storefront</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>

        <div className="flex items-center justify-between pt-3 border-t border-[#e9e2d6] px-2 text-[11px]">
          <span className="text-[#706257] truncate max-w-[130px]" title={adminEmail}>
            {adminEmail}
          </span>
          <span className="admin-badge admin-badge--active text-[8px] py-0 px-1.5">
            Admin
          </span>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP PERSISTENT LEFT SIDEBAR                                       */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex admin-sidebar h-screen sticky top-0 overflow-y-auto">
        <div className="admin-sidebar-header">
          <Link href={basePath} className="flex items-baseline gap-2.5 no-underline">
            <span className="admin-brand">MIRZA</span>
            <span className="text-[#cfc4b6] text-xs">/</span>
            <span className="admin-brand-tag">Studio</span>
          </Link>
        </div>

        <div className="flex-1 px-3 py-2 flex flex-col">
          {renderNavContent()}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE / TABLET HEADER & DRAWER TRIGGER (< lg)                        */}
      {/* ========================================================================= */}
      <header className="lg:hidden sticky top-0 z-40 h-14 bg-[#f3efe8]/95 backdrop-blur border-b border-[#cfc4b6] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open Studio navigation"
            className="p-2 -ml-2 text-[#30261f] hover:bg-[#e9e2d6] rounded-[2px] transition-colors flex items-center justify-center"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <Link href={basePath} className="flex items-baseline gap-2 no-underline">
            <span className="admin-brand text-lg">MIRZA</span>
            <span className="text-[#cfc4b6] text-xs">/</span>
            <span className="admin-brand-tag text-[8px]">Studio</span>
          </Link>
        </div>

        <Link
          href={storefrontPath}
          className="admin-btn admin-btn-quiet text-[10px] tracking-wider uppercase py-1 px-2.5"
        >
          Storefront &rarr;
        </Link>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE RADIX DIALOG DRAWER                                            */}
      {/* ========================================================================= */}
      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="admin-drawer-backdrop" />
          <DialogPrimitive.Content
            className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-[#f3efe8] border-r border-[#cfc4b6] z-50 p-6 flex flex-col justify-between shadow-2xl outline-none"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#cfc4b6]">
                <Link
                  href={basePath}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-baseline gap-2.5 no-underline"
                >
                  <span className="admin-brand text-xl">MIRZA</span>
                  <span className="text-[#cfc4b6] text-xs">/</span>
                  <span className="admin-brand-tag">Studio</span>
                </Link>

                <DialogPrimitive.Close
                  aria-label="Close navigation"
                  className="p-1.5 text-[#706257] hover:text-[#30261f] rounded-[2px] hover:bg-[#e9e2d6] transition-colors"
                >
                  ✕
                </DialogPrimitive.Close>
              </div>

              <DialogPrimitive.Title className="sr-only">
                Mirza Studio Navigation
              </DialogPrimitive.Title>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto">
              {renderNavContent(() => setMobileOpen(false))}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
