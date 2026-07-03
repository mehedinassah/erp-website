import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatBDT } from "@/lib/format";
import { EXPENSE_CATEGORY_LABEL, type ExpenseCategory } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const DAY = 86400000;
const PERIODS = [
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "365", label: "1 year", days: 365 },
  { key: "all", label: "All time", days: 0 },
];

function PnlRow({ label, value, bold, tone }: { label: string; value: number; bold?: boolean; tone?: "pos" | "neg" }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${bold ? "border-t border-border font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className={`tabular ${tone === "pos" ? "text-success" : tone === "neg" ? "text-destructive" : ""}`}>
        {value < 0 ? `−${formatBDT(Math.abs(value))}` : formatBDT(value)}
      </span>
    </div>
  );
}

async function getPnl(tenantId: string, days: number) {
  const since = days > 0 ? new Date(Date.now() - days * DAY) : new Date(0);
  const [orders, returns, expenses] = await Promise.all([
    prisma.salesOrder.findMany({
      where: { tenantId, status: "FULFILLED", orderDate: { gte: since } },
      include: { items: { include: { variant: { include: { product: true } } } } },
    }),
    prisma.salesReturn.findMany({
      // Match the sales set (fulfilled orders in the period) so returns can't
      // subtract against sales that fall outside the window.
      where: { tenantId, salesOrder: { status: "FULFILLED", orderDate: { gte: since } } },
      include: { items: { include: { variant: { include: { product: true } } } } },
    }),
    prisma.expense.findMany({ where: { tenantId, spentAt: { gte: since } } }),
  ]);

  // Net sales (excl. tax) = subtotal - discount, minus returns. Sales and
  // returns are accumulated separately, then net revenue and COGS are clamped
  // to ≥ 0 so returns matched by date can never push COGS negative and make
  // gross profit exceed sales (margin > 100%).
  let salesRevenue = 0;
  let salesCogs = 0;
  let taxCollected = 0;
  for (const o of orders) {
    salesRevenue += o.subtotal - o.discount;
    taxCollected += o.tax;
    for (const it of o.items) salesCogs += it.variant.product.costPrice * it.quantity;
  }
  let returnsRevenue = 0;
  let returnsCogs = 0;
  for (const r of returns) {
    for (const it of r.items) {
      returnsRevenue += it.unitPrice * it.quantity;
      returnsCogs += it.variant.product.costPrice * it.quantity;
    }
  }
  const revenue = Math.max(0, salesRevenue - returnsRevenue);
  const cogs = Math.max(0, salesCogs - returnsCogs);

  const grossProfit = revenue - cogs;

  const expByCat = new Map<string, number>();
  let totalExpenses = 0;
  for (const e of expenses) {
    expByCat.set(e.category, (expByCat.get(e.category) ?? 0) + e.amount);
    totalExpenses += e.amount;
  }
  const expenseRows = [...expByCat.entries()].sort((a, b) => b[1] - a[1]);

  const netProfit = grossProfit - totalExpenses;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return { revenue, cogs, taxCollected, grossProfit, expenseRows, totalExpenses, netProfit, margin };
}

export default async function PnlPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const [session, sp] = await Promise.all([requireRole(["ADMIN", "MANAGER"]), searchParams]);
  const periodKey = PERIODS.some((p) => p.key === sp.period) ? sp.period! : "30";
  const period = PERIODS.find((p) => p.key === periodKey)!;
  const { revenue, cogs, taxCollected, grossProfit, expenseRows, totalExpenses, netProfit, margin } =
    await getPnl(session.tenantId, period.days);

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Finance"
        title="Profit &amp; Loss"
        description="Real profit after cost of goods sold and operating expenses."
      >
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <Button key={p.key} asChild variant={p.key === periodKey ? "gold" : "outline"} size="sm">
              <Link href={`/reports/pnl?period=${p.key}`}>{p.label}</Link>
            </Button>
          ))}
        </div>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Net sales</p>
          <p className="tabular mt-1 font-display text-xl font-semibold">{formatBDT(revenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Gross profit</p>
          <p className="tabular mt-1 font-display text-xl font-semibold text-success">{formatBDT(grossProfit)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Net profit</p>
          <p className={`tabular mt-1 font-display text-xl font-semibold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
            {netProfit < 0 ? `−${formatBDT(Math.abs(netProfit))}` : formatBDT(netProfit)}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {netProfit >= 0 ? <TrendingUp className="size-4 text-success" /> : <TrendingDown className="size-4 text-destructive" />}
            Profit &amp; Loss · {period.label}
          </CardTitle>
          <CardDescription>Sales tax collected ({formatBDT(taxCollected)}) is excluded from revenue.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <PnlRow label="Net sales (excl. tax)" value={revenue} />
          <PnlRow label="Cost of goods sold" value={-cogs} tone="neg" />
          <PnlRow label="Gross profit" value={grossProfit} bold tone="pos" />

          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating expenses</p>
            {expenseRows.length ? (
              expenseRows.map(([cat, amt]) => (
                <PnlRow key={cat} label={EXPENSE_CATEGORY_LABEL[cat as ExpenseCategory] ?? cat} value={-amt} tone="neg" />
              ))
            ) : (
              <p className="py-2 text-muted-foreground">No expenses recorded in this period.</p>
            )}
            <PnlRow label="Total expenses" value={-totalExpenses} bold tone="neg" />
          </div>

          <PnlRow label={`Net profit (margin ${margin.toFixed(1)}%)`} value={netProfit} bold tone={netProfit >= 0 ? "pos" : "neg"} />
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Tip: record rent, salary and other costs under <Link href="/expenses" className="text-accent hover:underline">Expenses</Link> to keep this accurate.
      </p>
    </div>
  );
}
