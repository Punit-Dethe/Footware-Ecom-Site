import { connection } from "next/server";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { listMediaLibraryAssets } from "@/lib/db/media-v1";
import { MediaLibraryClient } from "@/components/admin/media/MediaLibraryClient";

interface AdminMediaPageProps {
  params: Promise<{ country: string; locale: string }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    page?: string;
  }>;
}

export default function AdminMediaPage(props: AdminMediaPageProps) {
  return (
    <Suspense fallback={<MediaLibrarySkeleton />}>
      <AdminMediaPageContent {...props} />
    </Suspense>
  );
}

export async function AdminMediaPageContent({
  params,
  searchParams,
}: AdminMediaPageProps) {
  await connection();
  await requireAdmin();

  const { country, locale } = await params;
  const queryParams = await searchParams;

  const q = queryParams.q?.trim() || "";
  const sort = (queryParams.sort?.trim() || "created_desc") as
    | "created_desc"
    | "created_asc"
    | "size_desc"
    | "size_asc";

  const page = Math.max(1, parseInt(queryParams.page || "1", 10) || 1);
  const limit = 24;
  const offset = (page - 1) * limit;

  const result = await listMediaLibraryAssets({
    query: q || undefined,
    sort,
    limit,
    offset,
  });

  return (
    <MediaLibraryClient
      initialAssets={result.items}
      totalCount={result.totalCount}
      page={page}
      limit={limit}
      searchParamsState={{
        q,
        sort,
      }}
      country={country}
      locale={locale}
    />
  );
}

function MediaLibrarySkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="border-b border-[#cfc4b6] pb-6">
        <div className="h-3 w-28 bg-[#e9e2d6] rounded-[1px] mb-2" />
        <div className="h-9 w-64 bg-[#e9e2d6] rounded-[1px] mb-2" />
        <div className="h-4 w-96 bg-[#e9e2d6] rounded-[1px]" />
      </div>

      <div className="h-14 bg-[#fffefc] border border-[#cfc4b6] rounded-[2px]" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-[#ece7de] border border-[#d8d0c5] rounded-[2px]"
          />
        ))}
      </div>
    </div>
  );
}
