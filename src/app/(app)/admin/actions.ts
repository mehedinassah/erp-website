"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { slugify, type ActionState } from "@/lib/validation";

const PLANS = ["TRIAL", "STARTER", "BUSINESS", "PRO"];

/**
 * Provision a brand-new business + its admin login directly from the panel
 * (white-glove onboarding — no public signup needed). Mirrors the signup
 * bootstrap: default warehouse + starter category.
 */
export async function createTenant(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();

  const businessName = String(formData.get("businessName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const plan = String(formData.get("plan") ?? "TRIAL");

  const fieldErrors: Record<string, string> = {};
  if (businessName.length < 2) fieldErrors.businessName = "Business name is required.";
  if (name.length < 2) fieldErrors.name = "Admin's name is required.";
  if (!email.includes("@")) fieldErrors.email = "Enter a valid email.";
  if (password.length < 8) fieldErrors.password = "Password must be at least 8 characters.";
  if (Object.keys(fieldErrors).length)
    return { error: "Please fix the highlighted fields.", fieldErrors };
  if (!PLANS.includes(plan)) return { error: "Invalid plan." };

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing)
    return { error: "That email is already registered.", fieldErrors: { email: "Already in use." } };

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = slugify(businessName) + "-" + Date.now();

  try {
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: businessName, slug, plan, status: "ACTIVE" },
      });
      await tx.user.create({
        data: { email, name, role: "ADMIN", tenantId: tenant.id, passwordHash },
      });
      await tx.warehouse.create({
        data: { name: "Main Store", code: "MAIN", isDefault: true, tenantId: tenant.id },
      });
      await tx.category.create({
        data: { name: "General", slug: "general", tenantId: tenant.id },
      });
    });
  } catch {
    return { error: "Could not create the business. Please try again." };
  }

  revalidatePath("/admin");
  return { ok: true };
}

/** Suspend ↔ activate a business (controls whether its users can log in). */
export async function toggleTenantStatus(id: string) {
  await requireSuperAdmin();
  const t = await prisma.tenant.findUnique({ where: { id }, select: { status: true } });
  if (!t) return;
  await prisma.tenant.update({
    where: { id },
    data: { status: t.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" },
  });
  revalidatePath("/admin");
}

/** Change a business's subscription plan. */
export async function setTenantPlan(id: string, plan: string) {
  await requireSuperAdmin();
  if (!PLANS.includes(plan)) return;
  await prisma.tenant.update({ where: { id }, data: { plan } });
  revalidatePath("/admin");
}
