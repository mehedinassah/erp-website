import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  TrendingUp,
  TrendingDown,
  Plus,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canManageLedger } from "@/lib/permissions";
import { formatTaka, formatDate } from "@/lib/format";
import { summarize } from "@/lib/ledger";
import { METHOD_LABEL, type PaymentMethod } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { CountUp } from "@/components/app/count-up";
import { LedgerTrend } from "@/components/charts/ledger-trend";

export const dynamic = "force-dynamic";
const DAY = 86400000;

async function getData() {
  const accounts = await prisma.ledgerAccount.findMany({
    include: { entries: { select: { kind: true, amount: true, occurredAt: true } } },
  });

  let totalPaona = 0;
  let totalDena = 0;
  const outstanding: { id: string; code: string; shop: string; type: string; remaining: number }[] = [];
  for (const a of accounts) {
    const { remaining } = summarize(a.openingAmount, a.entries);
    if (a.type === "PAONA") totalPaona += Math.max(0, remaining);
    else totalDena += Math.max(0, remaining);
    if (remaining > 0)
      outstanding.push({ id: a.id, code: a.code, shop: a.shopName, type: a.type, remaining });
  }
  outstanding.sort((x, y) => y.remaining - x.remaining);

  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  let todayCollected = 0;
  let todayPaid = 0;
  for (const a of accounts)
    for (const e of a.entries) {
      if (e.kind !== "PAYMENT" || e.occurredAt < startToday) continue;
      if (a.type === "PAONA") todayCollected += e.amount;
      else todayPaid += e.amount;
    }

  // 30-day trend
  const trendMap = new Map<string, { collected: number; paid: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    trendMap.set(d.toISOString().slice(0, 10), { collected: 0, paid: 0 });
  }
  for (const a of accounts)
    for (const e of a.entries) {
      if (e.kind !== "PAYMENT") continue;
      const key = e.occurredAt.toISOString().slice(0, 10);
      const slot = trendMap.get(key);
      if (!slot) continue;
      if (a.type === "PAONA") slot.collected += e.amount;
      else slot.paid += e.amount;
    }
  const trend = [...trendMap.entries()].map(([date, v]) => ({
    label: formatDate(date).replace(/ \d{4}$/, ""),
    ...v,
  }));

  const recent = await prisma.ledgerEntry.findMany({
    orderBy: { occurredAt: "desc" },
    take: 8,
    include: { ledger: true },
  });

  return {
    totalPaona,
    totalDena,
    net: totalPaona - totalDena,
    todayCollected,
    todayPaid,
    trend,
    recent,
    topPaona: outstanding.filter((o) => o.type === "PAONA").slice(0, 5),
    topDena: outstanding.filter((o) => o.type === "DENA").slice(0, 5),
    count: accounts.length,
  };
}

