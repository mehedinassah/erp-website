"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { LedgerType } from "@/lib/enums";

// Per-section "clear" actions — admin only. Each wipes just that section's
// data (FK-safe), as an alternative to the global Settings → Danger Zone.

export async function clearProducts() {
  await requireRole(["ADMIN"]);
  await prisma.$transaction(async (tx) => {
    // Orders depend on products, so clearing the catalogue clears them too.
    await tx.sOItem.deleteMany();
    await tx.salesOrder.deleteMany();
    await tx.pOItem.deleteMany();
    await tx.purchaseOrder.deleteMany();
    await tx.stockMovement.deleteMany();
    await tx.stockLevel.deleteMany();
    await tx.variant.deleteMany();
    await tx.product.deleteMany();
  });
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products?cleared=1");
}

export async function clearStock() {
  await requireRole(["ADMIN"]);
  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany();
    await tx.stockLevel.updateMany({ data: { quantity: 0 } });
  });
  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/stock?cleared=1");
}

export async function clearPurchaseOrders() {
  await requireRole(["ADMIN"]);
  await prisma.$transaction(async (tx) => {
    await tx.pOItem.deleteMany();
    await tx.purchaseOrder.deleteMany();
    await tx.stockMovement.deleteMany({
      where: { referenceType: "PURCHASE_ORDER" },
    });
  });
  revalidatePath("/purchases");
  redirect("/purchases?cleared=1");
}

export async function clearSuppliers() {
  await requireRole(["ADMIN"]);
  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.deleteMany(); // cascades PO items
    await tx.supplier.deleteMany();
  });
  revalidatePath("/suppliers");
  revalidatePath("/purchases");
  redirect("/suppliers?cleared=1");
}

export async function clearSalesOrders() {
  await requireRole(["ADMIN"]);
  await prisma.$transaction(async (tx) => {
    await tx.sOItem.deleteMany();
    await tx.salesOrder.deleteMany();
    await tx.stockMovement.deleteMany({
      where: { referenceType: "SALES_ORDER" },
    });
  });
  revalidatePath("/sales");
  revalidatePath("/");
  redirect("/sales?cleared=1");
}

export async function clearCustomers() {
  await requireRole(["ADMIN"]);
  await prisma.$transaction(async (tx) => {
    await tx.salesOrder.updateMany({ data: { customerId: null } });
    await tx.customer.deleteMany();
  });
  revalidatePath("/customers");
  redirect("/customers?cleared=1");
}

export async function clearLedger(type: LedgerType) {
  await requireRole(["ADMIN"]);
  await prisma.ledgerAccount.deleteMany({ where: { type } }); // cascades entries
  revalidatePath("/ledger");
  revalidatePath(type === "PAONA" ? "/ledger/paona" : "/ledger/dena");
  redirect(type === "PAONA" ? "/ledger/paona?cleared=1" : "/ledger/dena?cleared=1");
}
