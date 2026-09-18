import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminCategories } from "@/lib/db/admin-catalog";
import { ProductNewForm } from "@/components/admin/ProductNewForm";

interface ProductNewPageProps {
  params: Promise<{ country: string; locale: string }>;
}

export default async function ProductNewPage({ params }: ProductNewPageProps) {
  await connection();
  await requireAdmin();
  const { country, locale } = await params;
  const categories = await listAdminCategories();
  const basePath = `/${country}/${locale}/admin`;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Route Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#706257]">
        <Link href={`${basePath}/products`} className="hover:text-[#30261f] transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="text-[#30261f] font-medium">New Product</span>
      </nav>

      {/* Header */}
      <div className="border-b border-[#cfc4b6] pb-6">
        <span className="admin-eyebrow">Catalog Draft</span>
        <h1 className="admin-title mt-1">New Product</h1>
        <p className="admin-subtitle mt-1">
          Initial draft registration for a new footwear silhouette.
        </p>
      </div>

      {/* Editorial Helper Notice */}
      <div className="admin-feedback admin-feedback--warning">
        <svg className="w-5 h-5 shrink-0 text-[#79571e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-[#79571e] leading-relaxed">
          Products begin as drafts so imagery, variants, and publishing details can be completed in the editor before public release.
        </p>
      </div>

      <ProductNewForm
        categories={categories}
        country={country}
        locale={locale}
      />
    </div>
  );
}
