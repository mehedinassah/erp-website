import Link from "next/link";
import { Plus, FileText, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatBDT, formatDate } from "@/lib/format";
import { QUOTE_STATUS_LABEL, type QuoteStatus } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const quoteTone = (s: string) =>
  s === "ACCEPTED" ? "success"
  : s === "DECLINED" ? "danger"
  : s === "EXPIRED" ? "neutral"
  : s === "SENT" ? "info"
  : "neutral";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const [session, sp] = await Promise.all([requireRole(["ADMIN", "MANAGER"]), searchParams]);
  const { tenantId } = session;

  const quotes = await prisma.quotation.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { customer: true, _count: { select: { items: true } } },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Quotations"
        description="Send price quotes to customers before converting to a sales order."
      >
        <Button asChild variant="gold">
          <Link href="/quotes/new"><Plus className="size-4" /> New quote</Link>
        </Button>
      </PageHeader>

      {sp.deleted && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-success animate-rise">
          <CheckCircle2 className="size-4" /> Quotation deleted.
        </div>
      )}

      <Card className="animate-rise overflow-hidden">
        {quotes.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Quote #</TH>
                <TH className="hidden sm:table-cell">Customer</TH>
                <TH className="hidden sm:table-cell">Date</TH>
                <TH className="hidden sm:table-cell">Valid until</TH>
                <TH className="text-right">Total</TH>
                <TH className="text-right">Status</TH>
              </TR>
            </THead>
            <TBody>
              {quotes.map((q) => (
                <TR key={q.id}>
                  <TD>
                    <Link href={`/quotes/${q.id}`} className="font-medium gold-underline">
                      {q.quoteNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">{q._count.items} items</p>
                  </TD>
                  <TD className="hidden sm:table-cell text-muted-foreground">
                    {q.customer?.name ?? "No customer"}
                  </TD>
                  <TD className="hidden sm:table-cell text-muted-foreground">{formatDate(q.quoteDate)}</TD>
                  <TD className="hidden sm:table-cell text-muted-foreground">
                    {q.validUntil ? formatDate(q.validUntil) : "—"}
                  </TD>
                  <TD className="tabular text-right font-medium">{formatBDT(q.total)}</TD>
                  <TD className="text-right">
                    <Badge tone={quoteTone(q.status)}>
                      {QUOTE_STATUS_LABEL[q.status as QuoteStatus] ?? q.status}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState icon={FileText} title="No quotations yet" description="Create your first quote to see it here." />
          </div>
        )}
      </Card>
    </div>
  );
}
