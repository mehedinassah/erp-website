"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { ActionState } from "@/lib/validation";

export async function addBatch(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;

  const variantId = String(formData.get("variantId") ?? "");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const batchNumber = String(formData.get("batchNumber") ?? "").trim() || null;
  const expiryRaw = String(formData.get("expiryDate") ?? "").trim();
  const expiryDate = expiryRaw ? new Date(expiryRaw) : null;
  const quantity = Math.trunc(Number(formData.get("quantity") ?? 0));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!variantId || !warehouseId) return { error: "Select a product and a warehouse." };
  if (quantity <= 0) return { error: "Quantity must be at least 1." };

  // Verify variant + warehouse belong to this tenant
  const [variant, warehouse] = await Promise.all([
    prisma.variant.findFirst({ where: { id: variantId, product: { tenantId } }, include: { product: true } }),
    prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId } }),
  ]);
  if (!variant || !warehouse) return { error: "Product or warehouse not found." };

  try {
    await prisma.$transaction(async (tx) => {
      const batch = await tx.stockBatch.create({
        data: { tenantId, variantId, warehouseId, batchNumber, expiryDate, quantity, note },
      });
      // Receiving a batch also adds to live stock (keeps StockLevel consistent)
      await tx.stockLevel.upsert({
        where: { variantId_warehouseId: { variantId, warehouseId } },
        update: { quantity: { increment: quantity } },
        create: { variantId, warehouseId, quantity },
      });
      await tx.stockMovement.create({
        data: {
          variantId,
          warehouseId,
          type: "PURCHASE_IN",
          quantity,
          reason: batchNumber ? `Batch ${batchNumber} received` : "Batch received",
          referenceType: "BATCH",
          referenceId: batch.id,
          userId: session.userId,
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not record the batch." };
  }

  await logAudit({
    tenantId,
    userId: session.userId,
    action: "CREATE",
    entity: "StockBatch",
    entityId: variantId,
    entityRef: variant.product.name,
    changes: { batchNumber, expiryDate: expiryRaw, quantity },
  });

  revalidatePath("/stock/expiry");
  revalidatePath("/stock");
  return { ok: true };
}
