import Link from "next/link";
import { connection } from "next/server";
import { listAdminCategories } from "@/lib/db/admin-catalog";
import { ProductNewForm } from "@/components/admin/ProductNewForm";

interface ProductNewPageProps {
  params: Promise<{ country: string; locale: string }>;
}

export default async function ProductNewPage({ params }: ProductNewPageProps) {
  await connection();
  const { country, locale } = await params;
  const categories = await listAdminCategories();
  const basePath = `/${country}/${locale}/admin`;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <Link href={`${basePath}/products`} className="hover:text-gray-900">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">New Product</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Draft Product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Initial products are saved as drafts and hidden from the public storefront until published.
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
