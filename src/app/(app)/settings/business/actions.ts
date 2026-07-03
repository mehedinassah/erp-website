"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { BUSINESS_TYPES, STARTER_CATEGORIES, type BusinessType } from "@/lib/enums";
import { slugify, type ActionState } from "@/lib/validation";

const str = (fd: FormData, key: string) => {
  const v = String(fd.get(key) ?? "").trim();
  return v || null;
};

export async function updateBusinessProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { error: "Business name is required.", fieldErrors: { name: "Required" } };
  }

  const businessTypeRaw = String(formData.get("businessType") ?? "CLOTHING");
  const businessType = (BUSINESS_TYPES as readonly string[]).includes(businessTypeRaw)
    ? businessTypeRaw
    : "CLOTHING";
  const taxRatePct = Math.min(100, Math.max(0, Math.trunc(Number(formData.get("taxRatePct")) || 0)));
  const invoicePrefix =
    String(formData.get("invoicePrefix") ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "SO";
  const taxLabel = String(formData.get("taxLabel") ?? "").trim() || "VAT";

  const before = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { businessType: true },
  });
  const typeChanged = before?.businessType !== businessType;

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name,
        businessType,
        legalName: str(formData, "legalName"),
        email: str(formData, "email"),
        phone: str(formData, "phone"),
        address: str(formData, "address"),
        logoUrl: str(formData, "logoUrl"),
        invoicePrefix,
        taxRatePct,
        taxLabel,
        invoiceFooter: str(formData, "invoiceFooter"),
      },
    });
  } catch {
    return { error: "Could not save your business profile. Please try again." };
  }

  // When the vertical changes, add the new type's starter categories that are
  // missing (never removes existing ones — safe, non-destructive).
  if (typeChanged) {
    try {
      const starters = STARTER_CATEGORIES[businessType as BusinessType] ?? STARTER_CATEGORIES.GENERAL;
      const existing = await prisma.category.findMany({ where: { tenantId }, select: { slug: true } });
      const have = new Set(existing.map((c) => c.slug));
      const toCreate = starters
        .map((catName) => ({ name: catName, slug: slugify(catName), tenantId }))
        .filter((c) => !have.has(c.slug));
      if (toCreate.length) await prisma.category.createMany({ data: toCreate });
    } catch {
      // Non-critical — the profile already saved; categories can be added manually.
    }
  }

  await logAudit({
    tenantId,
    userId: session.userId,
    action: "UPDATE",
    entity: "Tenant",
    entityId: tenantId,
    entityRef: name,
    changes: { taxRatePct, invoicePrefix },
  });

  revalidatePath("/settings/business");
  return { ok: true };
}
