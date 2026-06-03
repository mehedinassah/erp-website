"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { LedgerType } from "@/lib/enums";

// Per-section "clear" actions — admin only. Each wipes just that section's
// data (FK-safe), as an alternative to the global Settings → Danger Zone.

export async function clearProducts() {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  await prisma.$transaction(async (tx) => {
    // Orders depend on products, so clearing the catalogue clears them too.
    await tx.sOItem.deleteMany({ where: { salesOrder: { tenantId } } });
    await tx.salesOrder.deleteMany({ where: { tenantId } });
    await tx.pOItem.deleteMany({ where: { purchaseOrder: { tenantId } } });
    await tx.purchaseOrder.deleteMany({ where: { tenantId } });
    await tx.stockMovement.deleteMany({ where: { warehouse: { tenantId } } });
    await tx.stockLevel.deleteMany({ where: { variant: { product: { tenantId } } } });
    await tx.variant.deleteMany({ where: { product: { tenantId } } });
    await tx.product.deleteMany({ where: { tenantId } });
  });
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products?cleared=1");
}

export async function clearStock() {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({ where: { warehouse: { tenantId } } });
    await tx.stockLevel.updateMany({ where: { variant: { product: { tenantId } } }, data: { quantity: 0 } });
  });
  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/stock?cleared=1");
}

export async function clearPurchaseOrders() {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  await prisma.$transaction(async (tx) => {
    await tx.pOItem.deleteMany({ where: { purchaseOrder: { tenantId } } });
    await tx.purchaseOrder.deleteMany({ where: { tenantId } });
    await tx.stockMovement.deleteMany({
      where: { referenceType: "PURCHASE_ORDER", warehouse: { tenantId } },
    });
  });
  revalidatePath("/purchases");
  redirect("/purchases?cleared=1");
}

export async function clearSuppliers() {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.deleteMany({ where: { tenantId } }); // cascades PO items
    await tx.supplier.deleteMany({ where: { tenantId } });
  });
  revalidatePath("/suppliers");
  revalidatePath("/purchases");
  redirect("/suppliers?cleared=1");
}

export async function clearSalesOrders() {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  await prisma.$transaction(async (tx) => {
    await tx.sOItem.deleteMany({ where: { salesOrder: { tenantId } } });
    await tx.salesOrder.deleteMany({ where: { tenantId } });
    await tx.stockMovement.deleteMany({
      where: { referenceType: "SALES_ORDER", warehouse: { tenantId } },
    });
  });
  revalidatePath("/sales");
  revalidatePath("/");
  redirect("/sales?cleared=1");
}

export async function clearCustomers() {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  await prisma.$transaction(async (tx) => {
    await tx.salesOrder.updateMany({ where: { tenantId }, data: { customerId: null } });
    await tx.customer.deleteMany({ where: { tenantId } });
  });
  revalidatePath("/customers");
  redirect("/customers?cleared=1");
}

export async function clearLedger(type: LedgerType) {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  await prisma.ledgerAccount.deleteMany({ where: { type, tenantId } }); // cascades entries
  revalidatePath("/ledger");
  revalidatePath(type === "PAONA" ? "/ledger/paona" : "/ledger/dena");
  redirect(type === "PAONA" ? "/ledger/paona?cleared=1" : "/ledger/dena?cleared=1");
}
