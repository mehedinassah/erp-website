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
  await requireRole(["ADMIN", "MANAGER"]);
  const parsed = parse(formData);
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  await prisma.supplier.create({ data: parsed.data });
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "MANAGER"]);
  const parsed = parse(formData);
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  await prisma.supplier.update({ where: { id }, data: parsed.data });
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(id: string) {
  await requireRole(["ADMIN", "MANAGER"]);
  const count = await prisma.purchaseOrder.count({ where: { supplierId: id } });
  if (count > 0) {
    // Keep referential history; don't hard-delete suppliers with POs.
    return;
  }
  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/suppliers");
}
