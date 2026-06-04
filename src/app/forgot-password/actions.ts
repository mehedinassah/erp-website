"use server";

import { randomBytes, createHash } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendEmail, resetEmailHtml, emailConfigured } from "@/lib/email";

export type ForgotState = { ok?: boolean; error?: string };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };

  if (!emailConfigured()) {
    return { error: "Email isn't set up yet. Please contact your administrator to reset your password." };
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, active: true } });

  // Only actually send if the account exists & is active — but always report success
  // so we never reveal which emails are registered.
  if (user && user.active) {
    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: sha256(token), resetTokenExpiry: expiry },
    });
    const link = `${await baseUrl()}/reset-password?token=${token}`;
    try {
      await sendEmail({
        to: email,
        subject: "Reset your PERICO password",
        html: resetEmailHtml(user.name, link),
      });
    } catch {
      return { error: "Could not send the email right now. Please try again shortly." };
    }
  }

  return { ok: true };
}
