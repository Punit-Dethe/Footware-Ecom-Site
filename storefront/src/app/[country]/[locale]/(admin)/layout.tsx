import "@/app/admin.css";

import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
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
      <div className="admin-shell flex items-center justify-center p-6">
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

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8 sm:gap-10">
            <Link href={basePath} className="flex items-baseline gap-2.5 no-underline">
              <span className="admin-brand">MIRZA</span>
              <span className="text-[#cfc4b6] text-xs">/</span>
              <span className="admin-brand-tag">Studio</span>
            </Link>

            <AdminTopNav basePath={basePath} />
          </div>

          <div className="flex items-center gap-5 text-xs">
            <span className="admin-mono text-[#706257] hidden md:inline text-[11px]">
              {adminIdentity.email || adminIdentity.userId}
            </span>
            <Link
              href={storefrontPath}
              className="admin-btn admin-btn-quiet text-[10px] tracking-wider uppercase py-1.5 px-3"
            >
              Exit to Storefront &rarr;
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
