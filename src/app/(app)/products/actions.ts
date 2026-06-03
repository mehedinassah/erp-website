"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth";
import { slugify, code } from "@/lib/utils";
import {
  productSchema,
  variantInputSchema,
  fieldErrorsFrom,
  type ActionState,
} from "@/lib/validation";

function parseBase(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    gender: formData.get("gender"),
    material: formData.get("material") ?? undefined,
    season: formData.get("season") ?? undefined,
    description: formData.get("description") ?? undefined,
    costPrice: formData.get("costPrice"),
    sellPrice: formData.get("sellPrice"),
    status: formData.get("status") ?? "ACTIVE",
  });
}

export async function createProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;

  const parsed = parseBase(formData);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const data = parsed.data;

  // Variants come as a JSON array built by the client form
  let variants: { size: string; color: string; colorHex?: string | null }[] = [];
  try {
    const raw = JSON.parse(String(formData.get("variants") ?? "[]"));
    variants = raw
      .map((v: unknown) => variantInputSchema.parse(v))
      .filter(Boolean);
  } catch {
    variants = [];
  }
  if (variants.length === 0) {
    return { error: "Add at least one variant (pick sizes and colours)." };
  }

  const warehouses = await prisma.warehouse.findMany({ where: { tenantId }, select: { id: true } });

  let productId = "";
  try {
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: data.name,
          slug: slugify(data.name) + "-" + Date.now().toString(36).slice(-4),
          sku: data.sku.toUpperCase(),
          categoryId: data.categoryId,
          gender: data.gender,
          material: data.material,
          season: data.season,
          description: data.description,
          costPrice: data.costPrice,
          sellPrice: data.sellPrice,
          status: data.status,
          tenantId,
        },
      });

      for (const v of variants) {
        const variant = await tx.variant.create({
          data: {
            productId: p.id,
            sku: `${data.sku.toUpperCase()}-${code(v.size)}-${code(v.color)}`,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex ?? null,
          },
        });
        // Initialise zero stock in every warehouse
        await tx.stockLevel.createMany({
          data: warehouses.map((w) => ({
            variantId: variant.id,
            warehouseId: w.id,
            quantity: 0,
          })),
        });
      }
      return p;
    });
    productId = product.id;
  } catch (e) {
    const msg = String(e);
    if (msg.includes("Unique") || msg.includes("constraint"))
      return { error: "That SKU or a variant SKU already exists. Use a unique base SKU." };
    return { error: "Could not create the product. Please try again." };
  }

  revalidatePath("/products");
  redirect(`/products/${productId}`);
}

export async function updateProduct(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;

  const parsed = parseBase(formData);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const data = parsed.data;

  try {
    await prisma.product.update({
      where: { id, tenantId },
      data: {
        name: data.name,
        sku: data.sku.toUpperCase(),
        categoryId: data.categoryId,
        gender: data.gender,
        material: data.material,
        season: data.season,
        description: data.description,
        costPrice: data.costPrice,
        sellPrice: data.sellPrice,
        status: data.status,
      },
    });
  } catch {
    return { error: "Could not save changes. The SKU may already be in use." };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function archiveProduct(id: string) {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;
  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  await prisma.product.update({
    where: { id },
    data: { status: product?.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED" },
  });
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
}

/** Admin only. Permanently deletes a product, its variants, stock, and any
 *  order lines that referenced it (so seeded/placeholder data can be cleared). */
export async function deleteProduct(id: string) {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  // Verify ownership
  const owned = await prisma.product.findFirst({ where: { id, tenantId }, select: { id: true } });
  if (!owned) return;

  const variants = await prisma.variant.findMany({
    where: { productId: id },
    select: { id: true },
  });
  const variantIds = variants.map((v) => v.id);

  await prisma.$transaction(async (tx) => {
    if (variantIds.length) {
      // Remove order lines referencing these variants (no cascade on those FKs)
      await tx.sOItem.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.pOItem.deleteMany({ where: { variantId: { in: variantIds } } });
    }
    // Cascades variants → stock levels & movements
    await tx.product.delete({ where: { id } });
  });

  revalidatePath("/products");
  redirect("/products?deleted=1");
}
