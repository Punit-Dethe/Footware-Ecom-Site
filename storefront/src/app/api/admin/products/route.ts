import { NextResponse } from "next/server";
import { createProductAction } from "@/lib/actions/admin-catalog";

/**
 * JSON endpoint for creating a draft product from the admin dashboard.
 *
 * The dashboard calls this instead of invoking the Server Action directly:
 * a plain Route Handler response has no RSC/Flight re-render step, so any
 * failure comes back as a readable JSON error instead of the opaque
 * "An error occurred in the Server Components render" message.
 * Authorization is enforced inside createProductAction (requireAdmin).
 */
export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const result = await createProductAction(input as Parameters<typeof createProductAction>[0]);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error("[api/admin/products] Unexpected create failure:", err);
    return NextResponse.json(
      {
        success: false,
        error: `Unexpected server error: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 },
    );
  }
}
