"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { ActionState } from "@/lib/validation";

export async function applyStockTake(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;

  const warehouseId = String(formData.get("warehouseId") ?? "");
  if (!warehouseId) return { error: "No warehouse selected." };

  const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId } });
  if (!warehouse) return { error: "Warehouse not found." };

  let items: { variantId: string; counted: number }[] = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Invalid count data." };
  }
  items = items
    .map((i) => ({ variantId: String(i.variantId), counted: Math.max(0, Math.trunc(Number(i.counted))) }))
    .filter((i) => i.variantId && Number.isFinite(i.counted));

  let adjusted = 0;
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const level = await tx.stockLevel.findUnique({
          where: { variantId_warehouseId: { variantId: item.variantId, warehouseId } },
        });
        const system = level?.quantity ?? 0;
        const delta = item.counted - system;
        if (delta === 0) continue;

        await tx.stockLevel.upsert({
          where: { variantId_warehouseId: { variantId: item.variantId, warehouseId } },
          update: { quantity: item.counted },
          create: { variantId: item.variantId, warehouseId, quantity: item.counted },
        });
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            warehouseId,
            type: "ADJUSTMENT",
            quantity: delta,
            reason: `Stock take adjustment (counted ${item.counted}, was ${system})`,
            referenceType: "STOCKTAKE",
            userId: session.userId,
          },
        });
        adjusted++;
      }
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not apply the stock take." };
  }

  await logAudit({
    tenantId,
    userId: session.userId,
    action: "UPDATE",
    entity: "StockTake",
    entityId: warehouseId,
    entityRef: warehouse.name,
    changes: { adjustedVariants: adjusted },
  });

  revalidatePath("/stock");
  revalidatePath("/");
  redirect(`/stock?recorded=1`);
}
