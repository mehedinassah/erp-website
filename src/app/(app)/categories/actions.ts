"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { STARTER_CATEGORIES, type BusinessType } from "@/lib/enums";
import {
  categorySchema,
  slugify,
  fieldErrorsFrom,
  type ActionState,
} from "@/lib/validation";

/** Bulk-add the suggested starter categories for the tenant's business type. */
export async function addStarterCategories() {
  const { tenantId } = await requireRole(["ADMIN", "MANAGER"]);
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { businessType: true },
  });
  const names = STARTER_CATEGORIES[(tenant?.businessType as BusinessType) ?? "GENERAL"] ?? STARTER_CATEGORIES.GENERAL;

  const existing = await prisma.category.findMany({ where: { tenantId }, select: { slug: true } });
  const have = new Set(existing.map((c) => c.slug));

  const toCreate = names
    .map((name) => ({ name, slug: slugify(name), tenantId }))
    .filter((c) => !have.has(c.slug));

  if (toCreate.length) {
    await prisma.category.createMany({ data: toCreate });
  }
  revalidatePath("/categories");
  redirect("/categories?starter=1");
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { tenantId } = await requireRole(["ADMIN", "MANAGER"]);
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };

  const slug = slugify(parsed.data.name);
  const clash = await prisma.category.findFirst({
    where: { tenantId, OR: [{ name: parsed.data.name }, { slug }] },
    select: { id: true },
  });
  if (clash) return { error: "A category with that name already exists." };

  await prisma.category.create({ data: { name: parsed.data.name, slug, tenantId } });
  revalidatePath("/categories");
  redirect("/categories");
}

export async function updateCategory(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { tenantId } = await requireRole(["ADMIN", "MANAGER"]);
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success)
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };

  const slug = slugify(parsed.data.name);
  const clash = await prisma.category.findFirst({
    where: { tenantId, id: { not: id }, OR: [{ name: parsed.data.name }, { slug }] },
    select: { id: true },
  });
  if (clash) return { error: "Another category already uses that name." };

  await prisma.category.update({ where: { id, tenantId }, data: { name: parsed.data.name, slug } });
  revalidatePath("/categories");
  redirect("/categories");
}

/** Admin only. Blocked if the category still has products. */
export async function deleteCategory(id: string) {
  const { tenantId } = await requireRole(["ADMIN"]);
  const owned = await prisma.category.findFirst({
    where: { id, tenantId },
    select: { id: true, _count: { select: { products: true } } },
  });
  if (!owned) return;
  if (owned._count.products > 0) {
    redirect("/categories?error=in-use");
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
  redirect("/categories?deleted=1");
}
