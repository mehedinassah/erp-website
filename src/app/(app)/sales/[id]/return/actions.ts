"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { nextDocNumber, withUniqueRetry } from "@/lib/sequence";
import type { ActionState } from "@/lib/validation";

export async function createSalesReturn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;

  const salesOrderId = String(formData.get("salesOrderId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  let items: { soItemId: string; variantId: string; quantity: number; unitPrice: number }[] = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Invalid return items." };
  }
  items = items.filter((i) => i.quantity > 0);
  if (items.length === 0) return { error: "Select at least one item to return." };

  const order = await prisma.salesOrder.findFirst({
    where: { id: salesOrderId, tenantId },
    include: { items: true },
  });
  if (!order) return { error: "Sales order not found." };
  if (order.status !== "FULFILLED") return { error: "Only fulfilled orders can be returned." };

  // Validate quantities don't exceed original
  for (const retItem of items) {
    const soItem = order.items.find((i) => i.variantId === retItem.variantId);
    if (!soItem) return { error: "Return item not found on original order." };
    if (retItem.quantity > soItem.quantity) {
      return { error: `Cannot return more than the original quantity sold.` };
    }
  }

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  let returnNumber = "";

  try {
    await withUniqueRetry(() =>
      prisma.$transaction(async (tx) => {
      returnNumber = await nextDocNumber(tx, {
        model: "salesReturn",
        field: "returnNumber",
        tenantId,
        prefix: "RET",
      });
      const ret = await tx.salesReturn.create({
        data: {
          returnNumber,
          reason,
          notes,
          totalAmount,
          tenantId,
          salesOrderId,
          warehouseId: order.warehouseId,
          userId: session.userId,
          items: {
            create: items.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
      });

      // Restore stock for each returned item
      for (const item of items) {
        await tx.stockLevel.upsert({
          where: {
            variantId_warehouseId: {
              variantId: item.variantId,
              warehouseId: order.warehouseId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            variantId: item.variantId,
            warehouseId: order.warehouseId,
            quantity: item.quantity,
          },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            warehouseId: order.warehouseId,
            type: "RETURN_IN",
            quantity: item.quantity,
            reason: `Return ${returnNumber} from ${order.orderNumber}`,
            referenceType: "RETURN",
            referenceId: ret.id,
            userId: session.userId,
          },
        });
      }

      // Adjust payment status if refund reduces balance
      const newAmountPaid = Math.max(0, order.amountPaid - totalAmount);
      const paymentStatus =
        newAmountPaid >= order.total
          ? "PAID"
          : newAmountPaid > 0
            ? "PARTIAL"
            : "UNPAID";
      await tx.salesOrder.update({
        where: { id: order.id },
        data: { amountPaid: newAmountPaid, paymentStatus },
      });
      }),
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not process the return." };
  }

  await logAudit({
    tenantId,
    userId: session.userId,
    action: "CREATE",
    entity: "SalesReturn",
    entityId: salesOrderId,
    entityRef: returnNumber,
    changes: { returnNumber, totalAmount, itemCount: items.length },
  });

  revalidatePath(`/sales/${salesOrderId}`);
  revalidatePath("/sales");
  revalidatePath("/stock");
  redirect(`/sales/${salesOrderId}?returned=1`);
}
