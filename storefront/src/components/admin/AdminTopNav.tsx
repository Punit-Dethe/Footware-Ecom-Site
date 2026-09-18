"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminTopNavProps {
  basePath: string;
}

export function AdminTopNav({ basePath }: AdminTopNavProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === basePath) {
      return pathname === basePath || pathname === `${basePath}/`;
    }
    return pathname === href || (Boolean(pathname) && pathname.startsWith(`${href}/`));
  };

  const catalogLinks = [
    { label: "Products", href: `${basePath}/products` },
    { label: "Categories", href: `${basePath}/categories` },
    { label: "Media", href: `${basePath}/media` },
  ];

  const commerceLinks = [
    { label: "Orders", href: `${basePath}/orders` },
    { label: "Customers", href: `${basePath}/customers` },
  ];

  const overviewActive = isLinkActive(basePath);

  return (
    <nav
      className="flex items-center gap-4 sm:gap-6 text-sm overflow-x-auto whitespace-nowrap scrollbar-none py-1"
      aria-label="Studio Navigation"
    >
      {/* Overview */}
      <Link
        href={basePath}
        className={`admin-nav-item ${overviewActive ? "admin-nav-item--active" : ""}`}
        aria-current={overviewActive ? "page" : undefined}
      >
        Overview
      </Link>

      <span className="w-px h-3.5 bg-[#E5E0D8] shrink-0" aria-hidden="true" />

      {/* Catalog Group */}
      <div className="flex items-center gap-3 sm:gap-5">
        <span className="text-[10px] tracking-widest uppercase font-mono text-[#A39E93] hidden xl:inline select-none">
          Catalog
        </span>
        {catalogLinks.map((link) => {
          const active = isLinkActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-nav-item ${active ? "admin-nav-item--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <span className="w-px h-3.5 bg-[#E5E0D8] shrink-0" aria-hidden="true" />

      {/* Commerce Group */}
      <div className="flex items-center gap-3 sm:gap-5">
        <span className="text-[10px] tracking-widest uppercase font-mono text-[#A39E93] hidden xl:inline select-none">
          Commerce
        </span>
        {commerceLinks.map((link) => {
          const active = isLinkActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-nav-item ${active ? "admin-nav-item--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

