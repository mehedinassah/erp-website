"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { checkAndAlertLowStock } from "@/lib/low-stock-alert";
import { logAudit } from "@/lib/audit";
import type { ActionState } from "@/lib/validation";

type LineItem = { variantId: string; quantity: number; price: number };

function parseItems(formData: FormData): LineItem[] {
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]"));
    return (raw as LineItem[])
      .map((r) => ({
        variantId: String(r.variantId),
        quantity: Math.trunc(Number(r.quantity)),
        price: Math.trunc(Number(r.price)),
      }))
      .filter((r) => r.variantId && r.quantity > 0 && r.price >= 0);
  } catch {
    return [];
  }
}

async function nextOrderNumber(tenantId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.salesOrder.count({ where: { tenantId } });
  return `SO-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createSalesOrder(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;

  const customerId = String(formData.get("partyId") ?? "") || null;
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const discount = Math.max(0, Math.trunc(Number(formData.get("discount")) || 0));
  const items = parseItems(formData);

  if (!warehouseId) return { error: "Choose a warehouse to fulfil from." };
  if (items.length === 0) return { error: "Add at least one line item." };

  // Merge duplicate variants so the stock check is accurate
  const merged = new Map<string, LineItem>();
  for (const it of items) {
    const prev = merged.get(it.variantId);
    if (prev) prev.quantity += it.quantity;
    else merged.set(it.variantId, { ...it });
  }
  const lines = [...merged.values()];

  const subtotal = lines.reduce((s, i) => s + i.quantity * i.price, 0);
  const total = Math.max(0, subtotal - discount);
  const orderNumber = await nextOrderNumber(tenantId);

  let id = "";
  try {
    const order = await prisma.$transaction(async (tx) => {
      // Stock availability check + deduction
      for (const line of lines) {
        const level = await tx.stockLevel.findUnique({
          where: {
            variantId_warehouseId: { variantId: line.variantId, warehouseId },
          },
          include: { variant: { include: { product: true } } },
        });
        const available = level?.quantity ?? 0;
        if (available < line.quantity) {
          const name = level
            ? `${level.variant.product.name} (${level.variant.size}/${level.variant.color})`
            : "an item";
          throw new Error(
            `Not enough stock for ${name}: ${available} available, ${line.quantity} requested.`,
          );
        }
      }

      const so = await tx.salesOrder.create({
        data: {
          orderNumber,
          status: "FULFILLED",
          customerId,
          warehouseId,
          notes,
          subtotal,
          discount,
          tax: 0,
          total,
          tenantId,
          userId: session.userId,
          items: {
            create: lines.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: i.price,
            })),
          },
        },
      });

      for (const line of lines) {
        await tx.stockLevel.update({
          where: {
            variantId_warehouseId: { variantId: line.variantId, warehouseId },
          },
          data: { quantity: { decrement: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            variantId: line.variantId,
            warehouseId,
            type: "SALE_OUT",
            quantity: -line.quantity,
            reason: `Sold on ${orderNumber}`,
            referenceType: "SALES_ORDER",
            referenceId: so.id,
            userId: session.userId,
          },
        });
      }

      return so;
    });
    id = order.id;
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not complete the sale.",
    };
  }

  // Fire low-stock alert after stock deduction (fire-and-forget)
  checkAndAlertLowStock(session.tenantId);

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "CREATE",
    entity: "SalesOrder",
    entityId: id,
    entityRef: orderNumber,
    changes: { total, itemCount: lines.length },
  });

  revalidatePath("/sales");
  revalidatePath("/stock");
  revalidatePath("/");
  redirect(`/sales/${id}`);
}

/** Admin only. Deletes a sale and restores the sold stock to the warehouse. */
export async function deleteSalesOrder(id: string) {
  await requireRole(["ADMIN"]);

  const so = await prisma.salesOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!so) redirect("/sales");

  await prisma.$transaction(async (tx) => {
    for (const it of so.items) {
      const level = await tx.stockLevel.findUnique({
        where: {
          variantId_warehouseId: {
            variantId: it.variantId,
            warehouseId: so.warehouseId,
          },
        },
      });
      if (level) {
        await tx.stockLevel.update({
          where: { id: level.id },
          data: { quantity: level.quantity + it.quantity },
        });
      } else {
        await tx.stockLevel.create({
          data: {
            variantId: it.variantId,
            warehouseId: so.warehouseId,
            quantity: it.quantity,
          },
        });
      }
    }
    await tx.stockMovement.deleteMany({
      where: { referenceType: "SALES_ORDER", referenceId: so.id },
    });
    await tx.salesOrder.delete({ where: { id: so.id } }); // cascades items
  });

  revalidatePath("/sales");
  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/sales?deleted=1");
}
