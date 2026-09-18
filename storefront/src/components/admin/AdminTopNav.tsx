"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminTopNavProps {
  basePath: string;
}

export function AdminTopNav({ basePath }: AdminTopNavProps) {
  const pathname = usePathname();

  const navLinks = [
    { label: "Overview", href: basePath },
    { label: "Products", href: `${basePath}/products` },
    { label: "Categories", href: `${basePath}/categories` },
    { label: "Media", href: `${basePath}/media` },
  ];

  return (
    <nav className="flex items-center gap-6 text-sm" aria-label="Studio Navigation">
      {navLinks.map((link) => {
        const isActive =
          link.href === basePath
            ? pathname === basePath || pathname === `${basePath}/`
            : pathname === link.href || (Boolean(pathname) && pathname.startsWith(`${link.href}/`));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-nav-item ${isActive ? "admin-nav-item--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
