import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminCategories } from "@/lib/db/admin-catalog";
import { CategoryManager } from "@/components/admin/CategoryManager";

interface AdminCategoriesPageProps {
  params: Promise<{ country: string; locale: string }>;
}

export default async function AdminCategoriesPage({
  params,
}: AdminCategoriesPageProps) {
  await connection();
  await requireAdmin();
  await params;
  const categories = await listAdminCategories();

  return <CategoryManager categories={categories} />;
}
