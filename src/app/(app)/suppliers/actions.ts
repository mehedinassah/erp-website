"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { supplierSchema, fieldErrorsFrom, type ActionState } from "@/lib/validation";

function parse(formData: FormData) {
  return supplierSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName") ?? undefined,
    phone: formData.get("phone") ?? undefined,
    email: formData.get("email") ?? undefined,
    address: formData.get("address") ?? undefined,
  });
}

export async function createSupplier(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;
  const parsed = parse(formData);
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  await prisma.supplier.create({ data: { ...parsed.data, tenantId } });
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;
  const parsed = parse(formData);
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  await prisma.supplier.update({ where: { id, tenantId }, data: parsed.data });
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

/** Admin only. Permanently deletes a supplier and its purchase orders. */
export async function deleteSupplier(id: string) {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  const owned = await prisma.supplier.findFirst({ where: { id, tenantId }, select: { id: true } });
  if (!owned) return;
  await prisma.$transaction(async (tx) => {
    // Cascades purchase-order items
    await tx.purchaseOrder.deleteMany({ where: { supplierId: id, tenantId } });
    await tx.supplier.delete({ where: { id } });
  });
  revalidatePath("/suppliers");
  redirect("/suppliers?deleted=1");
}
