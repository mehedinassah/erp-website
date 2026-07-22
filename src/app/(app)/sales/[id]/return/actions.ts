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
    include: { items: true, salesReturns: { include: { items: true } } },
  });
  if (!order) return { error: "Sales order not found." };
  if (order.status !== "FULFILLED") return { error: "Only fulfilled orders can be returned." };

  // Original quantity sold per variant (summed, in case a variant appears on
  // more than one line) and the authoritative sold price.
  const sold = new Map<string, { qty: number; unitPrice: number }>();
  for (const it of order.items) {
    const prev = sold.get(it.variantId);
    if (prev) prev.qty += it.quantity;
    else sold.set(it.variantId, { qty: it.quantity, unitPrice: it.unitPrice });
  }
  // Quantity already returned per variant across every prior return on this
  // order, so cumulative returns can never exceed what was sold (over-refund).
  const alreadyReturned = new Map<string, number>();
  for (const r of order.salesReturns) {
    for (const it of r.items) {
      alreadyReturned.set(it.variantId, (alreadyReturned.get(it.variantId) ?? 0) + it.quantity);
    }
  }
  // Merge the incoming request by variant so the remaining-quantity check can't
  // be bypassed by splitting one variant across several lines.
  const requested = new Map<string, number>();
  for (const i of items) requested.set(i.variantId, (requested.get(i.variantId) ?? 0) + i.quantity);

  // Validate against the REMAINING returnable quantity, and pin each refund
  // line to the price the item was ACTUALLY sold at (never the client-supplied
  // unitPrice), so the refund total can't be inflated by tampering.
  const returnLines: { variantId: string; quantity: number; unitPrice: number }[] = [];
  for (const [variantId, qty] of requested) {
    const soItem = sold.get(variantId);
    if (!soItem) return { error: "Return item not found on original order." };
    const remaining = soItem.qty - (alreadyReturned.get(variantId) ?? 0);
    if (remaining <= 0) return { error: "This item has already been fully returned." };
    if (qty > remaining) {
      return { error: `Cannot return more than the remaining ${remaining} unit(s) for an item.` };
    }
    returnLines.push({ variantId, quantity: qty, unitPrice: soItem.unitPrice });
  }

  const totalAmount = returnLines.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
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
            create: returnLines.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
      });

      // Restore stock for each returned item
      for (const item of returnLines) {
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
