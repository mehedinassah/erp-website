import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// TARGETED reseed — RONG tenant only. Unlike prisma/seed.ts (which wipes the
// ENTIRE multi-tenant database), this touches a single tenant: it removes that
// tenant's sales orders (the phantom, item-less ones left behind by the old
// product-delete behaviour) and regenerates fresh FULFILLED orders WITH line
// items from the tenant's existing catalogue — so the dashboard's revenue,
// units, margin, categories and best-sellers all agree again.
//
// Every other tenant and all user logins are left completely untouched.
//
//   npx tsx prisma/reseed-sales.ts

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TENANT_SLUG = "rong";
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[], i: number): T => arr[i % arr.length];

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: TENANT_SLUG }, select: { id: true, name: true } });
  if (!tenant) throw new Error(`Tenant with slug "${TENANT_SLUG}" not found.`);
  const tenantId = tenant.id;
  console.log(`Reseeding sales for tenant: ${tenant.name} (${tenantId})`);

  // Catalogue to sell from — active variants with their product pricing.
  const variants = await prisma.variant.findMany({
    where: { product: { tenantId, status: "ACTIVE" } },
    select: { id: true, product: { select: { sellPrice: true } } },
  });
  if (variants.length === 0) throw new Error("No active variants to sell — add products first.");

  const warehouse =
    (await prisma.warehouse.findFirst({ where: { tenantId, isDefault: true }, select: { id: true } })) ??
    (await prisma.warehouse.findFirst({ where: { tenantId }, select: { id: true } }));
  if (!warehouse) throw new Error("No warehouse for this tenant.");

  const customers = await prisma.customer.findMany({ where: { tenantId }, select: { id: true } });
  const admin = await prisma.user.findFirst({ where: { tenantId, role: "ADMIN" }, select: { id: true } });

  // Remove this tenant's existing sales orders + their SALE_OUT movements.
  // Sales returns reference the orders (FK), so clear them first; deleteMany on
  // SalesOrder then cascades its SOItem rows.
  await prisma.salesReturnItem.deleteMany({ where: { salesReturn: { tenantId } } });
  const delReturns = await prisma.salesReturn.deleteMany({ where: { tenantId } });
  const delMoves = await prisma.stockMovement.deleteMany({
    where: { referenceType: "SALES_ORDER", warehouse: { tenantId } },
  });
  const delOrders = await prisma.salesOrder.deleteMany({ where: { tenantId } });
  console.log(`Cleared ${delOrders.count} old sales order(s), ${delReturns.count} return(s) and ${delMoves.count} sale movement(s).`);

  // Generate fresh orders across the last ~45 days so the trend chart is full.
  let orderNo = 0;
  let createdItems = 0;
  for (let d = 45; d >= 0; d--) {
    const ordersToday = rand(0, 3);
    for (let k = 0; k < ordersToday; k++) {
      orderNo++;
      const itemCount = rand(1, 4);
      const items: { variantId: string; quantity: number; unitPrice: number }[] = [];
      let subtotal = 0;
      const used = new Set<string>();
      for (let j = 0; j < itemCount; j++) {
        let v = variants[rand(0, variants.length - 1)];
        let guard = 0;
        while (used.has(v.id) && guard++ < 10) v = variants[rand(0, variants.length - 1)];
        used.add(v.id);
        const qty = rand(1, 3);
        subtotal += qty * v.product.sellPrice;
        items.push({ variantId: v.id, quantity: qty, unitPrice: v.product.sellPrice });
      }
      const discount = Math.random() < 0.3 ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal - discount;
      const orderDate = new Date(Date.now() - d * 86400000 + rand(0, 80000000));
      await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-2026-${String(orderNo).padStart(4, "0")}`,
          status: "FULFILLED",
          paymentStatus: "PAID",
          amountPaid: total,
          orderDate,
          subtotal,
          discount,
          tax: 0,
          total,
          customerId: customers.length ? pick(customers, orderNo).id : null,
          warehouseId: warehouse.id,
          userId: admin?.id ?? null,
          tenantId,
          items: { create: items },
        },
      });
      createdItems += items.length;
    }
  }
  console.log(`Created ${orderNo} fulfilled sales orders with ${createdItems} line items across 45 days.`);
  console.log("Dashboard revenue, units, margin, categories and best-sellers are now consistent.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
