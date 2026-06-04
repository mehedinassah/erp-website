"use server";

import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type ResetState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function resetPassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "This reset link is invalid. Request a new one." };
  const fieldErrors: Record<string, string> = {};
  if (password.length < 8) fieldErrors.password = "Must be at least 8 characters.";
  if (password !== confirm) fieldErrors.confirmPassword = "Passwords do not match.";
  if (Object.keys(fieldErrors).length) return { error: "Please fix the highlighted fields.", fieldErrors };

  const user = await prisma.user.findFirst({
    where: { resetTokenHash: sha256(token), resetTokenExpiry: { gt: new Date() } },
    select: { id: true },
  });
  if (!user) return { error: "This reset link is invalid or has expired. Request a new one." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiry: null },
  });

  return { ok: true };
}
