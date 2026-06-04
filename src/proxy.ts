import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

// Next.js 16 renamed the "middleware" convention to "proxy".
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const path = req.nextUrl.pathname;
  // Public routes that don't require a session.
  const isPublicRoute =
    path.startsWith("/login") || path.startsWith("/signup");

  if (!session && !isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in → keep them out of login/signup.
  if (session && isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
