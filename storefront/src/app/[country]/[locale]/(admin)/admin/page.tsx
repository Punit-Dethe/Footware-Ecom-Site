import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/admin";

interface AdminIndexProps {
  params: Promise<{ country: string; locale: string }>;
}

export default function AdminIndexPage(props: AdminIndexProps) {
  return (
    <Suspense fallback={null}>
      <AdminIndexPageContent {...props} />
    </Suspense>
  );
}

export async function AdminIndexPageContent({ params }: AdminIndexProps) {
  await connection();
  await requireAdmin();
  const { country, locale } = await params;
  redirect(`/${country}/${locale}/admin/products`);
  return null;
}
