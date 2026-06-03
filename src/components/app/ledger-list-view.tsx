import Link from "next/link";
import { Plus, Search, Wallet, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { canManageLedger } from "@/lib/permissions";
import { formatTaka } from "@/lib/format";
import { summarize } from "@/lib/ledger";
import type { LedgerType } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type SP = { q?: string; status?: string; sort?: string };

export async function LedgerListView({
  type,
  sp,
  role,
}: {
  type: LedgerType;
  sp: SP;
  role: string;
}) {
  const isPaona = type === "PAONA";
  const manage = canManageLedger(role);
  const q = (sp.q ?? "").trim().toLowerCase();
  const status = sp.status ?? "";

  const accounts = await prisma.ledgerAccount.findMany({
    where: { type },
    orderBy: { createdAt: "desc" },
    include: { entries: { select: { kind: true, amount: true } } },
  });

  let rows = accounts.map((a) => {
    const s = summarize(a.openingAmount, a.entries);
    return { ...a, ...s };
  });

  if (q)
    rows = rows.filter(
      (r) =>
        r.shopName.toLowerCase().includes(q) ||
        (r.ownerName ?? "").toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q),
    );
  if (status === "pending") rows = rows.filter((r) => r.remaining > 0);
  if (status === "cleared") rows = rows.filter((r) => r.remaining <= 0);

  const accent = isPaona ? "text-success" : "text-warning";
  const totalRemaining = rows.reduce((s, r) => s + Math.max(0, r.remaining), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Dena–Paona"
        title={isPaona ? "Paona — Receivables" : "Dena — Payables"}
        description={
          isPaona
            ? "Businesses and people who owe you money."
            : "Businesses and people you need to pay."
        }
      >
        {manage && (
          <Button asChild variant="gold">
            <Link href={`/ledger/new?type=${type}`}>
              <Plus className="size-4" /> New {isPaona ? "Paona" : "Dena"}
            </Link>
          </Button>
        )}
      </PageHeader>

      {/* Summary strip */}
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
        <span className="flex items-center gap-2">
          <Wallet className={`size-4 ${accent}`} />
          <span className="text-muted-foreground">
            Total {isPaona ? "receivable" : "payable"}:
          </span>
          <span className={`tabular font-semibold ${accent}`}>
            {formatTaka(totalRemaining)}
          </span>
        </span>
        <span className="text-muted-foreground">
          {rows.length} account{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Filters */}
      <form className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q} placeholder="Search shop, owner, phone or ID…" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select name="status" defaultValue={status} className="sm:w-40">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="cleared">Cleared</option>
          </Select>
          <Button type="submit" variant="outline">Filter</Button>
        </div>
      </form>

      <Card className="animate-rise overflow-hidden">
        {rows.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Account</TH>
                <TH>Contact</TH>
                <TH className="text-right">Billed</TH>
                <TH className="text-right">Paid</TH>
                <TH className="text-right">Remaining</TH>
                <TH className="text-right">Status</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/ledger/${r.id}`} className="font-medium gold-underline">
                      {r.shopName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {r.code}
                      {r.ownerName ? ` · ${r.ownerName}` : ""}
                    </p>
                  </TD>
                  <TD className="text-sm text-muted-foreground">
                    {r.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="size-3" /> {r.phone}
                      </span>
                    ) : (
                      "—"
                    )}
                    {r.category && (
                      <p className="text-xs">{r.category}</p>
                    )}
                  </TD>
                  <TD className="tabular text-right text-muted-foreground">{formatTaka(r.billed)}</TD>
                  <TD className="tabular text-right text-muted-foreground">{formatTaka(r.paid)}</TD>
                  <TD className={`tabular text-right font-semibold ${r.remaining > 0 ? accent : "text-muted-foreground"}`}>
                    {formatTaka(Math.max(0, r.remaining))}
                  </TD>
                  <TD className="text-right">
                    <Badge tone={r.remaining > 0 ? "warning" : "success"}>
                      {r.remaining > 0 ? "Pending" : "Cleared"}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Wallet}
              title={q || status ? "No matching accounts" : `No ${isPaona ? "receivables" : "payables"} yet`}
              description={
                q || status
                  ? "Try a different search or filter."
                  : `Add your first ${isPaona ? "Paona" : "Dena"} account to start tracking.`
              }
            >
              {manage && !q && !status && (
                <Button asChild variant="gold">
                  <Link href={`/ledger/new?type=${type}`}>
                    <Plus className="size-4" /> New {isPaona ? "Paona" : "Dena"}
                  </Link>
                </Button>
              )}
            </EmptyState>
          </div>
        )}
      </Card>

      {/* Mobile floating add button */}
      {manage && (
        <Link
          href={`/ledger/new?type=${type}`}
          aria-label={`New ${isPaona ? "Paona" : "Dena"}`}
          className="fixed bottom-6 right-5 z-30 grid size-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform active:scale-95 lg:hidden"
        >
          <Plus className="size-6" />
        </Link>
      )}
    </div>
  );
}
