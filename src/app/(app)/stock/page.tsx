import Link from "next/link";
import { Plus, Search, Boxes, ArrowDownRight, ArrowUpRight, CheckCircle2, ArrowLeftRight, ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canDelete } from "@/lib/permissions";
import { ClearButton } from "@/components/app/clear-button";
import { clearStock } from "../clear-actions";
import { formatNumber, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const PER = 12;

type SP = {
  q?: string;
  warehouse?: string;
  low?: string;
  page?: string;
  recorded?: string;
  transferred?: string;
};

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const [session, sp] = await Promise.all([requireUser(), searchParams]);
  const { tenantId } = session;
  const q = (sp.q ?? "").trim().toLowerCase();
  const warehouseId = sp.warehouse ?? "";
  const lowOnly = sp.low === "1";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const [warehouses, variants, movements] = await Promise.all([
    prisma.warehouse.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.variant.findMany({
      where: { product: { tenantId } },
      include: {
        product: true,
        stockLevels: { include: { warehouse: true } },
      },
      orderBy: { product: { name: "asc" } },
    }),
    prisma.stockMovement.findMany({
      where: { warehouse: { tenantId } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { variant: { include: { product: true } }, warehouse: true },
    }),
  ]);

  const rows = variants
    .map((v) => {
      const total = v.stockLevels.reduce((t, sl) => t + sl.quantity, 0);
      const shown = warehouseId
        ? (v.stockLevels.find((s) => s.warehouseId === warehouseId)?.quantity ??
          0)
        : total;
      return { v, total, shown };
    })
    .filter(({ v, total }) => {
      const matchesQ =
        !q ||
        v.product.name.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q);
      const matchesLow = !lowOnly || total <= v.lowStockThreshold;
      return matchesQ && matchesLow;
    });

  const totalPages = Math.max(1, Math.ceil(rows.length / PER));
  const current = Math.min(page, totalPages);
  const pageRows = rows.slice((current - 1) * PER, current * PER);

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (warehouseId) params.set("warehouse", warehouseId);
    if (lowOnly) params.set("low", "1");
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/stock?${s}` : "/stock";
  };

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Stock control"
        description="Live stock levels by variant and warehouse. Record receipts, sales, and corrections."
      >
        <Button asChild variant="outline">
          <Link href="/stock/take">
            <ClipboardCheck className="size-4" /> Stock take
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/stock/transfer">
            <ArrowLeftRight className="size-4" /> Transfer
          </Link>
        </Button>
        <Button asChild variant="gold">
          <Link href="/stock/adjust">
            <Plus className="size-4" /> Record movement
          </Link>
        </Button>
        {canDelete(session.role) && (
          <ClearButton
            action={clearStock}
            entity="all stock data"
            description="Deletes every stock movement and resets all stock levels to 0. Products and orders are kept."
          />
        )}
      </PageHeader>

      {sp.transferred && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-success animate-rise">
          <CheckCircle2 className="size-4" />
          Stock transferred successfully.
        </div>
      )}
      {sp.recorded && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-success animate-rise">
          <CheckCircle2 className="size-4" />
          Stock movement recorded.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <form className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={sp.q} placeholder="Search variant, SKU, colour…" className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select name="warehouse" defaultValue={warehouseId} className="sm:w-44">
                <option value="">All warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm">
                <input type="checkbox" name="low" value="1" defaultChecked={lowOnly} className="accent-[var(--accent)]" />
                Low only
              </label>
              <Button type="submit" variant="outline">
                Filter
              </Button>
            </div>
          </form>

          <Card className="animate-rise overflow-hidden">
            {pageRows.length ? (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Variant</TH>
                    <TH>SKU</TH>
                    {!warehouseId &&
                      warehouses.map((w) => (
                        <TH key={w.id} className="text-right">
                          {w.code}
                        </TH>
                      ))}
                    <TH className="text-right">
                      {warehouseId ? "On hand" : "Total"}
                    </TH>
                  </TR>
                </THead>
                <TBody>
                  {pageRows.map(({ v, total, shown }) => {
                    const low = total <= v.lowStockThreshold;
                    return (
                      <TR key={v.id}>
                        <TD>
                          <span className="inline-flex items-center gap-2">
                            <span className="size-3.5 rounded-full border border-black/10" style={{ background: v.colorHex ?? "#ccc" }} />
                            <span className="font-medium">{v.product.name}</span>
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {v.size} · {v.color}
                          </p>
                        </TD>
                        <TD className="text-xs text-muted-foreground">{v.sku}</TD>
                        {!warehouseId &&
                          warehouses.map((w) => {
                            const sl = v.stockLevels.find(
                              (x) => x.warehouseId === w.id,
                            );
                            return (
                              <TD key={w.id} className="tabular text-right text-muted-foreground">
                                {sl?.quantity ?? 0}
                              </TD>
                            );
                          })}
                        <TD className="text-right">
                          <Badge tone={low ? (total === 0 ? "danger" : "warning") : "neutral"}>
                            {formatNumber(shown)}
                          </Badge>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            ) : (
              <div className="p-4">
                <EmptyState
                  icon={Boxes}
                  title="No matching variants"
                  description="Adjust your search or filters."
                />
              </div>
            )}
          </Card>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                Page {current} of {totalPages} · {rows.length} variants
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className={current <= 1 ? "pointer-events-none opacity-50" : ""}>
                  <Link href={hrefFor(current - 1)}>Previous</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className={current >= totalPages ? "pointer-events-none opacity-50" : ""}>
                  <Link href={hrefFor(current + 1)}>Next</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Recent movements */}
        <Card className="animate-rise h-fit">
          <CardHeader>
            <CardTitle>Recent movements</CardTitle>
            <CardDescription>Latest stock changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {movements.map((m) => {
              const inbound = m.quantity > 0;
              return (
                <div key={m.id} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${inbound ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                  >
                    {inbound ? (
                      <ArrowDownRight className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.variant.product.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.variant.size}/{m.variant.color} · {m.warehouse.code}
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`tabular text-sm font-semibold ${inbound ? "text-success" : "text-destructive"}`}
                  >
                    {inbound ? "+" : ""}
                    {m.quantity}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
