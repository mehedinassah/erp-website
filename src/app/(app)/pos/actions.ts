"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { nextDocNumber, withUniqueRetry } from "@/lib/sequence";
import { getTenantProfile, computeTax } from "@/lib/tenant";
import { checkAndAlertLowStock } from "@/lib/low-stock-alert";
import { logAudit } from "@/lib/audit";

export type ScanHit = {
  found: true;
  variantId: string;
  productName: string;
  detail: string;
  sku: string;
  barcode: string | null;
  price: number;
  available: number;
};
export type ScanMiss = { found: false; error: string; code: string };
export type ScanResult = ScanHit | ScanMiss;

/** Resolve a scanned/typed code (barcode or SKU) to a variant + live stock. */
export async function lookupBarcode(
  code: string,
  warehouseId: string,
): Promise<ScanResult> {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;
  const c = code.trim();
  if (!c) return { found: false, error: "Empty code", code: c };

  const variant = await prisma.variant.findFirst({
    where: { OR: [{ barcode: c }, { sku: c }], product: { tenantId } },
    include: {
      product: true,
      stockLevels: { where: { warehouseId } },
    },
  });

  if (!variant)
    return { found: false, error: `No product matches “${c}”`, code: c };

  return {
    found: true,
    variantId: variant.id,
    productName: variant.product.name,
    detail: `${variant.size} · ${variant.color}`,
    sku: variant.sku,
    barcode: variant.barcode,
    price: variant.product.sellPrice,
    available: variant.stockLevels[0]?.quantity ?? 0,
  };
}

type PosItem = { variantId: string; quantity: number; price: number };

export async function posCheckout(input: {
  items: PosItem[];
  warehouseId: string;
  discount?: number;
}): Promise<{ ok: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  const session = await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const { tenantId } = session;

  const items = (input.items ?? []).filter(
    (i) => i.variantId && i.quantity > 0,
  );
  if (!input.warehouseId) return { ok: false, error: "No warehouse selected." };
  if (items.length === 0) return { ok: false, error: "Cart is empty." };

  const merged = new Map<string, PosItem>();
  for (const it of items) {
    const prev = merged.get(it.variantId);
    if (prev) prev.quantity += it.quantity;
    else merged.set(it.variantId, { ...it });
  }
  const lines = [...merged.values()];

  // Tenant guard: the warehouse and every variant must belong to this tenant.
  const warehouse = await prisma.warehouse.findFirst({ where: { id: input.warehouseId, tenantId }, select: { id: true } });
  if (!warehouse) return { ok: false, error: "Invalid warehouse." };
  const variantIds = lines.map((l) => l.variantId);
  const variantRows = await prisma.variant.findMany({
    where: { id: { in: variantIds }, product: { tenantId } },
    select: { id: true, size: true, color: true, product: { select: { name: true, sellPrice: true } } },
  });
  if (variantRows.length !== variantIds.length) return { ok: false, error: "One or more items are invalid." };
  const vmap = new Map(variantRows.map((v) => [v.id, v]));

  // Lines sold at a price other than the catalogue price — logged for traceability.
  const priceOverrides = lines
    .filter((l) => l.price !== vmap.get(l.variantId)!.product.sellPrice)
    .map((l) => ({ item: `${vmap.get(l.variantId)!.product.name} (${vmap.get(l.variantId)!.size}/${vmap.get(l.variantId)!.color})`, listPrice: vmap.get(l.variantId)!.product.sellPrice, soldAt: l.price }));

  const subtotal = lines.reduce((s, i) => s + i.quantity * i.price, 0);
  const discount = Math.max(0, Math.trunc(input.discount ?? 0));
  const taxable = Math.max(0, subtotal - discount);

  const tenant = await getTenantProfile(tenantId);
  const tax = computeTax(taxable, tenant?.taxRatePct ?? 0);
  const total = taxable + tax;
  const prefix = tenant?.invoicePrefix || "SO";

  try {
    const order = await withUniqueRetry(() =>
      prisma.$transaction(async (tx) => {
        const orderNumber = await nextDocNumber(tx, {
          model: "salesOrder",
          field: "orderNumber",
          tenantId,
          prefix,
        });

        const so = await tx.salesOrder.create({
          data: {
            orderNumber,
            status: "FULFILLED",
            paymentStatus: "PAID",
            amountPaid: total,
            warehouseId: input.warehouseId,
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
            where: { variantId: line.variantId, warehouseId: input.warehouseId, quantity: { gte: line.quantity } },
            data: { quantity: { decrement: line.quantity } },
          });
          if (res.count === 0) {
            const v = vmap.get(line.variantId)!;
            const lvl = await tx.stockLevel.findUnique({
              where: { variantId_warehouseId: { variantId: line.variantId, warehouseId: input.warehouseId } },
              select: { quantity: true },
            });
            throw new Error(`Not enough stock for ${v.product.name} (${v.size}/${v.color}): ${lvl?.quantity ?? 0} left.`);
          }
          await tx.stockMovement.create({
            data: {
              variantId: line.variantId,
              warehouseId: input.warehouseId,
              type: "SALE_OUT",
              quantity: -line.quantity,
              reason: `POS sale ${so.orderNumber}`,
              referenceType: "SALES_ORDER",
              referenceId: so.id,
              userId: session.userId,
            },
          });
        }
        return so;
      }),
    );

    checkAndAlertLowStock(tenantId);
    await logAudit({
      tenantId,
      userId: session.userId,
      action: "CREATE",
      entity: "SalesOrder",
      entityId: order.id,
      entityRef: order.orderNumber,
      changes: { total, itemCount: lines.length, paymentStatus: "PAID", ...(priceOverrides.length ? { priceOverrides } : {}) },
    });
    revalidatePath("/sales");
    revalidatePath("/stock");
    revalidatePath("/");
    return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Checkout failed.",
    };
  }
}
