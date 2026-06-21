import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

// --------------------------------------------------------------------------
// Simple in-memory rate limiter (per edge instance).
// Works across typical serverless deployments for brute-force protection.
// --------------------------------------------------------------------------
type RateEntry = { count: number; resetAt: number };
const _rl = new Map<string, RateEntry>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = _rl.get(key);
  if (!entry || entry.resetAt < now) {
    _rl.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  return false;
}

function rateLimitedResponse(retryAfterSec: number) {
  return new NextResponse(
    JSON.stringify({ error: "Too many requests. Please wait before trying again." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": "Too many requests",
      },
    },
  );
}

// Next.js 16 renamed the "middleware" convention to "proxy".
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const path = req.nextUrl.pathname;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // --- Rate limiting for auth endpoints ---
  if (req.method === "POST") {
    if (path.startsWith("/login")) {
      // 15 attempts per IP per 10 minutes
      if (isRateLimited(`login:${ip}`, 15, 10 * 60 * 1000)) {
        return rateLimitedResponse(600);
      }
    } else if (path.startsWith("/signup")) {
      // 5 signups per IP per hour
      if (isRateLimited(`signup:${ip}`, 5, 60 * 60 * 1000)) {
        return rateLimitedResponse(3600);
      }
    } else if (path.startsWith("/forgot-password")) {
      // 3 reset requests per IP per 15 minutes
      if (isRateLimited(`forgot:${ip}`, 3, 15 * 60 * 1000)) {
        return rateLimitedResponse(900);
      }
    }
  }
  // Public routes that don't require a session.
  const isPublicRoute =
    path === "/" || // marketing landing page
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/contact") ||
    path.startsWith("/privacy") ||
    path.startsWith("/terms") ||
    // Metadata image routes (file conventions) — must be reachable by crawlers
    path.startsWith("/opengraph-image") ||
    path.startsWith("/twitter-image");

  // Entry routes a signed-in user should be bounced away from (login/signup).
  // Password reset is intentionally NOT here — a logged-in user must still be
  // able to open a reset link (e.g. on a shared device or to change accounts).
  const isAuthEntryRoute = path.startsWith("/login") || path.startsWith("/signup");

  if (!session && !isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in → keep them out of login/signup only.
  if (session && isAuthEntryRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
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
