"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { checkAndAlertLowStock } from "@/lib/low-stock-alert";
import { logAudit } from "@/lib/audit";
import { nextDocNumber, withUniqueRetry } from "@/lib/sequence";
import { getTenantProfile, computeTax } from "@/lib/tenant";
import type { ActionState } from "@/lib/validation";

type LineItem = { variantId: string; quantity: number; price: number };

function parseItems(formData: FormData): LineItem[] {
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]"));
    return (raw as LineItem[])
      .map((r) => ({
        variantId: String(r.variantId),
        quantity: Math.trunc(Number(r.quantity)),
        price: Math.trunc(Number(r.price)),
      }))
      .filter((r) => r.variantId && r.quantity > 0 && r.price >= 0);
  } catch {
    return [];
  }
}

export async function createSalesOrder(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;

  const customerId = String(formData.get("partyId") ?? "") || null;
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const discount = Math.max(0, Math.trunc(Number(formData.get("discount")) || 0));
  const items = parseItems(formData);

  if (!warehouseId) return { error: "Choose a warehouse to fulfil from." };
  if (items.length === 0) return { error: "Add at least one line item." };
  const markPaid = formData.get("markPaid") === "on";

  // Merge duplicate variants so the stock check is accurate
  const merged = new Map<string, LineItem>();
  for (const it of items) {
    const prev = merged.get(it.variantId);
    if (prev) prev.quantity += it.quantity;
    else merged.set(it.variantId, { ...it });
  }
  const lines = [...merged.values()];

  // Tenant guard: the warehouse and every variant must belong to this tenant.
  const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId }, select: { id: true } });
  if (!warehouse) return { error: "Invalid warehouse." };
  const variantIds = lines.map((l) => l.variantId);
  const variantRows = await prisma.variant.findMany({
    where: { id: { in: variantIds }, product: { tenantId } },
    select: { id: true, size: true, color: true, product: { select: { name: true, sellPrice: true } } },
  });
  if (variantRows.length !== variantIds.length) return { error: "One or more items are invalid." };
  const vmap = new Map(variantRows.map((v) => [v.id, v]));

  // Lines sold at a price other than the catalogue price — logged for traceability.
  const priceOverrides = lines
    .filter((l) => l.price !== vmap.get(l.variantId)!.product.sellPrice)
    .map((l) => ({ item: `${vmap.get(l.variantId)!.product.name} (${vmap.get(l.variantId)!.size}/${vmap.get(l.variantId)!.color})`, listPrice: vmap.get(l.variantId)!.product.sellPrice, soldAt: l.price }));

  const subtotal = lines.reduce((s, i) => s + i.quantity * i.price, 0);
  const taxable = Math.max(0, subtotal - discount);

  const tenant = await getTenantProfile(tenantId);
  const tax = computeTax(taxable, tenant?.taxRatePct ?? 0);
  const total = taxable + tax;
  const prefix = tenant?.invoicePrefix || "SO";

  let id = "";
  let orderNumber = "";
  try {
    const order = await withUniqueRetry(() =>
      prisma.$transaction(async (tx) => {
        orderNumber = await nextDocNumber(tx, {
          model: "salesOrder",
          field: "orderNumber",
          tenantId,
          prefix,
        });

        const so = await tx.salesOrder.create({
          data: {
            orderNumber,
            status: "FULFILLED",
            paymentStatus: markPaid ? "PAID" : "UNPAID",
            amountPaid: markPaid ? total : 0,
            customerId,
            warehouseId,
            notes,
            subtotal,
            discount,
            tax,
            total,
            tenantId,
            userId: session.userId,
            items: {
              create: lines.map((i) => ({
                variantId: i.variantId,
                quantity: i.quantity,
                unitPrice: i.price,
              })),
            },
          },
        });

        // Atomic guarded decrement — prevents overselling under concurrency.
        for (const line of lines) {
          const res = await tx.stockLevel.updateMany({
            where: { variantId: line.variantId, warehouseId, quantity: { gte: line.quantity } },
            data: { quantity: { decrement: line.quantity } },
          });
          if (res.count === 0) {
            const v = vmap.get(line.variantId)!;
            const lvl = await tx.stockLevel.findUnique({
              where: { variantId_warehouseId: { variantId: line.variantId, warehouseId } },
              select: { quantity: true },
            });
            throw new Error(
              `Not enough stock for ${v.product.name} (${v.size}/${v.color}): ${lvl?.quantity ?? 0} available, ${line.quantity} requested.`,
            );
          }
          await tx.stockMovement.create({
            data: {
              variantId: line.variantId,
              warehouseId,
              type: "SALE_OUT",
              quantity: -line.quantity,
              reason: `Sold on ${orderNumber}`,
              referenceType: "SALES_ORDER",
              referenceId: so.id,
              userId: session.userId,
            },
          });
        }

        return so;
      }),
    );
    id = order.id;
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not complete the sale.",
    };
  }

  // Fire low-stock alert after stock deduction (fire-and-forget)
  checkAndAlertLowStock(session.tenantId);

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "CREATE",
    entity: "SalesOrder",
    entityId: id,
    entityRef: orderNumber,
    changes: { total, itemCount: lines.length, paymentStatus: markPaid ? "PAID" : "UNPAID", ...(priceOverrides.length ? { priceOverrides } : {}) },
  });

  revalidatePath("/sales");
  revalidatePath("/stock");
  revalidatePath("/");
  redirect(`/sales/${id}`);
}

/** Admin only. Deletes a sale and restores the sold stock to the warehouse. */
export async function deleteSalesOrder(id: string) {
  const session = await requireRole(["ADMIN"]);

  // Tenant guard: only delete an order that belongs to this tenant.
  const so = await prisma.salesOrder.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { items: true },
  });
  if (!so) redirect("/sales");

  await prisma.$transaction(async (tx) => {
    for (const it of so.items) {
      const level = await tx.stockLevel.findUnique({
        where: {
          variantId_warehouseId: {
            variantId: it.variantId,
            warehouseId: so.warehouseId,
          },
        },
      });
      if (level) {
        await tx.stockLevel.update({
          where: { id: level.id },
          data: { quantity: level.quantity + it.quantity },
        });
      } else {
        await tx.stockLevel.create({
          data: {
            variantId: it.variantId,
            warehouseId: so.warehouseId,
            quantity: it.quantity,
          },
        });
      }
    }
    await tx.stockMovement.deleteMany({
      where: { referenceType: "SALES_ORDER", referenceId: so.id },
    });
    await tx.salesOrder.delete({ where: { id: so.id } }); // cascades items
  });

  revalidatePath("/sales");
  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/sales?deleted=1");
}
