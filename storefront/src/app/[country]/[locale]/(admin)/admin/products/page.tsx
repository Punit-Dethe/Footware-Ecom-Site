import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminProducts } from "@/lib/db/admin-catalog";

interface AdminProductsPageProps {
  params: Promise<{ country: string; locale: string }>;
}

export default async function AdminProductsPage({
  params,
}: AdminProductsPageProps) {
  await connection();
  await requireAdmin();
  const { country, locale } = await params;
  const products = await listAdminProducts();
  const basePath = `/${country}/${locale}/admin`;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the first-party PostgreSQL catalog. Create, edit, publish, and archive products.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href={`${basePath}/products/new`}
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
          >
            + New Product
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3">Product</th>
                <th scope="col" className="px-6 py-3">Base SKU</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Categories</th>
                <th scope="col" className="px-6 py-3">Variants / Price</th>
                <th scope="col" className="px-6 py-3">Total Stock</th>
                <th scope="col" className="px-6 py-3">Updated</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No products found in catalog database.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  let statusBadge = (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      Draft
                    </span>
                  );
                  if (p.status === "active") {
                    statusBadge = (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Active
                      </span>
                    );
                  } else if (p.status === "archived") {
                    statusBadge = (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        Archived
                      </span>
                    );
                  }

                  let priceDisplay = "—";
                  if (p.minPriceInCents != null && p.maxPriceInCents != null) {
                    if (p.minPriceInCents === p.maxPriceInCents) {
                      priceDisplay = `$${(p.minPriceInCents / 100).toFixed(2)}`;
                    } else {
                      priceDisplay = `$${(p.minPriceInCents / 100).toFixed(2)} - $${(p.maxPriceInCents / 100).toFixed(2)}`;
                    }
                  }

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-600">
                        {p.sku || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusBadge}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {p.categories.map((c) => c.name).join(", ") || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="text-gray-900 font-medium">{p.variantCount} variants</div>
                        <div className="text-gray-500">{priceDisplay}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 whitespace-nowrap">
                        {p.totalStock} units
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-xs whitespace-nowrap">
                        <Link
                          href={`${basePath}/products/${p.id}`}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Edit &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
