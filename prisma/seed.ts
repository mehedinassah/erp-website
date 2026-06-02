import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// ---- helpers ---------------------------------------------------------------
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
const pick = <T>(arr: T[], i: number) => arr[i % arr.length];
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const COLORS: { name: string; hex: string }[] = [
  { name: "Midnight", hex: "#1C1917" },
  { name: "Ivory", hex: "#F5F2EC" },
  { name: "Maroon", hex: "#7A1F2B" },
  { name: "Indigo", hex: "#2A3759" },
  { name: "Olive", hex: "#5B5B3A" },
  { name: "Rust", hex: "#A4583B" },
  { name: "Teal", hex: "#1F5F5B" },
  { name: "Gold", hex: "#A16207" },
  { name: "Blush", hex: "#D8A7A1" },
  { name: "Slate", hex: "#475569" },
];

type ProductSeed = {
  name: string;
  category: string;
  gender: string;
  material: string;
  season: string;
  cost: number;
  sell: number;
  sizes: string[];
  colors: string[];
};

const CATEGORIES = [
  "Panjabi",
  "Saree",
  "Kurti",
  "Salwar Kameez",
  "Shirt",
  "T-Shirt",
  "Trousers",
  "Kids",
];

const PRODUCTS: ProductSeed[] = [
  { name: "Hand-Block Cotton Panjabi", category: "Panjabi", gender: "MEN", material: "Cotton", season: "Eid", cost: 1100, sell: 2350, sizes: ["S", "M", "L", "XL", "XXL"], colors: ["Ivory", "Midnight", "Indigo"] },
  { name: "Embroidered Silk Panjabi", category: "Panjabi", gender: "MEN", material: "Silk", season: "Festive", cost: 2200, sell: 4800, sizes: ["M", "L", "XL"], colors: ["Maroon", "Midnight", "Gold"] },
  { name: "Jamdani Handloom Saree", category: "Saree", gender: "WOMEN", material: "Jamdani", season: "Festive", cost: 4200, sell: 9500, sizes: ["M"], colors: ["Maroon", "Teal", "Gold"] },
  { name: "Half-Silk Tangail Saree", category: "Saree", gender: "WOMEN", material: "Half Silk", season: "All", cost: 1800, sell: 3900, sizes: ["M"], colors: ["Indigo", "Rust", "Blush"] },
  { name: "Printed Cotton Kurti", category: "Kurti", gender: "WOMEN", material: "Cotton", season: "Summer", cost: 650, sell: 1450, sizes: ["XS", "S", "M", "L", "XL"], colors: ["Blush", "Olive", "Ivory"] },
  { name: "A-Line Linen Kurti", category: "Kurti", gender: "WOMEN", material: "Linen", season: "Summer", cost: 820, sell: 1850, sizes: ["S", "M", "L", "XL"], colors: ["Teal", "Rust", "Slate"] },
  { name: "Three-Piece Salwar Kameez", category: "Salwar Kameez", gender: "WOMEN", material: "Georgette", season: "Festive", cost: 1900, sell: 4200, sizes: ["S", "M", "L", "XL"], colors: ["Maroon", "Indigo", "Gold"] },
  { name: "Slim-Fit Formal Shirt", category: "Shirt", gender: "MEN", material: "Cotton", season: "All", cost: 700, sell: 1650, sizes: ["S", "M", "L", "XL", "XXL"], colors: ["Ivory", "Slate", "Indigo"] },
  { name: "Oxford Casual Shirt", category: "Shirt", gender: "MEN", material: "Oxford Cotton", season: "All", cost: 760, sell: 1750, sizes: ["M", "L", "XL"], colors: ["Olive", "Slate", "Ivory"] },
  { name: "Premium Cotton T-Shirt", category: "T-Shirt", gender: "UNISEX", material: "Combed Cotton", season: "Summer", cost: 320, sell: 790, sizes: ["S", "M", "L", "XL"], colors: ["Midnight", "Ivory", "Rust", "Teal"] },
  { name: "Graphic Oversized Tee", category: "T-Shirt", gender: "UNISEX", material: "Cotton", season: "Summer", cost: 360, sell: 890, sizes: ["M", "L", "XL"], colors: ["Midnight", "Olive"] },
  { name: "Tailored Chino Trousers", category: "Trousers", gender: "MEN", material: "Twill", season: "All", cost: 950, sell: 2100, sizes: ["S", "M", "L", "XL"], colors: ["Slate", "Olive", "Midnight"] },
  { name: "Kids Festive Panjabi Set", category: "Kids", gender: "KIDS", material: "Cotton", season: "Eid", cost: 700, sell: 1550, sizes: ["XS", "S", "M"], colors: ["Ivory", "Maroon", "Indigo"] },
  { name: "Kids Cotton Frock", category: "Kids", gender: "KIDS", material: "Cotton", season: "Summer", cost: 480, sell: 1100, sizes: ["XS", "S", "M"], colors: ["Blush", "Teal", "Gold"] },
];

