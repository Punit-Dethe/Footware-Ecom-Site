import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getAdminIdentity } from "@/lib/auth/admin";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ country: string; locale: string }>;
}

export default function AdminLayout(props: AdminLayoutProps) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutContent {...props} />
    </Suspense>
  );
}

async function AdminLayoutContent({
  children,
  params,
}: AdminLayoutProps) {
  await connection();
  const { country, locale } = await params;
  const adminIdentity = await getAdminIdentity();

  if (!adminIdentity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="size-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 font-semibold text-lg">
            !
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-sm text-gray-600 mb-6">
            Administrator authorization is required to access the catalog management portal.
          </p>
          <div className="space-y-3">
            <Link
              href={`/${country}/${locale}/account`}
              className="block w-full py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
            >
              Sign In to Admin Account
            </Link>
            <Link
              href={`/${country}/${locale}`}
              className="block w-full py-2 px-4 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md border border-gray-300 transition-colors"
            >
              Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const basePath = `/${country}/${locale}/admin`;
  const storefrontPath = `/${country}/${locale}`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-gray-900 text-white border-b border-gray-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link
              href={basePath}
              className="font-bold text-base tracking-wider flex items-center gap-2"
            >
              <span className="bg-white text-gray-900 px-2 py-0.5 rounded text-xs uppercase font-extrabold tracking-normal">
                Admin
              </span>
              MIRZA CATALOG
            </Link>
            <nav className="flex items-center space-x-4 text-sm font-medium">
              <Link
                href={`${basePath}/products`}
                className="text-gray-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
              >
                Products
              </Link>
              <Link
                href={`${basePath}/categories`}
                className="text-gray-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
              >
                Categories
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-400 hidden sm:inline text-xs">
              {adminIdentity.email || adminIdentity.userId}
            </span>
            <Link
              href={storefrontPath}
              className="text-gray-300 hover:text-white text-xs border border-gray-700 hover:border-gray-500 px-3 py-1 rounded transition-colors"
            >
              Back to Storefront &rarr;
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
