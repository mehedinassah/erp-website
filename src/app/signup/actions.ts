"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type SignupState = {
  error?: string;
  success: boolean;
};

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Validation
  if (!businessName) return { success: false, error: "Business name is required." };
  if (!name) return { success: false, error: "Your name is required." };
  if (!email || !email.includes("@"))
    return { success: false, error: "Enter a valid email address." };
  if (password.length < 8)
    return { success: false, error: "Password must be at least 8 characters." };
  if (password !== confirmPassword)
    return { success: false, error: "Passwords do not match." };

  // Check email not already taken
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return { success: false, error: "That email is already registered. Sign in instead." };

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = slugify(businessName) + "-" + Date.now();

  try {
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          slug,
          plan: "TRIAL",
          status: "ACTIVE",
        },
      });

      await tx.user.create({
        data: {
          email,
          name,
          role: "ADMIN",
          tenantId: tenant.id,
          passwordHash,
        },
      });

      // Bootstrap so the new business can start immediately:
      // a default warehouse + a starter category (both editable/removable later).
      await tx.warehouse.create({
        data: {
          name: "Main Store",
          code: "MAIN",
          isDefault: true,
          tenantId: tenant.id,
        },
      });
      await tx.category.create({
        data: { name: "General", slug: "general", tenantId: tenant.id },
      });
    });
  } catch (e) {
    const msg = String(e);
    if (msg.includes("Unique") || msg.includes("constraint"))
      return { success: false, error: "That email is already in use." };
    return { success: false, error: "Could not create your account. Please try again." };
  }

  redirect("/login?registered=1");
}
