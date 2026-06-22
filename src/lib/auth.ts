import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import {
  signSession,
  verifySession,
  SESSION_COOKIE,
  type SessionPayload,
} from "./session";
import type { Role } from "./enums";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Use in protected layouts/pages. Redirects to /login when unauthenticated.
 *  Also validates sessionVersion against the DB to catch post-password-change sessions. */
export async function requireUser(): Promise<SessionPayload> {
  try {
    const session = await getSession();
    if (!session) redirect("/login");

    // Check that the session version matches the current DB version.
    // If the user changed their password since this JWT was issued, boot them out.
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { sessionVersion: true, active: true },
    });
    if (!user || !user.active || user.sessionVersion !== session.sessionVersion) {
      await destroySession();
      redirect("/login");
    }

    return session;
  } catch {
    await destroySession();
    redirect("/login");
  }
}

/** Gate a page/action to specific roles. Redirects to dashboard if not allowed. */
export async function requireRole(
  roles: Role[],
): Promise<SessionPayload> {
  const session = await requireUser();
  if (!roles.includes(session.role as Role)) redirect("/dashboard?denied=1");
  return session;
}

export async function createSession(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  sessionVersion: number;
}) {
  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    sessionVersion: user.sessionVersion,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

type AuthResult =
  | { ok: true; user: { id: string; email: string; name: string; role: string; tenantId: string; sessionVersion: number } }
  | { ok: false; reason: "invalid" | "suspended" };

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthResult> {
  let user;
  try {
    user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        passwordHash: true,
        tenantId: true,
        sessionVersion: true,
        tenant: { select: { status: true } },
      },
    });
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!user || !user.active) return { ok: false, reason: "invalid" };

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) return { ok: false, reason: "invalid" };

  // Suspension guard: a suspended business cannot sign in (pay-or-lose-access).
  // Exception: platform super-admins are never locked out — even if their own
  // tenant is suspended — so the owner can always reach the /admin panel.
  const superAdmins = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isSuper = superAdmins.includes(user.email.toLowerCase());
  if (!user.tenant || user.tenant.status === "SUSPENDED" && !isSuper)
    return { ok: false, reason: "suspended" };

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      sessionVersion: user.sessionVersion,
    },
  };
}

/** True if the role can perform write/management actions. */
export function canManage(role: string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
