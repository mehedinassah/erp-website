"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth";
import { customerSchema, fieldErrorsFrom, type ActionState } from "@/lib/validation";

function parse(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? undefined,
    email: formData.get("email") ?? undefined,
    address: formData.get("address") ?? undefined,
  });
}

export async function createCustomer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;
  const parsed = parse(formData);
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  await prisma.customer.create({ data: { ...parsed.data, tenantId } });
  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;
  const parsed = parse(formData);
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  await prisma.customer.update({ where: { id, tenantId }, data: parsed.data });
  revalidatePath("/customers");
  redirect("/customers");
}

/** Admin only. Detaches the customer from their orders (kept as walk-in). */
export async function deleteCustomer(id: string) {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  // Verify ownership before deleting
  const owned = await prisma.customer.findFirst({ where: { id, tenantId }, select: { id: true } });
  if (!owned) return;
  await prisma.salesOrder.updateMany({
    where: { customerId: id, tenantId },
    data: { customerId: null },
  });
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
  redirect("/customers?deleted=1");
}