export default async function LedgerOverview() {
  const [session, d] = await Promise.all([requireUser(), getData()]);
  const manage = canManageLedger(session.role);

  return (
    <div>
      <PageHeader
        eyebrow="Dena–Paona"
        title="Ledger overview"
        description="Receivables you'll collect and payables you owe — at a glance."
      >
        {manage && (
          <>
            <Button asChild variant="outline">
              <Link href="/ledger/new?type=DENA">
                <Plus className="size-4" /> New Dena
              </Link>
            </Button>
            <Button asChild variant="gold">
              <Link href="/ledger/new?type=PAONA">
                <Plus className="size-4" /> New Paona
              </Link>
            </Button>
          </>
        )}
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="animate-rise p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Paona (receivable)</p>
              <p className="tabular mt-2 font-display text-2xl font-semibold text-success">
                <CountUp value={d.totalPaona} format="taka" />
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-success/10 text-success">
              <ArrowDownLeft className="size-5" />
            </span>
          </div>
        </Card>

        <Card className="animate-rise p-5" style={{ animationDelay: "60ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Dena (payable)</p>
              <p className="tabular mt-2 font-display text-2xl font-semibold text-warning">
                <CountUp value={d.totalDena} format="taka" />
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-warning/10 text-warning">
              <ArrowUpRight className="size-5" />
            </span>
          </div>
        </Card>

        <Card className="animate-rise p-5" style={{ animationDelay: "120ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net position</p>
              <p className={`tabular mt-2 font-display text-2xl font-semibold ${d.net >= 0 ? "text-accent" : "text-destructive"}`}>
                <CountUp value={d.net} format="taka" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {d.net >= 0 ? "Net receivable" : "Net payable"}
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent">
              <Scale className="size-5" />
            </span>
          </div>
        </Card>

        <Card className="animate-rise p-5" style={{ animationDelay: "180ms" }}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingUp className="size-4 text-success" /> Collected today
              </span>
              <span className="tabular font-semibold text-success">
                {formatTaka(d.todayCollected)}
              </span>
            </div>
            <div className="hairline flex items-center justify-between pt-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingDown className="size-4 text-warning" /> Paid today
              </span>
              <span className="tabular font-semibold text-warning">
                {formatTaka(d.todayPaid)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Trend */}
      <Card className="mt-6 animate-rise">
        <CardHeader>
          <CardTitle>Cash flow trend</CardTitle>
          <CardDescription>Collections vs payments · last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <LedgerTrend data={d.trend} />
        </CardContent>
      </Card>

      {/* Outstanding + recent */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="animate-rise">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Top outstanding</CardTitle>
              <CardDescription>Largest balances to settle</CardDescription>
            </div>
            <Wallet className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">Receivable (Paona)</p>
              <ul className="space-y-1.5">
                {d.topPaona.length ? d.topPaona.map((o) => (
                  <li key={o.id} className="flex items-center justify-between text-sm">
                    <Link href={`/ledger/${o.id}`} className="gold-underline truncate">{o.shop}</Link>
                    <span className="tabular font-medium text-success">{formatTaka(o.remaining)}</span>
                  </li>
                )) : <li className="text-sm text-muted-foreground">Nothing outstanding.</li>}
              </ul>
            </div>
            <div className="hairline pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-warning">Payable (Dena)</p>
              <ul className="space-y-1.5">
                {d.topDena.length ? d.topDena.map((o) => (
                  <li key={o.id} className="flex items-center justify-between text-sm">
                    <Link href={`/ledger/${o.id}`} className="gold-underline truncate">{o.shop}</Link>
                    <span className="tabular font-medium text-warning">{formatTaka(o.remaining)}</span>
                  </li>
                )) : <li className="text-sm text-muted-foreground">Nothing outstanding.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Latest ledger activity</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH className="pl-6">Account</TH>
                  <TH>Type</TH>
                  <TH className="pr-6 text-right">Amount</TH>
                </TR>
              </THead>
              <TBody>
                {d.recent.map((e) => {
                  const inflow = (e.ledger.type === "PAONA") === (e.kind === "PAYMENT");
                  return (
                    <TR key={e.id}>
                      <TD className="pl-6">
                        <Link href={`/ledger/${e.ledgerId}`} className="font-medium gold-underline">{e.ledger.shopName}</Link>
                        <p className="text-xs text-muted-foreground">{formatDate(e.occurredAt)}{e.method ? ` · ${METHOD_LABEL[e.method as PaymentMethod] ?? e.method}` : ""}</p>
                      </TD>
                      <TD>
                        <Badge tone={e.kind === "CHARGE" ? "neutral" : e.ledger.type === "PAONA" ? "success" : "warning"}>
                          {e.kind === "CHARGE" ? "Due added" : e.ledger.type === "PAONA" ? "Collected" : "Paid"}
                        </Badge>
                      </TD>
                      <TD className={`tabular pr-6 text-right font-medium ${e.kind === "CHARGE" ? "text-muted-foreground" : inflow ? "text-success" : "text-warning"}`}>
                        {formatTaka(e.amount)}
                      </TD>
                    </TR>
                  );
                })}
                {d.recent.length === 0 && (
                  <TR className="hover:bg-transparent">
                    <TD className="pl-6 text-muted-foreground" colSpan={3}>No transactions yet.</TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
