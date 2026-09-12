import { NextResponse } from "next/server";
import { getDefaultCountry, getDefaultLocale } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = getDefaultCountry();
  const locale = getDefaultLocale();
  url.pathname = `/${country}/${locale}/admin`;
  return NextResponse.redirect(url);
}
