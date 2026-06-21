"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { ActionState } from "@/lib/validation";

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

  const taxRatePct = Math.min(100, Math.max(0, Math.trunc(Number(formData.get("taxRatePct")) || 0)));
  const invoicePrefix =
    String(formData.get("invoicePrefix") ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "SO";
  const taxLabel = String(formData.get("taxLabel") ?? "").trim() || "VAT";

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name,
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
