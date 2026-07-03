import "server-only";
import { prisma } from "@/lib/prisma";
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear, subDays,
} from "date-fns";

// ---------------------------------------------------------------------------
// Read-only, tenant-scoped tools for the Perico Copilot.
// Every function takes tenantId from the trusted server session — the LLM
// never supplies it, so a tenant can only ever see its own data.
// ---------------------------------------------------------------------------

type Period = "today" | "yesterday" | "this_week" | "this_month" | "this_year";

function range(period: Period): { gte: Date; lte: Date } {
  const now = new Date();
  switch (period) {
    case "today":
      return { gte: startOfDay(now), lte: endOfDay(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { gte: startOfDay(y), lte: endOfDay(y) };
    }
    case "this_week":
      // Bangladesh work week commonly starts Saturday.
      return { gte: startOfWeek(now, { weekStartsOn: 6 }), lte: endOfWeek(now, { weekStartsOn: 6 }) };
    case "this_year":
      return { gte: startOfYear(now), lte: endOfYear(now) };
    case "this_month":
    default:
      return { gte: startOfMonth(now), lte: endOfMonth(now) };
  }
}

// Match the rest of the app (dashboard, P&L, POS): a "sale" is a fulfilled
// order. Keeping this in sync ensures the Copilot's numbers equal the dashboard.
const SALE_STATUSES = ["FULFILLED"];

async function countLowStock(tenantId: string): Promise<number> {
  const variants = await prisma.variant.findMany({
    where: { product: { tenantId, status: "ACTIVE" } },
    select: { lowStockThreshold: true, stockLevels: { select: { quantity: true } } },
  });
  let n = 0;
  for (const v of variants) {
    const total = v.stockLevels.reduce((s, sl) => s + sl.quantity, 0);
    if (total <= v.lowStockThreshold) n++;
  }
  return n;
}

async function getBusinessOverview(tenantId: string) {
  const [products, customers, warehouses, suppliers] = await Promise.all([
    prisma.product.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.warehouse.count({ where: { tenantId } }),
    prisma.supplier.count({ where: { tenantId } }),
  ]);
  const [todayAgg, monthAgg, lowStock] = await Promise.all([
    prisma.salesOrder.aggregate({ _sum: { total: true }, _count: true, where: { tenantId, status: { in: SALE_STATUSES }, orderDate: range("today") } }),
    prisma.salesOrder.aggregate({ _sum: { total: true }, _count: true, where: { tenantId, status: { in: SALE_STATUSES }, orderDate: range("this_month") } }),
    countLowStock(tenantId),
  ]);
  return {
    products, customers, warehouses, suppliers,
    lowStockItems: lowStock,
    todaySales: todayAgg._sum.total ?? 0,
    todayOrders: todayAgg._count,
    thisMonthSales: monthAgg._sum.total ?? 0,
    thisMonthOrders: monthAgg._count,
    currency: "BDT",
  };
}

async function getLowStock(tenantId: string, limit = 15) {
  const variants = await prisma.variant.findMany({
    where: { product: { tenantId, status: "ACTIVE" } },
    select: {
      sku: true, size: true, color: true, lowStockThreshold: true,
      product: { select: { name: true } },
      stockLevels: { select: { quantity: true } },
    },
  });
  const rows = variants
    .map((v) => ({
      product: v.product.name,
      variant: `${v.size}/${v.color}`,
      sku: v.sku,
      inStock: v.stockLevels.reduce((s, sl) => s + sl.quantity, 0),
      threshold: v.lowStockThreshold,
    }))
    .filter((r) => r.inStock <= r.threshold)
    .sort((a, b) => a.inStock - b.inStock)
    .slice(0, limit);
  return { count: rows.length, items: rows };
}

async function findProduct(tenantId: string, query: string) {
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { variants: { some: { sku: { contains: query, mode: "insensitive" } } } },
      ],
    },
    select: {
      name: true, sku: true, sellPrice: true, costPrice: true, unit: true,
      variants: { select: { size: true, color: true, sku: true, stockLevels: { select: { quantity: true } } } },
    },
    take: 8,
  });
  return {
    matches: products.map((p) => ({
      name: p.name, sku: p.sku, sellPrice: p.sellPrice, costPrice: p.costPrice, unit: p.unit,
      totalStock: p.variants.reduce((s, v) => s + v.stockLevels.reduce((t, sl) => t + sl.quantity, 0), 0),
      variants: p.variants.map((v) => ({
        variant: `${v.size}/${v.color}`, sku: v.sku,
        stock: v.stockLevels.reduce((t, sl) => t + sl.quantity, 0),
      })),
    })),
    currency: "BDT",
  };
}

async function getSalesSummary(tenantId: string, period: Period) {
  const agg = await prisma.salesOrder.aggregate({
    _sum: { total: true, amountPaid: true }, _count: true,
    where: { tenantId, status: { in: SALE_STATUSES }, orderDate: range(period) },
  });
  const total = agg._sum.total ?? 0;
  const paid = agg._sum.amountPaid ?? 0;
  return { period, orders: agg._count, revenue: total, collected: paid, outstanding: total - paid, currency: "BDT" };
}

