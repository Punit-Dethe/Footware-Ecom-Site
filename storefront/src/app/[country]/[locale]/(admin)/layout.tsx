import "@/app/admin.css";

import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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

async function AdminLayoutContent({ children, params }: AdminLayoutProps) {
  await connection();
  const { country, locale } = await params;
  const adminIdentity = await getAdminIdentity();

  if (!adminIdentity) {
    return (
      <div className="admin-shell flex items-center justify-center p-6 min-h-screen">
        <div className="max-w-md w-full bg-[#fffefc] border border-[#cfc4b6] p-10 text-center rounded-[2px] shadow-sm">
          <div className="admin-eyebrow mb-2">Mirza Studio</div>
          <h1 className="admin-title text-2xl mb-3">Access Restricted</h1>
          <p className="admin-subtitle text-sm mb-8">
            Administrator authorization is required to enter the Mirza catalog and media management console.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/${country}/${locale}/account`}
              className="admin-btn admin-btn-primary w-full py-2.5"
            >
              Sign In to Admin Account
            </Link>
            <Link
              href={`/${country}/${locale}`}
              className="admin-btn admin-btn-secondary w-full py-2.5"
            >
              Return to Storefront &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const basePath = `/${country}/${locale}/admin`;
  const storefrontPath = `/${country}/${locale}`;
  const adminEmail = adminIdentity.email || adminIdentity.userId;

  return (
    <div className="admin-shell min-h-screen flex flex-col lg:flex-row bg-[#f3efe8]">
      <AdminSidebar
        basePath={basePath}
        storefrontPath={storefrontPath}
        adminEmail={adminEmail}
      />

      <main className="admin-main flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
