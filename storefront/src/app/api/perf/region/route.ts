import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    vercelRegion: process.env.VERCEL_REGION || "local",
    nodeEnv: process.env.NODE_ENV,
    colocatedWithDb: process.env.VERCEL_REGION === "bom1",
  });
}
