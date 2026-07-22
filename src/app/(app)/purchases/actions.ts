"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { nextDocNumber, withUniqueRetry } from "@/lib/sequence";
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

export async function createPurchaseOrder(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;

  const supplierId = String(formData.get("partyId") ?? "");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const expected = String(formData.get("expectedDate") ?? "");
  const items = parseItems(formData);

  if (!supplierId) return { error: "Choose a supplier." };
  if (!warehouseId) return { error: "Choose a destination warehouse." };
  if (items.length === 0) return { error: "Add at least one line item." };

  // Tenant guards: supplier, warehouse and every variant must belong to this
  // tenant, so a PO can never reference another business's records.
  const [supplier, warehouse] = await Promise.all([
    prisma.supplier.findFirst({ where: { id: supplierId, tenantId }, select: { id: true } }),
    prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId }, select: { id: true } }),
  ]);
  if (!supplier) return { error: "Invalid supplier." };
  if (!warehouse) return { error: "Invalid warehouse." };
  const variantIds = [...new Set(items.map((i) => i.variantId))];
  const validVariants = await prisma.variant.count({ where: { id: { in: variantIds }, product: { tenantId } } });
  if (validVariants !== variantIds.length) return { error: "One or more items are invalid." };

  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

  let id = "";
  try {
    const po = await withUniqueRetry(() =>
      prisma.$transaction(async (tx) => {
        const poNumber = await nextDocNumber(tx, {
          model: "purchaseOrder",
          field: "poNumber",
          tenantId,
          prefix: "PO",
        });
        return tx.purchaseOrder.create({
          data: {
            poNumber,
            status: "ORDERED",
            supplierId,
            warehouseId,
            notes,
            expectedDate: expected ? new Date(expected) : null,
            totalAmount: total,
            tenantId,
            userId: session.userId,
            items: {
              create: items.map((i) => ({
                variantId: i.variantId,
                quantity: i.quantity,
                unitCost: i.price,
                receivedQty: 0,
              })),
            },
          },
        });
      }),
    );
    id = po.id;
  } catch {
    return { error: "Could not create the purchase order." };
  }

  revalidatePath("/purchases");
  redirect(`/purchases/${id}`);
}

/** Receive all outstanding quantity: increments stock + logs movements. */
export async function receivePurchaseOrder(id: string) {
  const session = await requireRole(["ADMIN", "MANAGER"]);

  // Tenant guard: only receive a PO that belongs to the caller's tenant.
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { items: true },
  });
  if (!po || po.status === "RECEIVED" || po.status === "CANCELLED") return;

  await prisma.$transaction(async (tx) => {
    for (const item of po.items) {
      const outstanding = item.quantity - item.receivedQty;
      if (outstanding <= 0) continue;

      const level = await tx.stockLevel.findUnique({
        where: {
          variantId_warehouseId: {
            variantId: item.variantId,
            warehouseId: po.warehouseId,
          },
        },
      });
      if (level) {
        await tx.stockLevel.update({
          where: { id: level.id },
          data: { quantity: level.quantity + outstanding },
        });
      } else {
        await tx.stockLevel.create({
          data: {
            variantId: item.variantId,
            warehouseId: po.warehouseId,
            quantity: outstanding,
          },
        });
      }

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          warehouseId: po.warehouseId,
          type: "PURCHASE_IN",
          quantity: outstanding,
          reason: `Received against ${po.poNumber}`,
          referenceType: "PURCHASE_ORDER",
          referenceId: po.id,
          userId: session.userId,
        },
      });

      await tx.pOItem.update({
        where: { id: item.id },
        data: { receivedQty: item.quantity },
      });
    }

    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: { status: "RECEIVED" },
    });
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${id}`);
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function cancelPurchaseOrder(id: string) {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  // Tenant guard: only cancel a PO that belongs to the caller's tenant.
  const po = await prisma.purchaseOrder.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!po || po.status === "RECEIVED") return;
  await prisma.purchaseOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/purchases");
  revalidatePath(`/purchases/${id}`);
}

/** Admin only. Deletes a PO; reverses any received stock first. */
export async function deletePurchaseOrder(id: string) {
  const session = await requireRole(["ADMIN"]);

  // Tenant guard: only delete a PO that belongs to the caller's tenant.
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { items: true },
  });
  if (!po) redirect("/purchases");

  await prisma.$transaction(async (tx) => {
    for (const it of po.items) {
      if (it.receivedQty > 0) {
        const level = await tx.stockLevel.findUnique({
          where: {
            variantId_warehouseId: {
              variantId: it.variantId,
              warehouseId: po.warehouseId,
            },
          },
        });
        if (level) {
          await tx.stockLevel.update({
            where: { id: level.id },
            data: { quantity: Math.max(0, level.quantity - it.receivedQty) },
          });
        }
      }
    }
    await tx.stockMovement.deleteMany({
      where: { referenceType: "PURCHASE_ORDER", referenceId: po.id },
    });
    await tx.purchaseOrder.delete({ where: { id: po.id } }); // cascades items
  });

  revalidatePath("/purchases");
  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/purchases?deleted=1");
}