const SUPPLIERS = [
  { name: "Tangail Weavers Co-op", contactName: "Rafiqul Islam", phone: "+8801711000111", email: "sales@tangailweavers.com.bd", address: "Tangail Sadar, Dhaka Division" },
  { name: "Narayanganj Textile Mills", contactName: "Shamima Akter", phone: "+8801712000222", email: "orders@ngtextile.com.bd", address: "BSCIC, Narayanganj" },
  { name: "Dhaka Fashion Imports", contactName: "Tanvir Hasan", phone: "+8801713000333", email: "tanvir@dfimports.com", address: "Islampur Road, Old Dhaka" },
  { name: "Bengal Silk House", contactName: "Nusrat Jahan", phone: "+8801714000444", email: "hello@bengalsilk.com.bd", address: "Rajshahi Silk Para" },
];

const CUSTOMERS = [
  { name: "Aarong Gulshan (Wholesale)", phone: "+8801811111111", email: "buy@aarongretail.com", address: "Gulshan 1, Dhaka" },
  { name: "Sadia Rahman", phone: "+8801822222222", email: "sadia.r@gmail.com", address: "Dhanmondi 27, Dhaka" },
  { name: "Imran Chowdhury", phone: "+8801833333333", email: "imran.c@gmail.com", address: "Bashundhara R/A, Dhaka" },
  { name: "Mehzabin Karim", phone: "+8801844444444", email: "mehzabin@gmail.com", address: "Uttara Sector 7, Dhaka" },
  { name: "Banani Boutique", phone: "+8801855555555", email: "store@bananiboutique.com", address: "Banani 11, Dhaka" },
  { name: "Farhana Yasmin", phone: "+8801866666666", email: "farhana.y@gmail.com", address: "Mirpur DOHS, Dhaka" },
  { name: "Walk-in Customer", phone: null, email: null, address: null },
];

