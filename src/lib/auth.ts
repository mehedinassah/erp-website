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

/** Use in protected layouts/pages. Redirects to /login when unauthenticated. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Gate a page/action to specific roles. Redirects to dashboard if not allowed. */
export async function requireRole(
  roles: Role[],
): Promise<SessionPayload> {
  const session = await requireUser();
  if (!roles.includes(session.role as Role)) redirect("/?denied=1");
  return session;
}

export async function createSession(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}) {
  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
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

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      passwordHash: true,
      tenantId: true,
    },
  });
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

/** True if the role can perform write/management actions. */
export function canManage(role: string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
