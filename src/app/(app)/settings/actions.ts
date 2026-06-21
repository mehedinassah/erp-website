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
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  await prisma.$transaction(async (tx) => {
    // Sales returns reference sales orders (FK) — clear them first
    await tx.salesReturnItem.deleteMany({ where: { salesReturn: { tenantId } } });
    await tx.salesReturn.deleteMany({ where: { tenantId } });
    await tx.sOItem.deleteMany({ where: { salesOrder: { tenantId } } });
    await tx.salesOrder.deleteMany({ where: { tenantId } });
    await tx.pOItem.deleteMany({ where: { purchaseOrder: { tenantId } } });
    await tx.purchaseOrder.deleteMany({ where: { tenantId } });
    await tx.stockMovement.deleteMany({ where: { warehouse: { tenantId } } });
    await tx.stockBatch.deleteMany({ where: { tenantId } });
    await tx.stockLevel.updateMany({ where: { variant: { product: { tenantId } } }, data: { quantity: 0 } });
  });
  revalidateAll();
  redirect("/settings?reset=tx");
}

/** Admin only. Wipes ALL business data (catalogue, parties, transactions) for a
 *  fresh start. Keeps login users and warehouses so you can keep working. */
export async function resetAllData() {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  await prisma.$transaction(async (tx) => {
    // Order matters — delete children/referencing rows before parents (FK safe)
    await tx.salesReturnItem.deleteMany({ where: { salesReturn: { tenantId } } });
    await tx.salesReturn.deleteMany({ where: { tenantId } });
    await tx.sOItem.deleteMany({ where: { salesOrder: { tenantId } } });
    await tx.salesOrder.deleteMany({ where: { tenantId } });
    await tx.quoteItem.deleteMany({ where: { quotation: { tenantId } } });
    await tx.quotation.deleteMany({ where: { tenantId } });
    await tx.pOItem.deleteMany({ where: { purchaseOrder: { tenantId } } });
    await tx.purchaseOrder.deleteMany({ where: { tenantId } });
    await tx.stockMovement.deleteMany({ where: { warehouse: { tenantId } } });
    await tx.stockBatch.deleteMany({ where: { tenantId } });
    await tx.stockLevel.deleteMany({ where: { variant: { product: { tenantId } } } });
    await tx.variant.deleteMany({ where: { product: { tenantId } } });
    await tx.product.deleteMany({ where: { tenantId } });
    await tx.category.deleteMany({ where: { tenantId } });
    await tx.ledgerEntry.deleteMany({ where: { ledger: { tenantId } } });
    await tx.ledgerAccount.deleteMany({ where: { tenantId } });
    await tx.expense.deleteMany({ where: { tenantId } });
    await tx.supplier.deleteMany({ where: { tenantId } });
    await tx.customer.deleteMany({ where: { tenantId } });
  });
  revalidateAll();
  redirect("/settings?reset=all");
}
