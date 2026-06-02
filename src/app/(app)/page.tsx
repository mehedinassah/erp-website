import Link from "next/link";
import {
  Banknote,
  Boxes,
  Shirt,
  TriangleAlert,
  ArrowUpRight,
  PackageSearch,
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

async function getData() {
  const since = new Date(Date.now() - 30 * DAY);

  const [productCount, variantCount, stockAgg, stockLevels, orders] =
    await Promise.all([
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.variant.count(),
      prisma.stockLevel.aggregate({ _sum: { quantity: true } }),
      prisma.stockLevel.findMany({
        include: {
          variant: { include: { product: { include: { category: true } } } },
        },
      }),
      prisma.salesOrder.findMany({
        where: { status: "FULFILLED" },
        orderBy: { orderDate: "desc" },
        include: {
          customer: true,
          items: {
            include: {
              variant: { include: { product: { include: { category: true } } } },
            },
          },
        },
      }),
    ]);

  // Inventory value + per-variant totals (for low stock)
  let inventoryRetail = 0;
  const variantTotals = new Map<
    string,
    { qty: number; threshold: number; label: string; sku: string }
  >();
  for (const sl of stockLevels) {
    inventoryRetail += sl.quantity * sl.variant.product.sellPrice;
    const key = sl.variantId;
    const prev = variantTotals.get(key);
    if (prev) prev.qty += sl.quantity;
    else
      variantTotals.set(key, {
        qty: sl.quantity,
        threshold: sl.variant.lowStockThreshold,
        label: `${sl.variant.product.name} · ${sl.variant.size}/${sl.variant.color}`,
        sku: sl.variant.sku,
      });
  }
  const lowStock = [...variantTotals.values()]
    .filter((v) => v.qty <= v.threshold)
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 6);
  const lowStockCount = [...variantTotals.values()].filter(
    (v) => v.qty <= v.threshold,
  ).length;

  // 30-day sales
  const recentWindow = orders.filter((o) => o.orderDate >= since);
  const revenue30 = recentWindow.reduce((s, o) => s + o.total, 0);
  const orderCount30 = recentWindow.length;

  // Trend by day (last 30 days)
  const trendMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of recentWindow) {
    const key = o.orderDate.toISOString().slice(0, 10);
    if (trendMap.has(key)) trendMap.set(key, trendMap.get(key)! + o.total);
  }
  const trend = [...trendMap.entries()].map(([date, total]) => ({
    date,
    label: formatDate(date).replace(/ \d{4}$/, ""),
    total,
  }));

  // Units sold by category (30d)
  const catMap = new Map<string, number>();
  for (const o of recentWindow)
    for (const it of o.items) {
      const name = it.variant.product.category.name;
      catMap.set(name, (catMap.get(name) ?? 0) + it.quantity);
    }
  const categoryData = [...catMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    productCount,
    variantCount,
    totalUnits: stockAgg._sum.quantity ?? 0,
    inventoryRetail,
    lowStock,
    lowStockCount,
    revenue30,
    orderCount30,
    trend,
    categoryData,
    recentOrders: orders.slice(0, 6),
  };
}

export default async function DashboardPage() {
  const [session, d] = await Promise.all([requireUser(), getData()]);
  const firstName = session.name.split(" ")[0];
  const showFinancials = canViewFinancials(session.role);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="A live snapshot of inventory health and sales performance across RONG."
      >
        <Button asChild variant="outline">
          <Link href="/stock">
            <PackageSearch className="size-4" /> Stock control
          </Link>
        </Button>
        <Button asChild variant="gold">
          <Link href="/sales/new">
            New sale <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${showFinancials ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}
      >
        {showFinancials && (
          <StatCard
            label="Revenue · last 30 days"
            value={formatBDT(d.revenue30)}
            hint={`${d.orderCount30} orders fulfilled`}
            icon={Banknote}
            tone="gold"
            delay={0}
          />
        )}
        <StatCard
          label="Units in stock"
          value={formatNumber(d.totalUnits)}
          hint={`Retail value ${formatBDTCompact(d.inventoryRetail)}`}
          icon={Boxes}
          delay={60}
        />
        <StatCard
          label="Active products"
          value={formatNumber(d.productCount)}
          hint={`${formatNumber(d.variantCount)} variants`}
          icon={Shirt}
          delay={120}
        />
        <StatCard
          label="Low-stock alerts"
          value={formatNumber(d.lowStockCount)}
          hint="At or below threshold"
          icon={TriangleAlert}
          tone={d.lowStockCount > 0 ? "danger" : "success"}
          delay={180}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {showFinancials && (
          <Card className="animate-rise lg:col-span-2" style={{ animationDelay: "120ms" }}>
            <CardHeader>
              <CardTitle>Sales trend</CardTitle>
              <CardDescription>Daily fulfilled revenue · last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesArea data={d.trend} />
            </CardContent>
          </Card>
        )}

        <Card
          className={`animate-rise ${showFinancials ? "" : "lg:col-span-3"}`}
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader>
            <CardTitle>Top categories</CardTitle>
            <CardDescription>Units sold · last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {d.categoryData.length ? (
              <CategoryBar data={d.categoryData} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No sales in this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="animate-rise" style={{ animationDelay: "160ms" }}>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Low stock</CardTitle>
              <CardDescription>Replenish these variants soon</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/stock">View all</Link>
            </Button>
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
                        <Badge tone={v.qty === 0 ? "danger" : "warning"}>
                          {v.qty} / {v.threshold}
                        </Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <EmptyState
                icon={Boxes}
                title="All stocked up"
                description="No variants are below their reorder threshold."
              />
            )}
          </CardContent>
        </Card>

        <Card className="animate-rise" style={{ animationDelay: "220ms" }}>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest fulfilled sales</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/sales">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Order</TH>
                  <TH>Customer</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {d.recentOrders.map((o) => (
                  <TR key={o.id}>
                    <TD>
                      <Link
                        href={`/sales/${o.id}`}
                        className="font-medium gold-underline"
                      >
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(o.orderDate)}
                      </p>
                    </TD>
                    <TD className="text-muted-foreground">
                      {o.customer?.name ?? "Walk-in"}
                    </TD>
                    <TD className="tabular text-right font-medium">
                      {formatBDT(o.total)}
                    </TD>
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
