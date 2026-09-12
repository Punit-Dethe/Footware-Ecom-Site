import { notFound } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { getAdminProduct, listAdminCategories } from "@/lib/db/admin-catalog";
import { ProductEditForm } from "@/components/admin/ProductEditForm";

interface ProductDetailPageProps {
  params: Promise<{ country: string; locale: string; id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  await connection();
  const { country, locale, id } = await params;

  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    listAdminCategories(),
  ]);

  if (!product) {
    notFound();
  }

  const basePath = `/${country}/${locale}/admin`;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <Link href={`${basePath}/products`} className="hover:text-gray-900">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </div>

      <ProductEditForm
        initialProduct={product}
        availableCategories={categories}
        country={country}
        locale={locale}
      />
    </div>
  );
}
