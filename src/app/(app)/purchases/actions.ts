"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, getSession } from "@/lib/auth";
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

async function nextPoNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count();
  return `PO-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createPurchaseOrder(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "MANAGER"]);
  const session = await getSession();

  const supplierId = String(formData.get("partyId") ?? "");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const expected = String(formData.get("expectedDate") ?? "");
  const items = parseItems(formData);

  if (!supplierId) return { error: "Choose a supplier." };
  if (!warehouseId) return { error: "Choose a destination warehouse." };
  if (items.length === 0) return { error: "Add at least one line item." };

  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const poNumber = await nextPoNumber();

  let id = "";
  try {
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        status: "ORDERED",
        supplierId,
        warehouseId,
        notes,
        expectedDate: expected ? new Date(expected) : null,
        totalAmount: total,
        userId: session?.userId ?? null,
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
    id = po.id;
  } catch {
    return { error: "Could not create the purchase order." };
  }

  revalidatePath("/purchases");
  redirect(`/purchases/${id}`);
}

/** Receive all outstanding quantity: increments stock + logs movements. */
export async function receivePurchaseOrder(id: string) {
  await requireRole(["ADMIN", "MANAGER"]);
  const session = await getSession();

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
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
          userId: session?.userId ?? null,
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
  await requireRole(["ADMIN", "MANAGER"]);
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po || po.status === "RECEIVED") return;
  await prisma.purchaseOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/purchases");
  revalidatePath(`/purchases/${id}`);
}
