"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
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
  await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const parsed = parse(formData);
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  await prisma.customer.create({ data: parsed.data });
  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const parsed = parse(formData);
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  await prisma.customer.update({ where: { id }, data: parsed.data });
  revalidatePath("/customers");
  redirect("/customers");
}
