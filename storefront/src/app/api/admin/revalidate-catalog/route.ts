import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";

export async function POST(request: Request) {
  const adminSecret = request.headers.get("x-admin-secret");
  const expectedSecret = process.env.SUPABASE_SECRET_KEY;

  let authorized = Boolean(expectedSecret && adminSecret === expectedSecret);

  if (!authorized) {
    try {
      await requireAdmin();
      authorized = true;
    } catch {
      authorized = false;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    revalidateTag("catalog-public", "max");
    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      invalidated: "catalog-public",
      revalidated: "/",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to revalidate catalog" },
      { status: 500 },
    );
  }
}
