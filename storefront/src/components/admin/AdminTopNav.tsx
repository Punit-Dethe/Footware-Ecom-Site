"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminTopNavProps {
  basePath: string;
}

export function AdminTopNav({ basePath }: AdminTopNavProps) {
  const pathname = usePathname();

  const navLinks = [
    { label: "Products", href: `${basePath}/products` },
    { label: "Categories", href: `${basePath}/categories` },
    { label: "Media", href: `${basePath}/media` },
  ];

  return (
    <nav className="flex items-center gap-6 text-sm">
      {navLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== basePath && pathname?.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-nav-item ${isActive ? "admin-nav-item--active" : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
