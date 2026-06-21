"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function transferStock(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;

  const fromWarehouseId = String(formData.get("fromWarehouseId") ?? "");
  const toWarehouseId = String(formData.get("toWarehouseId") ?? "");
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Math.trunc(Number(formData.get("quantity") ?? 0));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!fromWarehouseId || !toWarehouseId || !variantId)
    return { error: "All fields are required." };
  if (fromWarehouseId === toWarehouseId)
    return { error: "Source and destination warehouses must be different." };
  if (quantity <= 0) return { error: "Quantity must be at least 1." };

  // Verify both warehouses belong to this tenant
  const [fromWH, toWH] = await Promise.all([
    prisma.warehouse.findFirst({ where: { id: fromWarehouseId, tenantId } }),
    prisma.warehouse.findFirst({ where: { id: toWarehouseId, tenantId } }),
  ]);
  if (!fromWH || !toWH) return { error: "Warehouse not found." };

  // Check available stock
  const fromLevel = await prisma.stockLevel.findUnique({
    where: { variantId_warehouseId: { variantId, warehouseId: fromWarehouseId } },
    include: { variant: { include: { product: true } } },
  });
  const available = fromLevel?.quantity ?? 0;
  if (available < quantity) {
    return {
      error: `Not enough stock in ${fromWH.name}: ${available} available, ${quantity} requested.`,
    };
  }

  const ref = `XFER-${Date.now()}`;

  try {
    await prisma.$transaction(async (tx) => {
      // Deduct from source
      await tx.stockLevel.update({
        where: { variantId_warehouseId: { variantId, warehouseId: fromWarehouseId } },
        data: { quantity: { decrement: quantity } },
      });
      await tx.stockMovement.create({
        data: {
          variantId,
          warehouseId: fromWarehouseId,
          type: "TRANSFER_OUT",
          quantity: -quantity,
          reason: notes ?? `Transfer to ${toWH.name}`,
          referenceType: "TRANSFER",
          referenceId: ref,
          userId: session.userId,
        },
      });

      // Add to destination
      await tx.stockLevel.upsert({
        where: { variantId_warehouseId: { variantId, warehouseId: toWarehouseId } },
        update: { quantity: { increment: quantity } },
        create: { variantId, warehouseId: toWarehouseId, quantity },
      });
      await tx.stockMovement.create({
        data: {
          variantId,
          warehouseId: toWarehouseId,
          type: "TRANSFER_IN",
          quantity,
          reason: notes ?? `Transfer from ${fromWH.name}`,
          referenceType: "TRANSFER",
          referenceId: ref,
          userId: session.userId,
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Transfer failed." };
  }

  await logAudit({
    tenantId,
    userId: session.userId,
    action: "CREATE",
    entity: "StockTransfer",
    entityId: ref,
    entityRef: ref,
    changes: { from: fromWH.name, to: toWH.name, variantId, quantity },
  });

  revalidatePath("/stock");
  redirect("/stock?transferred=1");
}
