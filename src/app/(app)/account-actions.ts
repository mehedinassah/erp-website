"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { destroySession, requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/validation";

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

/** Any signed-in user can change their own password. */
export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (!current) fieldErrors.currentPassword = "Enter your current password.";
  if (next.length < 8) fieldErrors.newPassword = "Must be at least 8 characters.";
  if (next !== confirm) fieldErrors.confirmPassword = "Passwords do not match.";
  if (Object.keys(fieldErrors).length)
    return { error: "Please fix the highlighted fields.", fieldErrors };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Account not found." };

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok)
    return {
      error: "Your current password is incorrect.",
      fieldErrors: { currentPassword: "Incorrect password." },
    };

  const passwordHash = await bcrypt.hash(next, 10);
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      sessionVersion: { increment: 1 }, // invalidates all other active sessions
    },
  });
  return { ok: true };
}
