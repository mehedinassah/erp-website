import Link from "next/link";
import {
  Banknote,
  Boxes,
  Shirt,
  TriangleAlert,
  ArrowUpRight,
  PackageSearch,
  TrendingUp,
  Percent,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canViewFinancials } from "@/lib/permissions";
import {
  formatBDT,
  formatBDTCompact,
  formatNumber,
  formatDate,
} from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/app/empty-state";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SalesArea } from "@/components/charts/sales-area";
import { CategoryBar } from "@/components/charts/category-bar";

export const dynamic = "force-dynamic";

const DAY = 86400000;

const PERIODS = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: 0 },
];

async function getData(tenantId: string, days: number) {
  const since = days > 0 ? new Date(Date.now() - days * DAY) : new Date(0);

  let productCount = 0;
  let variantCount = 0;
  let stockLevels: any[] = [];
  let orders: any[] = [];
  let returns: any[] = [];

  try {
    const results = await Promise.all([
      prisma.product.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.variant.count({ where: { product: { tenantId } } }),
      prisma.stockLevel.findMany({
        where: { variant: { product: { tenantId } } },
        include: { variant: { include: { product: { include: { category: true } } } } },
      }),
      prisma.salesOrder.findMany({
        where: { tenantId, status: "FULFILLED", orderDate: { gte: since } },
        orderBy: { orderDate: "asc" },
        include: {
          customer: true,
          items: { include: { variant: { include: { product: { include: { category: true } } } } } },
        },
      }),
      prisma.salesReturn.findMany({
        where: { tenantId, createdAt: { gte: since } },
        include: {
          items: { include: { variant: { include: { product: { include: { category: true } } } } } },
        },
      }),
    ]);
    
    productCount = results[0];
    variantCount = results[1];
    stockLevels = results[2];
    orders = results[3];
    returns = results[4];
  } catch (error) {
    // Tables may not exist yet - continue with empty data
    console.warn("Dashboard query failed (tables may not exist):", error instanceof Error ? error.message : error);
  }

  // Inventory value + per-variant totals (for low stock)
  let invCost = 0;
  let invRetail = 0;
  let totalUnits = 0;
  const variantTotals = new Map<string, { qty: number; threshold: number; label: string; sku: string }>();
  for (const sl of stockLevels) {
    invCost += sl.quantity * sl.variant.product.costPrice;
    invRetail += sl.quantity * sl.variant.product.sellPrice;
    totalUnits += sl.quantity;
    const prev = variantTotals.get(sl.variantId);
    if (prev) prev.qty += sl.quantity;
    else
      variantTotals.set(sl.variantId, {
        qty: sl.quantity,
        threshold: sl.variant.lowStockThreshold,
        label: `${sl.variant.product.name} · ${sl.variant.size}/${sl.variant.color}`,
        sku: sl.variant.sku,
      });
  }
  const lowStock = [...variantTotals.values()].filter((v) => v.qty <= v.threshold).sort((a, b) => a.qty - b.qty);

  // Sales aggregates over the period. Sales and returns are accumulated
  // separately so the net figures can be clamped — returns are matched by
  // return date and may reference sales outside this period/status, which
  // could otherwise push COGS or units negative (margin > 100%, "-2 units").
  let salesRevenue = 0;
  let salesCogs = 0;
  let salesUnits = 0;
  const productAgg = new Map<string, { name: string; sku: string; units: number; revenue: number; profit: number }>();
  const catAgg = new Map<string, number>();
  const trendMap = new Map<string, number>();
  const buckets = days > 0 ? days : 30;
  for (let i = buckets - 1; i >= 0; i--) {
    trendMap.set(new Date(Date.now() - i * DAY).toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    salesRevenue += o.total;
    const key = o.orderDate.toISOString().slice(0, 10);
    if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + o.total);
    for (const it of o.items) {
      const cost = it.variant.product.costPrice * it.quantity;
      const rev = it.unitPrice * it.quantity;
      salesCogs += cost;
      salesUnits += it.quantity;
      const pid = it.variant.product.id;
      const prev = productAgg.get(pid);
      if (prev) {
        prev.units += it.quantity;
        prev.revenue += rev;
        prev.profit += rev - cost;
      } else {
        productAgg.set(pid, { name: it.variant.product.name, sku: it.variant.product.sku, units: it.quantity, revenue: rev, profit: rev - cost });
      }
      const cat = it.variant.product.category.name;
      catAgg.set(cat, (catAgg.get(cat) ?? 0) + it.quantity);
    }
  }

  // Subtract sales returns (counted by return date).
  let returnsRevenue = 0;
  let returnsCogs = 0;
  let returnsUnits = 0;
  for (const r of returns) {
    const key = r.createdAt.toISOString().slice(0, 10);
    for (const it of r.items) {
      const cost = it.variant.product.costPrice * it.quantity;
      const rev = it.unitPrice * it.quantity;
      returnsRevenue += rev;
      returnsCogs += cost;
      returnsUnits += it.quantity;
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) - rev);
      const pid = it.variant.product.id;
      const prev = productAgg.get(pid);
      if (prev) {
        prev.units -= it.quantity;
        prev.revenue -= rev;
        prev.profit -= rev - cost;
      }
      const cat = it.variant.product.category.name;
      catAgg.set(cat, (catAgg.get(cat) ?? 0) - it.quantity);
    }
  }

  // Net figures, clamped so returns can never produce impossible values:
  // COGS ≥ 0 keeps gross profit ≤ revenue (margin ≤ 100%), and units ≥ 0.
  const revenue = Math.max(0, salesRevenue - returnsRevenue);
  const cogs = Math.max(0, salesCogs - returnsCogs);
  const units = Math.max(0, salesUnits - returnsUnits);
  const returnsTotal = Math.min(returnsRevenue, salesRevenue);
  const grossProfit = revenue - cogs;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const orderCount = orders.length;
  const aov = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

  const trend = [...trendMap.entries()].map(([date, total]) => ({
    date,
    label: formatDate(date).replace(/ \d{4}$/, ""),
    total: Math.max(0, total),
  }));
  const categoryData = [...catAgg.entries()]
    .map(([name, value]) => ({ name, value: Math.max(0, value) }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  const bestSellers = [...productAgg.values()].filter((p) => p.units > 0 && p.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  return {
    productCount,
    variantCount,
    totalUnits,
    invCost,
    invRetail,
    lowStock: lowStock.slice(0, 6),
    lowStockCount: lowStock.length,
    revenue,
    grossProfit,
    margin,
    orderCount,
    aov,
    units,
    returnsTotal,
    trend,
    categoryData,
    bestSellers,
    recentOrders: [...orders].reverse().slice(0, 6),
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const [session, sp] = await Promise.all([requireUser(), searchParams]);
  const periodKey = PERIODS.some((p) => p.key === sp.period) ? sp.period! : "30";
  const period = PERIODS.find((p) => p.key === periodKey)!;
  const d = await getData(session.tenantId, period.days);
  const firstName = session.name.split(" ")[0];
  const fin = canViewFinancials(session.role);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Inventory health, sales performance and profitability at a glance."
      >
        {fin && (
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <Button key={p.key} asChild variant={p.key === periodKey ? "gold" : "outline"} size="sm">
                <Link href={`/dashboard?period=${p.key}`}>{p.label}</Link>
              </Button>
            ))}
          </div>
        )}
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {fin ? (
          <>
            <StatCard label="Revenue" value={formatBDT(d.revenue)} hint={d.returnsTotal > 0 ? `Net · −${formatBDT(d.returnsTotal)} returns` : `${d.orderCount} orders · ${period.label.toLowerCase()}`} icon={Banknote} tone="gold" delay={0} />
            <StatCard label="Gross profit" value={formatBDT(d.grossProfit)} hint={`Margin ${d.margin.toFixed(1)}%`} icon={TrendingUp} tone="success" delay={60} />
            <StatCard label="Avg order value" value={formatBDT(d.aov)} hint={`${formatNumber(d.units)} units sold`} icon={ShoppingBag} delay={120} />
            <StatCard label="Low-stock alerts" value={formatNumber(d.lowStockCount)} hint="At or below threshold" icon={TriangleAlert} tone={d.lowStockCount > 0 ? "danger" : "success"} delay={180} />
          </>
        ) : (
          <>
            <StatCard label="Active products" value={formatNumber(d.productCount)} hint={`${formatNumber(d.variantCount)} variants`} icon={Shirt} delay={0} />
            <StatCard label="Low-stock alerts" value={formatNumber(d.lowStockCount)} hint="At or below threshold" icon={TriangleAlert} tone={d.lowStockCount > 0 ? "danger" : "success"} delay={60} />
          </>
        )}
      </div>

      {/* Charts (financial) */}
      {fin && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="animate-rise lg:col-span-2" style={{ animationDelay: "120ms" }}>
            <CardHeader>
              <CardTitle>Sales trend</CardTitle>
              <CardDescription>Daily fulfilled revenue · {period.label.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesArea data={d.trend} />
            </CardContent>
          </Card>
          <Card className="animate-rise" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <CardTitle>Top categories</CardTitle>
              <CardDescription>Units sold</CardDescription>
            </CardHeader>
            <CardContent>
              {d.categoryData.length ? (
                <CategoryBar data={d.categoryData} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">No sales in this period.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Best sellers + inventory value (financial) */}
      {fin && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="animate-rise lg:col-span-2" style={{ animationDelay: "160ms" }}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Best sellers</CardTitle>
                <CardDescription>Top products by revenue</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm"><Link href="/products">All products <ArrowUpRight className="size-4" /></Link></Button>
            </CardHeader>
            <CardContent>
              {d.bestSellers.length ? (
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>Product</TH>
                      <TH className="text-center">Units</TH>
                      <TH className="text-right">Revenue</TH>
                      <TH className="hidden sm:table-cell text-right">Profit</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {d.bestSellers.map((p) => (
                      <TR key={p.sku}>
                        <TD>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </TD>
                        <TD className="tabular text-center">{p.units}</TD>
                        <TD className="tabular text-right font-medium">{formatBDT(p.revenue)}</TD>
                        <TD className="hidden sm:table-cell text-right">
                          <Badge tone={p.profit >= 0 ? "success" : "danger"}>{formatBDT(p.profit)}</Badge>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">No sales in this period yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="animate-rise" style={{ animationDelay: "220ms" }}>
            <CardHeader>
              <CardTitle>Inventory value</CardTitle>
              <CardDescription>Current stock on hand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <span className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground"><Boxes className="size-5" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">Value at cost · {formatNumber(d.totalUnits)} units</p>
                  <p className="tabular font-display text-xl font-semibold">{formatBDT(d.invCost)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent"><Wallet className="size-5" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">Value at retail</p>
                  <p className="tabular font-display text-xl font-semibold">{formatBDT(d.invRetail)}</p>
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Percent className="size-3.5" /> Potential margin in stock: {formatBDTCompact(d.invRetail - d.invCost)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low stock + recent orders (everyone) */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="animate-rise" style={{ animationDelay: "160ms" }}>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Low stock</CardTitle>
              <CardDescription>Replenish these variants soon</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/stock">View all</Link></Button>
          </CardHeader>
          <CardContent>
            {d.lowStock.length ? (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Item</TH>
                    <TH className="text-right">In stock</TH>
                  </TR>
                </THead>
                <TBody>
                  {d.lowStock.map((v) => (
                    <TR key={v.sku}>
                      <TD>
                        <p className="font-medium">{v.label}</p>
                        <p className="text-xs text-muted-foreground">{v.sku}</p>
                      </TD>
                      <TD className="text-right">
                        <Badge tone={v.qty === 0 ? "danger" : "warning"}>{v.qty} / {v.threshold}</Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <EmptyState icon={Boxes} title="All stocked up" description="No variants are below their reorder threshold." />
            )}
          </CardContent>
        </Card>

        <Card className="animate-rise" style={{ animationDelay: "220ms" }}>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest fulfilled sales</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/sales">View all</Link></Button>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Order</TH>
                  <TH>Customer</TH>
                  {fin && <TH className="text-right">Total</TH>}
                </TR>
              </THead>
              <TBody>
                {d.recentOrders.map((o) => (
                  <TR key={o.id}>
                    <TD>
                      <Link href={`/sales/${o.id}`} className="font-medium gold-underline">{o.orderNumber}</Link>
                      <p className="text-xs text-muted-foreground">{formatDate(o.orderDate)}</p>
                    </TD>
                    <TD className="text-muted-foreground">{o.customer?.name ?? "Walk-in"}</TD>
                    {fin && <TD className="tabular text-right font-medium">{formatBDT(o.total)}</TD>}
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
