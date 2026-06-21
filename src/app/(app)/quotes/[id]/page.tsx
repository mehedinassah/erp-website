import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getTenantProfile } from "@/lib/tenant";
import { formatBDT, formatDate } from "@/lib/format";
import { QUOTE_STATUS_LABEL, type QuoteStatus } from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PrintButton } from "@/components/app/print-button";
import { QuoteStatusButtons } from "./quote-status-buttons";

export const dynamic = "force-dynamic";

const quoteTone = (s: string) =>
  s === "ACCEPTED" ? "success" : s === "DECLINED" ? "danger" : s === "SENT" ? "info" : "neutral";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([requireRole(["ADMIN", "MANAGER"]), params]);
  const { tenantId } = session;

  const quote = await prisma.quotation.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      user: true,
      items: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!quote) notFound();

  const biz = await getTenantProfile(tenantId);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/quotes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> Quotations
        </Link>
        <div className="flex items-center gap-2">
          <QuoteStatusButtons
            quoteId={quote.id}
            currentStatus={quote.status}
            tenantId={tenantId}
            userId={session.userId}
          />
          <PrintButton />
        </div>
      </div>

      <Card className="animate-rise overflow-hidden p-8 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-xl font-semibold">{biz?.name ?? "Your Business"}</p>
            {(biz?.address || biz?.phone) && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {[biz?.address, biz?.phone].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold">Quotation</p>
            <p className="tabular text-sm text-muted-foreground">{quote.quoteNumber}</p>
            <div className="mt-1 flex justify-end">
              <Badge tone={quoteTone(quote.status)}>
                {QUOTE_STATUS_LABEL[quote.status as QuoteStatus] ?? quote.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="hairline my-7" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prepared for</p>
            <p className="font-medium">{quote.customer?.name ?? "No customer specified"}</p>
          </div>
          <div className="sm:text-right">
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Date: </span>{formatDate(quote.quoteDate)}</p>
              {quote.validUntil && (
                <p><span className="text-muted-foreground">Valid until: </span>{formatDate(quote.validUntil)}</p>
              )}
              {quote.user && (
                <p><span className="text-muted-foreground">Prepared by: </span>{quote.user.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-7">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Item</TH>
                <TH className="text-center">Qty</TH>
                <TH className="text-right">Unit price</TH>
                <TH className="text-right">Amount</TH>
              </TR>
            </THead>
            <TBody>
              {quote.items.map((it) => (
                <TR key={it.id} className="hover:bg-transparent">
                  <TD>
                    <p className="font-medium">{it.variant.product.name}</p>
                    <p className="text-xs text-muted-foreground">{it.variant.size} · {it.variant.color} · {it.variant.sku}</p>
                  </TD>
                  <TD className="tabular text-center">{it.quantity}</TD>
                  <TD className="tabular text-right">{formatBDT(it.unitPrice)}</TD>
                  <TD className="tabular text-right font-medium">{formatBDT(it.unitPrice * it.quantity)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular">{formatBDT(quote.subtotal)}</span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular text-destructive">−{formatBDT(quote.discount)}</span>
              </div>
            )}
            <div className="hairline flex justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular text-accent">{formatBDT(quote.total)}</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="hairline mt-7 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
            <p className="mt-1 text-sm text-muted-foreground">{quote.notes}</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {biz?.name ?? "Your Business"} · This quotation is valid until {quote.validUntil ? formatDate(quote.validUntil) : "further notice"} · ৳ all amounts in BDT
        </p>
      </Card>
    </div>
  );
}
