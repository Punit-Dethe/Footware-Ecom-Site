import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

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

async function AdminIndexPageContent({ params }: AdminIndexProps) {
  await connection();
  const { country, locale } = await params;
  redirect(`/${country}/${locale}/admin/products`);
  return null;
}
