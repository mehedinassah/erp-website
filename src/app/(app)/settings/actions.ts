"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

function revalidateAll() {
  for (const p of [
    "/",
    "/products",
    "/stock",
    "/purchases",
    "/suppliers",
    "/sales",
    "/customers",
    "/settings",
  ])
    revalidatePath(p);
}

/** Admin only. Clears all sales, purchases and stock movements, and zeroes
 *  stock — but keeps the product catalogue, suppliers and customers. */
export async function resetTransactions() {
  await requireRole(["ADMIN"]);
  await prisma.$transaction(async (tx) => {
    await tx.sOItem.deleteMany();
    await tx.salesOrder.deleteMany();
    await tx.pOItem.deleteMany();
    await tx.purchaseOrder.deleteMany();
    await tx.stockMovement.deleteMany();
    await tx.stockLevel.updateMany({ data: { quantity: 0 } });
  });
  revalidateAll();
  redirect("/settings?reset=tx");
}

/** Admin only. Wipes ALL business data (catalogue, parties, transactions) for a
 *  fresh start. Keeps login users and warehouses so you can keep working. */
export async function resetAllData() {
  await requireRole(["ADMIN"]);
  await prisma.$transaction(async (tx) => {
    await tx.sOItem.deleteMany();
    await tx.salesOrder.deleteMany();
    await tx.pOItem.deleteMany();
    await tx.purchaseOrder.deleteMany();
    await tx.stockMovement.deleteMany();
    await tx.stockLevel.deleteMany();
    await tx.variant.deleteMany();
    await tx.product.deleteMany();
    await tx.category.deleteMany();
    await tx.supplier.deleteMany();
    await tx.customer.deleteMany();
  });
  revalidateAll();
  redirect("/settings?reset=all");
}
