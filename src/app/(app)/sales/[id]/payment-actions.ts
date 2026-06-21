"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { ActionState } from "@/lib/validation";

export async function recordPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const orderId = String(formData.get("orderId") ?? "");
  const amount = Math.max(0, Math.trunc(Number(formData.get("amount") ?? 0)));

  if (!orderId) return { error: "Order not found." };
  if (amount <= 0) return { error: "Enter a payment amount greater than 0." };

  const order = await prisma.salesOrder.findFirst({
    where: { id: orderId, tenantId: session.tenantId },
    select: { id: true, total: true, amountPaid: true, orderNumber: true },
  });
  if (!order) return { error: "Order not found." };

  const newAmountPaid = Math.min(order.total, order.amountPaid + amount);
  const paymentStatus =
    newAmountPaid >= order.total
      ? "PAID"
      : newAmountPaid > 0
        ? "PARTIAL"
        : "UNPAID";

  await prisma.salesOrder.update({
    where: { id: orderId },
    data: { amountPaid: newAmountPaid, paymentStatus },
  });

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "UPDATE",
    entity: "SalesOrder",
    entityId: orderId,
    entityRef: order.orderNumber,
    changes: { paymentRecorded: amount, amountPaid: newAmountPaid, paymentStatus },
  });

  revalidatePath(`/sales/${orderId}`);
  revalidatePath("/sales");
  return { ok: true };
}
