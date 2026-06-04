"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { warehouseSchema, fieldErrorsFrom, type ActionState } from "@/lib/validation";

function parse(formData: FormData) {
  return warehouseSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    address: formData.get("address") ?? undefined,
  });
}

export async function createWarehouse(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { tenantId } = await requireRole(["ADMIN", "MANAGER"]);
  const parsed = parse(formData);
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };

  const clash = await prisma.warehouse.findFirst({
    where: { tenantId, code: parsed.data.code },
    select: { id: true },
  });
  if (clash) return { error: "A warehouse with that code already exists." };

  const isFirst = (await prisma.warehouse.count({ where: { tenantId } })) === 0;
  await prisma.warehouse.create({
    data: { ...parsed.data, isDefault: isFirst, tenantId },
  });
  revalidatePath("/warehouses");
  redirect("/warehouses");
}

export async function updateWarehouse(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { tenantId } = await requireRole(["ADMIN", "MANAGER"]);
  const parsed = parse(formData);
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };

  const clash = await prisma.warehouse.findFirst({
    where: { tenantId, code: parsed.data.code, id: { not: id } },
    select: { id: true },
  });
  if (clash) return { error: "Another warehouse already uses that code." };

  await prisma.warehouse.update({ where: { id, tenantId }, data: parsed.data });
  revalidatePath("/warehouses");
  redirect("/warehouses");
}

/** Make a warehouse the default (only one default per tenant). */
export async function setDefaultWarehouse(id: string) {
  const { tenantId } = await requireRole(["ADMIN", "MANAGER"]);
  const owned = await prisma.warehouse.findFirst({ where: { id, tenantId }, select: { id: true } });
  if (!owned) return;
  await prisma.$transaction([
    prisma.warehouse.updateMany({ where: { tenantId }, data: { isDefault: false } }),
    prisma.warehouse.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/warehouses");
}

/** Admin only. Blocked if it holds stock or has any orders, or is the last one. */
export async function deleteWarehouse(id: string) {
  const { tenantId } = await requireRole(["ADMIN"]);
  const wh = await prisma.warehouse.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      _count: { select: { purchaseOrders: true, salesOrders: true, stockLevels: true } },
    },
  });
  if (!wh) return;

  const total = await prisma.warehouse.count({ where: { tenantId } });
  if (total <= 1) redirect("/warehouses?error=last");

  const hasStock = await prisma.stockLevel.count({
    where: { warehouseId: id, quantity: { gt: 0 } },
  });
  if (hasStock > 0 || wh._count.purchaseOrders > 0 || wh._count.salesOrders > 0) {
    redirect("/warehouses?error=in-use");
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockLevel.deleteMany({ where: { warehouseId: id } });
    await tx.warehouse.delete({ where: { id } });
  });
  revalidatePath("/warehouses");
  redirect("/warehouses?deleted=1");
}
