"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

const PLANS = ["TRIAL", "STARTER", "BUSINESS", "PRO"];

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
