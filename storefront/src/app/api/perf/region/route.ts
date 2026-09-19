import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Reading request headers forces per-request execution on the serverless compute instance
  const _ua = request.headers.get("user-agent");
  return NextResponse.json({
    vercelRegion: process.env.VERCEL_REGION || "local",
    nodeEnv: process.env.NODE_ENV,
    colocatedWithDb: process.env.VERCEL_REGION === "bom1",
  });
}
