import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";

export async function POST(_req: NextRequest) {
  return NextResponse.redirect(new URL("/billing?failed=1", SITE_URL), 303);
}
