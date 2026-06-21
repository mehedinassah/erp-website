"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { logAudit } from "@/lib/audit";
import { activatePayment } from "@/lib/billing";

/** Super-admin approves a pending payment → activates the tenant's plan. */
export async function approvePayment(paymentId: string) {
  const session = await requireSuperAdmin();

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PENDING") return;

  await activatePayment(paymentId);

  await logAudit({
    tenantId: payment.tenantId,
    userId: session.userId,
    action: "UPDATE",
    entity: "Payment",
    entityId: paymentId,
    entityRef: `${payment.plan} approved`,
    changes: { status: "PAID", months: payment.periodMonths },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/billing");
}

/** Super-admin rejects a pending payment. */
export async function rejectPayment(paymentId: string) {
  const session = await requireSuperAdmin();
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PENDING") return;

  await prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });
  await logAudit({
    tenantId: payment.tenantId,
    userId: session.userId,
    action: "UPDATE",
    entity: "Payment",
    entityId: paymentId,
    entityRef: `${payment.plan} rejected`,
    changes: { status: "FAILED" },
  });
  revalidatePath("/admin/payments");
}
