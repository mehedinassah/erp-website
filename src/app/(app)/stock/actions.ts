"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { MOVEMENT_TYPES, type MovementType } from "@/lib/enums";
import type { ActionState } from "@/lib/validation";

export async function recordMovement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);

  const variantId = String(formData.get("variantId") ?? "");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const type = String(formData.get("type") ?? "") as MovementType;
  const qtyRaw = Number(formData.get("quantity"));
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!variantId || !warehouseId)
    return { error: "Select a variant and a warehouse." };
  if (!MOVEMENT_TYPES.includes(type))
    return { error: "Choose a movement type." };
  if (!Number.isFinite(qtyRaw) || qtyRaw === 0)
    return { error: "Enter a non-zero quantity." };

  // Resolve signed delta
  const magnitude = Math.abs(Math.trunc(qtyRaw));
  let delta: number;
  if (type === "SALE_OUT" || type === "TRANSFER_OUT") delta = -magnitude;
  else if (type === "ADJUSTMENT") delta = Math.trunc(qtyRaw); // signed
  else delta = magnitude; // PURCHASE_IN / TRANSFER_IN

  try {
    await prisma.$transaction(async (tx) => {
      const level = await tx.stockLevel.findUnique({
        where: { variantId_warehouseId: { variantId, warehouseId } },
      });
      const currentQty = level?.quantity ?? 0;
      const nextQty = currentQty + delta;
      if (nextQty < 0) {
        throw new Error(
          `Insufficient stock: only ${currentQty} available at this warehouse.`,
        );
      }

      if (level) {
        await tx.stockLevel.update({
          where: { id: level.id },
          data: { quantity: nextQty },
        });
      } else {
        await tx.stockLevel.create({
          data: { variantId, warehouseId, quantity: nextQty },
        });
      }

      await tx.stockMovement.create({
        data: {
          variantId,
          warehouseId,
          type,
          quantity: delta,
          reason,
          referenceType: "MANUAL",
          userId: session.userId,
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not record the movement." };
  }

  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/stock?recorded=1");
}
