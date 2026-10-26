import { NextResponse } from "next/server";
import { saveProductAction } from "@/lib/actions/admin-catalog";

/**
 * JSON endpoint for saving an existing product from the admin dashboard.
 *
 * See ../route.ts: avoids the Server Action Flight response path so save
 * failures are reported with a real message. Authorization is enforced
 * inside saveProductAction (requireAdmin).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const result = await saveProductAction(id, input as Parameters<typeof saveProductAction>[1]);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error("[api/admin/products/:id] Unexpected save failure:", err);
    return NextResponse.json(
      {
        success: false,
        error: `Unexpected server error: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 },
    );
  }
}
