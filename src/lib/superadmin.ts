import { redirect } from "next/navigation";
import { getSession } from "./auth";

/**
 * Platform super-admin = the SaaS owner who can see/manage ALL businesses.
 * Identity is controlled by the SUPER_ADMIN_EMAILS env var (comma-separated),
 * NOT by the per-tenant role system — so no business signup can ever grant it.
 *
 *   SUPER_ADMIN_EMAILS="owner@example.com,partner@example.com"
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Gate a page/action to the platform owner. Redirects away if not. */
export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || !isSuperAdmin(session.email)) redirect("/dashboard");
  return session;
}
