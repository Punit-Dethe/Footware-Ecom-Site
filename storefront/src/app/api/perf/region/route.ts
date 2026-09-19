import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Reading request headers forces per-request execution on the serverless compute instance
  const _ua = request.headers.get("user-agent");

  if (process.env.PERF_DIAGNOSTICS !== "1") {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json({
    vercelRegion: process.env.VERCEL_REGION || "local",
    colocatedWithDb: process.env.VERCEL_REGION === "bom1",
  });
}