async function getTopProducts(tenantId: string, period: Period, limit = 5) {
  const items = await prisma.sOItem.findMany({
    where: { salesOrder: { tenantId, status: { in: SALE_STATUSES }, orderDate: range(period) } },
    select: { quantity: true, unitPrice: true, variant: { select: { product: { select: { name: true } } } } },
  });
  const map = new Map<string, { units: number; revenue: number }>();
  for (const it of items) {
    const name = it.variant.product.name;
    const cur = map.get(name) ?? { units: 0, revenue: 0 };
    cur.units += it.quantity;
    cur.revenue += it.quantity * it.unitPrice;
    map.set(name, cur);
  }
  const top = [...map.entries()]
    .map(([product, v]) => ({ product, ...v }))
    .sort((a, b) => b.units - a.units)
    .slice(0, limit);
  return { period, top, currency: "BDT" };
}

async function getLedgerSummary(tenantId: string) {
  const accounts = await prisma.ledgerAccount.findMany({
    where: { tenantId },
    select: { type: true, openingAmount: true, entries: { select: { kind: true, amount: true } } },
  });
  let receivable = 0, payable = 0;
  for (const a of accounts) {
    let bal = a.openingAmount;
    for (const e of a.entries) bal += e.kind === "CHARGE" ? e.amount : -e.amount;
    if (a.type === "PAONA") receivable += bal;
    else payable += bal;
  }
  return { receivable_paona: receivable, payable_dena: payable, accounts: accounts.length, currency: "BDT" };
}

async function findLedgerAccount(tenantId: string, name: string) {
  const accounts = await prisma.ledgerAccount.findMany({
    where: {
      tenantId,
      OR: [
        { shopName: { contains: name, mode: "insensitive" } },
        { ownerName: { contains: name, mode: "insensitive" } },
      ],
    },
    select: { shopName: true, ownerName: true, type: true, phone: true, openingAmount: true, entries: { select: { kind: true, amount: true } } },
    take: 8,
  });
  return {
    matches: accounts.map((a) => {
      let bal = a.openingAmount;
      for (const e of a.entries) bal += e.kind === "CHARGE" ? e.amount : -e.amount;
      return {
        name: a.shopName, owner: a.ownerName, phone: a.phone, type: a.type,
        balance: bal, meaning: a.type === "PAONA" ? "they owe you" : "you owe them",
      };
    }),
    currency: "BDT",
  };
}

async function getExpensesSummary(tenantId: string, period: Period) {
  const [agg, byCat] = await Promise.all([
    prisma.expense.aggregate({ _sum: { amount: true }, _count: true, where: { tenantId, spentAt: range(period) } }),
    prisma.expense.groupBy({ by: ["category"], _sum: { amount: true }, where: { tenantId, spentAt: range(period) } }),
  ]);
  return {
    period,
    total: agg._sum.amount ?? 0,
    count: agg._count,
    byCategory: byCat.map((c) => ({ category: c.category, amount: c._sum.amount ?? 0 })).sort((a, b) => b.amount - a.amount),
    currency: "BDT",
  };
}

// ---------------------------------------------------------------------------
// Tool schemas (OpenAI/Groq function-calling format) + dispatcher
// ---------------------------------------------------------------------------

const PERIOD_ENUM = { type: "string", enum: ["today", "yesterday", "this_week", "this_month", "this_year"] };

export const TOOL_SCHEMAS = [
  { type: "function", function: { name: "get_business_overview", description: "High-level snapshot: counts of products/customers/warehouses/suppliers, number of low-stock items, and today's & this month's sales.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_low_stock", description: "List product variants at or below their low-stock threshold (what needs restocking).", parameters: { type: "object", properties: { limit: { type: "integer", description: "max rows (default 15)" } } } } },
  { type: "function", function: { name: "find_product", description: "Search products by name or SKU; returns price and current stock.", parameters: { type: "object", properties: { query: { type: "string", description: "product name or SKU to search for" } }, required: ["query"] } } },
  { type: "function", function: { name: "get_sales_summary", description: "Sales totals for a period: order count, revenue, amount collected, and outstanding.", parameters: { type: "object", properties: { period: PERIOD_ENUM }, required: ["period"] } } },
  { type: "function", function: { name: "get_top_products", description: "Best-selling products for a period, by units sold and revenue.", parameters: { type: "object", properties: { period: PERIOD_ENUM, limit: { type: "integer" } }, required: ["period"] } } },
  { type: "function", function: { name: "get_ledger_summary", description: "Dena-Paona totals: total receivable (Paona, money others owe you) and total payable (Dena, money you owe).", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "find_ledger_account", description: "Look up a specific person/shop in the Dena-Paona ledger by name and return their current balance.", parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "get_expenses_summary", description: "Total expenses for a period, broken down by category.", parameters: { type: "object", properties: { period: PERIOD_ENUM }, required: ["period"] } } },
];

type Args = Record<string, unknown>;

export async function runTool(name: string, args: Args, tenantId: string): Promise<unknown> {
  const period = (args.period as Period) ?? "this_month";
  switch (name) {
    case "get_business_overview": return getBusinessOverview(tenantId);
    case "get_low_stock": return getLowStock(tenantId, typeof args.limit === "number" ? args.limit : 15);
    case "find_product": return findProduct(tenantId, String(args.query ?? ""));
    case "get_sales_summary": return getSalesSummary(tenantId, period);
    case "get_top_products": return getTopProducts(tenantId, period, typeof args.limit === "number" ? args.limit : 5);
    case "get_ledger_summary": return getLedgerSummary(tenantId);
    case "find_ledger_account": return findLedgerAccount(tenantId, String(args.name ?? ""));
    case "get_expenses_summary": return getExpensesSummary(tenantId, period);
    default: return { error: `Unknown tool: ${name}` };
  }
}