async function main() {
  console.log("🌱 Seeding RONG Inventory...");

  // Clean slate (order matters for FKs)
  await prisma.sOItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.pOItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const passwordHash = await bcrypt.hash("password123", 10);
  const [admin] = await Promise.all([
    prisma.user.create({ data: { email: "admin@rong.com.bd", name: "Ayesha Siddiqua", role: "ADMIN", passwordHash } }),
    prisma.user.create({ data: { email: "manager@rong.com.bd", name: "Rezaul Karim", role: "MANAGER", passwordHash } }),
    prisma.user.create({ data: { email: "staff@rong.com.bd", name: "Tahmid Hasan", role: "STAFF", passwordHash } }),
  ]);
  console.log("✓ Users (admin/manager/staff) — password: password123");

  // Warehouses
  const flagship = await prisma.warehouse.create({
    data: { name: "Gulshan Flagship Store", code: "DHK-GUL", address: "Gulshan Avenue, Dhaka 1212", isDefault: true },
  });
  const warehouse = await prisma.warehouse.create({
    data: { name: "Tejgaon Central Warehouse", code: "DHK-TEJ", address: "Tejgaon I/A, Dhaka 1208" },
  });
  console.log("✓ Warehouses");

  // Categories
  const categoryMap = new Map<string, string>();
  for (const name of CATEGORIES) {
    const c = await prisma.category.create({ data: { name, slug: slugify(name) } });
    categoryMap.set(name, c.id);
  }
  console.log("✓ Categories");

  // Products + variants + stock
  let pIndex = 0;
  const allVariants: { id: string; sell: number; cost: number }[] = [];
  for (const ps of PRODUCTS) {
    pIndex++;
    const skuBase = `${slugify(ps.category).slice(0, 3).toUpperCase()}-${String(pIndex).padStart(3, "0")}`;
    const product = await prisma.product.create({
      data: {
        name: ps.name,
        slug: slugify(ps.name),
        sku: skuBase,
        description: `${ps.material} ${ps.name.toLowerCase()} — ${ps.season} collection. Crafted for RONG by local artisans.`,
        gender: ps.gender,
        season: ps.season,
        material: ps.material,
        costPrice: ps.cost,
        sellPrice: ps.sell,
        status: "ACTIVE",
        categoryId: categoryMap.get(ps.category)!,
      },
    });

    let vCount = 0;
    for (const size of ps.sizes) {
      for (const colorName of ps.colors) {
        vCount++;
        const color = COLORS.find((c) => c.name === colorName)!;
        const variant = await prisma.variant.create({
          data: {
            productId: product.id,
            sku: `${skuBase}-${size}-${color.name.slice(0, 3).toUpperCase()}`,
            barcode: `880${String(pIndex).padStart(4, "0")}${String(vCount).padStart(4, "0")}`,
            size,
            color: color.name,
            colorHex: color.hex,
            lowStockThreshold: 8,
          },
        });
        allVariants.push({ id: variant.id, sell: ps.sell, cost: ps.cost });

        // Initial stock split across two warehouses (some intentionally low)
        const flagshipQty = rand(2, 30);
        const warehouseQty = rand(0, 50);
        await prisma.stockLevel.create({ data: { variantId: variant.id, warehouseId: flagship.id, quantity: flagshipQty } });
        await prisma.stockLevel.create({ data: { variantId: variant.id, warehouseId: warehouse.id, quantity: warehouseQty } });
        await prisma.stockMovement.create({
          data: { variantId: variant.id, warehouseId: flagship.id, type: "PURCHASE_IN", quantity: flagshipQty, reason: "Opening stock", referenceType: "MANUAL", userId: admin.id },
        });
        await prisma.stockMovement.create({
          data: { variantId: variant.id, warehouseId: warehouse.id, type: "PURCHASE_IN", quantity: warehouseQty, reason: "Opening stock", referenceType: "MANUAL", userId: admin.id },
        });
      }
    }
  }
  console.log(`✓ ${PRODUCTS.length} products, ${allVariants.length} variants, stock + movements`);

  // Suppliers
  const suppliers = [];
  for (const s of SUPPLIERS) suppliers.push(await prisma.supplier.create({ data: s }));
  console.log("✓ Suppliers");

  // Purchase orders
  const poStatuses = ["RECEIVED", "RECEIVED", "PARTIAL", "ORDERED", "DRAFT"];
  for (let i = 0; i < 6; i++) {
    const supplier = pick(suppliers, i);
    const itemCount = rand(2, 4);
    const items = [];
    let total = 0;
    const usedVariants = new Set<string>();
    for (let j = 0; j < itemCount; j++) {
      let v = allVariants[rand(0, allVariants.length - 1)];
      let guard = 0;
      while (usedVariants.has(v.id) && guard++ < 10) v = allVariants[rand(0, allVariants.length - 1)];
      usedVariants.add(v.id);
      const qty = rand(20, 80);
      const unitCost = v.cost;
      total += qty * unitCost;
      const status = poStatuses[i % poStatuses.length];
      items.push({ variantId: v.id, quantity: qty, unitCost, receivedQty: status === "RECEIVED" ? qty : status === "PARTIAL" ? Math.floor(qty / 2) : 0 });
    }
    const orderDate = new Date(Date.now() - rand(5, 70) * 86400000);
    await prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-2026-${String(i + 1).padStart(4, "0")}`,
        status: poStatuses[i % poStatuses.length],
        orderDate,
        expectedDate: new Date(orderDate.getTime() + 14 * 86400000),
        notes: "Seasonal restock",
        totalAmount: total,
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        userId: admin.id,
        items: { create: items },
      },
    });
  }
  console.log("✓ Purchase orders");

  // Customers
  const customers = [];
  for (const c of CUSTOMERS) customers.push(await prisma.customer.create({ data: c }));
  console.log("✓ Customers");

  // Sales orders spread across the last ~45 days (for dashboard trends)
  let orderNo = 0;
  for (let d = 45; d >= 0; d--) {
    const ordersToday = rand(0, 3);
    for (let k = 0; k < ordersToday; k++) {
      orderNo++;
      const customer = pick(customers, orderNo + k);
      const itemCount = rand(1, 4);
      const items = [];
      let subtotal = 0;
      for (let j = 0; j < itemCount; j++) {
        const v = allVariants[rand(0, allVariants.length - 1)];
        const qty = rand(1, 3);
        subtotal += qty * v.sell;
        items.push({ variantId: v.id, quantity: qty, unitPrice: v.sell });
      }
      const discount = Math.random() < 0.3 ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal - discount;
      const orderDate = new Date(Date.now() - d * 86400000 + rand(0, 80000000));
      await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-2026-${String(orderNo).padStart(4, "0")}`,
          status: "FULFILLED",
          orderDate,
          subtotal,
          discount,
          tax: 0,
          total,
          customerId: customer.id,
          warehouseId: flagship.id,
          userId: admin.id,
          items: { create: items },
        },
      });
    }
  }
  console.log(`✓ ${orderNo} sales orders across 45 days`);

  console.log("\n✅ Seed complete.\n");
  console.log("   Login:  admin@rong.com.bd  /  password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
