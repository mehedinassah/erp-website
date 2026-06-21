"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole, getSession } from "@/lib/auth";
import { checkUserLimit } from "@/lib/limits";
import { ROLES } from "@/lib/enums";
import type { ActionState } from "@/lib/validation";

function clean(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

export async function createUser(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const adminSession = await requireRole(["ADMIN"]);
  const { tenantId } = adminSession;

  const name = clean(fd, "name");
  const email = clean(fd, "email").toLowerCase();
  const role = clean(fd, "role");
  const password = String(fd.get("password") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Enter a name";
  if (!email.includes("@") || email.length < 5) fieldErrors.email = "Enter a valid email";
  if (!ROLES.includes(role as never)) fieldErrors.role = "Choose a role";
  if (password.length < 6) fieldErrors.password = "Min 6 characters";
  if (Object.keys(fieldErrors).length)
    return { error: "Please fix the highlighted fields.", fieldErrors };

  const limitErr = await checkUserLimit(tenantId);
  if (limitErr) return { error: limitErr };

  try {
    await prisma.user.create({
      data: { name, email, role, tenantId, passwordHash: await bcrypt.hash(password, 10) },
    });
  } catch (e) {
    if (String(e).includes("Unique") || String(e).includes("constraint"))
      return { error: "That email is already in use.", fieldErrors: { email: "Already in use" } };
    return { error: "Could not create the user." };
  }

  revalidatePath("/settings/users");
  return { ok: true };
}

export async function updateUser(
  id: string,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;

  const name = clean(fd, "name");
  const role = clean(fd, "role");
  const active = fd.get("active") === "on";
  const password = String(fd.get("password") ?? "");

  if (name.length < 2) return { error: "Enter a name.", fieldErrors: { name: "Enter a name" } };
  if (!ROLES.includes(role as never)) return { error: "Choose a valid role." };
  if (password && password.length < 6)
    return { error: "New password must be at least 6 characters.", fieldErrors: { password: "Min 6 characters" } };

  const target = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!target) return { error: "User not found." };

  // Don't allow removing the last active admin (lockout protection)
  const wouldLoseAdmin =
    target.role === "ADMIN" && target.active && (role !== "ADMIN" || !active);
  if (wouldLoseAdmin) {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", active: true, tenantId },
    });
    if (activeAdmins <= 1)
      return { error: "You must keep at least one active administrator." };
  }
  // Don't let an admin deactivate their own account
  if (id === session.userId && !active)
    return { error: "You cannot deactivate your own account." };

  await prisma.user.update({
    where: { id },
    data: {
      name,
      role,
      active,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  revalidatePath("/settings/users");
  return { ok: true };
}

export async function deleteUser(id: string) {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  if (id === session.userId) return; // can't delete yourself

  const target = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!target) return;

  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN", tenantId } });
    if (admins <= 1) return; // keep at least one admin
  }

  // Optional relations (movements, orders, ledger entries) are set to null.
  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings/users");
  redirect("/settings/users?deleted=1");
}
