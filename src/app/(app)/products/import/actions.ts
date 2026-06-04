"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { slugify } from "@/lib/validation";

export type ImportRow = {
  productName?: string;
  category?: string;
  size?: string;
  color?: string;
  costPrice?: string | number;
  sellPrice?: string | number;
  sku?: string;
  barcode?: string;
  openingStock?: string | number;
};

export type ImportResult = {
  ok: boolean;
  error?: string;
  created?: { products: number; variants: number; units: number };
  warnings?: string[];
};

const num = (v: unknown, fallback = 0) => {
  const n = Math.round(Number(String(v ?? "").replace(/[^0-9.-]/g, "")));
  return Number.isFinite(n) ? n : fallback;
};
const txt = (v: unknown) => String(v ?? "").trim();

export async function importProducts(
  rows: ImportRow[],
  warehouseId: string,
): Promise<ImportResult> {
  const { tenantId } = await requireRole(["ADMIN", "MANAGER"]);

  if (!warehouseId) return { ok: false, error: "Choose a warehouse for the opening stock." };
  const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId }, select: { id: true } });
  if (!warehouse) return { ok: false, error: "That warehouse was not found." };
  if (!rows?.length) return { ok: false, error: "No rows to import." };

  const warnings: string[] = [];

  // Normalise + validate rows
  type Clean = { productName: string; category: string; size: string; color: string; cost: number; sell: number; sku: string; barcode: string; stock: number };
  const clean: Clean[] = [];
  rows.forEach((r, i) => {
    const productName = txt(r.productName);
    if (!productName) {
      if (Object.values(r).some((v) => txt(v))) warnings.push(`Row ${i + 2}: skipped — no product name.`);
      return;
    }
    clean.push({
      productName,
      category: txt(r.category) || "General",
      size: txt(r.size) || "One Size",
      color: txt(r.color) || "Default",
      cost: num(r.costPrice, 0),
      sell: num(r.sellPrice, 0),
      sku: txt(r.sku),
      barcode: txt(r.barcode),
      stock: Math.max(0, num(r.openingStock, 0)),
    });
  });
  if (!clean.length) return { ok: false, error: "No valid rows found. Make sure 'Product Name' is filled.", warnings };

  // ── Categories: ensure each referenced category exists ──
  const catNames = [...new Set(clean.map((c) => c.category))];
  const existingCats = await prisma.category.findMany({ where: { tenantId, name: { in: catNames } } });
  const catId = new Map(existingCats.map((c) => [c.name, c.id]));
  const newCats = catNames.filter((n) => !catId.has(n));
  for (const name of newCats) {
    const id = randomUUID();
    catId.set(name, id);
  }
  const catCreateData = newCats.map((name) => ({ id: catId.get(name)!, name, slug: slugify(name) + "-" + randomUUID().slice(0, 4), tenantId }));

  // ── Barcodes: drop any that already exist globally or duplicate within the file ──
  const providedBarcodes = clean.map((c) => c.barcode).filter(Boolean);
  const takenBarcodes = new Set(
    (await prisma.variant.findMany({ where: { barcode: { in: providedBarcodes } }, select: { barcode: true } }))
      .map((v) => v.barcode!)
      .filter(Boolean),
  );
  const seenBarcode = new Set<string>();

  // ── Group rows into products ──
  const productGroups = new Map<string, Clean[]>();
  for (const c of clean) {
    const key = c.productName.toLowerCase();
    const arr = productGroups.get(key);
    if (arr) arr.push(c);
    else productGroups.set(key, [c]);
  }

  const productsData: { id: string; name: string; slug: string; sku: string; categoryId: string; costPrice: number; sellPrice: number; gender: string; status: string; tenantId: string }[] = [];
  const variantsData: { id: string; productId: string; sku: string; barcode: string | null; size: string; color: string }[] = [];
  const stockData: { id: string; variantId: string; warehouseId: string; quantity: number }[] = [];
  const movementData: { id: string; type: string; quantity: number; reason: string; variantId: string; warehouseId: string; userId: string }[] = [];

  const session = await requireRole(["ADMIN", "MANAGER"]);
  let variantCount = 0;
  let unitCount = 0;

  for (const group of productGroups.values()) {
    const head = group[0];
    const productId = randomUUID();
    const base = slugify(head.productName) || "product";
    productsData.push({
      id: productId,
      name: head.productName,
      slug: `${base}-${randomUUID().slice(0, 6)}`,
      sku: `${base.slice(0, 8).toUpperCase()}-${randomUUID().slice(0, 5).toUpperCase()}`,
      categoryId: catId.get(head.category)!,
      costPrice: head.cost,
      sellPrice: head.sell,
      gender: "UNISEX",
      status: "ACTIVE",
      tenantId,
    });

    const seenVariantKey = new Set<string>();
    group.forEach((row, idx) => {
      const vKey = `${row.size}__${row.color}`.toLowerCase();
      if (seenVariantKey.has(vKey)) return; // dedupe identical size/color in same product
      seenVariantKey.add(vKey);

      let barcode: string | null = row.barcode || null;
      if (barcode && (takenBarcodes.has(barcode) || seenBarcode.has(barcode))) {
        warnings.push(`Barcode "${barcode}" already in use — imported "${row.productName}" without it.`);
        barcode = null;
      }
      if (barcode) seenBarcode.add(barcode);

      const variantId = randomUUID();
      const vSku = row.sku || `${base.slice(0, 6).toUpperCase()}-${idx + 1}-${randomUUID().slice(0, 4).toUpperCase()}`;
      variantsData.push({ id: variantId, productId, sku: vSku, barcode, size: row.size, color: row.color });
      variantCount++;

      stockData.push({ id: randomUUID(), variantId, warehouseId, quantity: row.stock });
      if (row.stock > 0) {
        unitCount += row.stock;
        movementData.push({
          id: randomUUID(),
          type: "ADJUSTMENT",
          quantity: row.stock,
          reason: "Initial import",
          variantId,
          warehouseId,
          userId: session.userId,
        });
      }
    });
  }

  try {
    await prisma.$transaction([
      ...(catCreateData.length ? [prisma.category.createMany({ data: catCreateData })] : []),
      prisma.product.createMany({ data: productsData }),
      prisma.variant.createMany({ data: variantsData }),
      prisma.stockLevel.createMany({ data: stockData }),
      ...(movementData.length ? [prisma.stockMovement.createMany({ data: movementData })] : []),
    ]);
  } catch (e) {
    return { ok: false, error: "Import failed while saving. " + (e instanceof Error ? e.message : ""), warnings };
  }

  revalidatePath("/products");
  revalidatePath("/stock");
  return {
    ok: true,
    created: { products: productsData.length, variants: variantCount, units: unitCount },
    warnings,
  };
}
