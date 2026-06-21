import Link from "next/link";
import { ChevronLeft, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDate, formatNumber, formatVariant } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddBatchForm } from "@/components/app/add-batch-form";

export const dynamic = "force-dynamic";

const DAY = 86400000;
const SOON_DAYS = 30;

type SP = { filter?: string };

async function getExpiryData(tenantId: string, filter: string) {
  const now = Date.now();
  const [batches, expiryVariants, warehouses] = await Promise.all([
    prisma.stockBatch.findMany({
      where: { tenantId, expiryDate: { not: null } },
      orderBy: { expiryDate: "asc" },
      include: { variant: { include: { product: true } }, warehouse: true },
    }),
    prisma.variant.findMany({
      where: { product: { tenantId, trackExpiry: true } },
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    }),
    prisma.warehouse.findMany({ where: { tenantId }, orderBy: { isDefault: "desc" } }),
  ]);

  const rows = batches
    .map((b) => {
      const exp = b.expiryDate!.getTime();
      const days = Math.ceil((exp - now) / DAY);
      const status = days < 0 ? "expired" : days <= SOON_DAYS ? "soon" : "ok";
      return { b, days, status };
    })
    .filter((r) => (filter === "expired" ? r.status === "expired" : filter === "soon" ? r.status === "soon" : true));

  const expiredCount = batches.filter((b) => b.expiryDate!.getTime() < now).length;
  const soonCount = batches.filter((b) => {
    const d = Math.ceil((b.expiryDate!.getTime() - now) / DAY);
    return d >= 0 && d <= SOON_DAYS;
  }).length;

  return { rows, total: batches.length, expiredCount, soonCount, expiryVariants, warehouses };
}

export default async function ExpiryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const [session, sp] = await Promise.all([requireUser(), searchParams]);
  const { tenantId } = session;
  const filter = sp.filter ?? "all";
  const { rows, total, expiredCount, soonCount, expiryVariants, warehouses } = await getExpiryData(tenantId, filter);

  const tabs = [
    { key: "all", label: `All (${total})` },
    { key: "soon", label: `Expiring soon (${soonCount})` },
    { key: "expired", label: `Expired (${expiredCount})` },
  ];

  return (
    <div>
      <Link href="/stock" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Stock control
      </Link>
      <PageHeader
        eyebrow="Inventory"
        title="Batches & expiry"
        description="Track batch numbers and expiry dates for medicines, food, and other perishables."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <Button key={t.key} asChild variant={filter === t.key ? "gold" : "outline"} size="sm">
                <Link href={`/stock/expiry?filter=${t.key}`}>{t.label}</Link>
              </Button>
            ))}
          </div>

          <Card className="animate-rise overflow-hidden">
            {rows.length ? (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Product</TH>
                    <TH>Batch</TH>
                    <TH className="hidden sm:table-cell">Warehouse</TH>
                    <TH className="text-right">Qty</TH>
                    <TH className="text-right">Expiry</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map(({ b, days, status }) => {
                    const variantLabel = formatVariant(b.variant.size, b.variant.color);
                    return (
                      <TR key={b.id}>
                        <TD>
                          <p className="font-medium">{b.variant.product.name}</p>
                          {variantLabel && <p className="text-xs text-muted-foreground">{variantLabel}</p>}
                        </TD>
                        <TD className="text-sm text-muted-foreground">{b.batchNumber ?? "—"}</TD>
                        <TD className="hidden sm:table-cell text-sm text-muted-foreground">{b.warehouse.code}</TD>
                        <TD className="tabular text-right">{formatNumber(b.quantity)}</TD>
                        <TD className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm">{formatDate(b.expiryDate!)}</span>
                            <Badge tone={status === "expired" ? "danger" : status === "soon" ? "warning" : "success"}>
                              {status === "expired"
                                ? `Expired ${Math.abs(days)}d ago`
                                : status === "soon"
                                  ? `${days}d left`
                                  : "OK"}
                            </Badge>
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            ) : (
              <div className="p-4">
                <EmptyState
                  icon={CalendarClock}
                  title="No batches here"
                  description="Record a batch on the right to start tracking expiry dates."
                />
              </div>
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Record a batch</CardTitle>
            <CardDescription>Adds the quantity to stock and logs its expiry.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddBatchForm
              variants={expiryVariants.map((v) => ({
                id: v.id,
                label: `${v.product.name}${formatVariant(v.size, v.color) ? " · " + formatVariant(v.size, v.color) : ""}`,
              }))}
              warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
