"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, getSession } from "@/lib/auth";

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
  await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const c = code.trim();
  if (!c) return { found: false, error: "Empty code", code: c };

  const variant = await prisma.variant.findFirst({
    where: { OR: [{ barcode: c }, { sku: c }] },
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
  await requireRole(["ADMIN", "MANAGER", "STAFF"]);
  const session = await getSession();

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

  const subtotal = lines.reduce((s, i) => s + i.quantity * i.price, 0);
  const discount = Math.max(0, Math.trunc(input.discount ?? 0));
  const total = Math.max(0, subtotal - discount);

  const year = new Date().getFullYear();
  const count = await prisma.salesOrder.count();
  const orderNumber = `SO-${year}-${String(count + 1).padStart(4, "0")}`;

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const level = await tx.stockLevel.findUnique({
          where: {
            variantId_warehouseId: {
              variantId: line.variantId,
              warehouseId: input.warehouseId,
            },
          },
          include: { variant: { include: { product: true } } },
        });
        const available = level?.quantity ?? 0;
        if (available < line.quantity) {
          const name = level
            ? `${level.variant.product.name} (${level.variant.size}/${level.variant.color})`
            : "an item";
          throw new Error(`Not enough stock for ${name}: ${available} left.`);
        }
      }

      const so = await tx.salesOrder.create({
        data: {
          orderNumber,
          status: "FULFILLED",
          warehouseId: input.warehouseId,
          subtotal,
          discount,
          tax: 0,
          total,
          userId: session?.userId ?? null,
          items: {
            create: lines.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: i.price,
            })),
          },
        },
      });

      for (const line of lines) {
        await tx.stockLevel.update({
          where: {
            variantId_warehouseId: {
              variantId: line.variantId,
              warehouseId: input.warehouseId,
            },
          },
          data: { quantity: { decrement: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            variantId: line.variantId,
            warehouseId: input.warehouseId,
            type: "SALE_OUT",
            quantity: -line.quantity,
            reason: `POS sale ${orderNumber}`,
            referenceType: "SALES_ORDER",
            referenceId: so.id,
            userId: session?.userId ?? null,
          },
        });
      }
      return so;
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
