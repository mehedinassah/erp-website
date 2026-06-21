import { Wallet, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { formatBDT, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaymentReviewButtons } from "@/components/app/payment-review-buttons";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireSuperAdmin();

  const payments = await prisma.payment.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { tenant: { select: { name: true } } },
  });

  const pending = payments.filter((p) => p.status === "PENDING");
  const rest = payments.filter((p) => p.status !== "PENDING");

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Subscription payments"
        description="Review and approve manual bKash/Nagad payments to activate plans."
      />

      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-border px-6 py-3 text-sm font-medium">
          Pending review ({pending.length})
        </div>
        {pending.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH className="pl-6">Business</TH>
                <TH>Plan</TH>
                <TH>Transaction ID</TH>
                <TH>Submitted</TH>
                <TH className="text-right">Amount</TH>
                <TH className="pr-6 text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {pending.map((p) => (
                <TR key={p.id}>
                  <TD className="pl-6 font-medium">{p.tenant.name}</TD>
                  <TD>{p.plan} · {p.periodMonths}mo</TD>
                  <TD className="text-xs text-muted-foreground">{p.reference ?? "—"}</TD>
                  <TD className="text-sm text-muted-foreground">{formatDateTime(p.createdAt)}</TD>
                  <TD className="tabular text-right font-medium">{formatBDT(p.amount)}</TD>
                  <TD className="pr-6"><PaymentReviewButtons paymentId={p.id} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState icon={CheckCircle2} title="Nothing to review" description="No pending payments right now." />
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-6 py-3 text-sm font-medium">History</div>
        {rest.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH className="pl-6">Business</TH>
                <TH>Plan</TH>
                <TH>Method</TH>
                <TH>Date</TH>
                <TH className="text-right">Amount</TH>
                <TH className="pr-6 text-right">Status</TH>
              </TR>
            </THead>
            <TBody>
              {rest.map((p) => (
                <TR key={p.id}>
                  <TD className="pl-6 font-medium">{p.tenant.name}</TD>
                  <TD>{p.plan}</TD>
                  <TD className="text-sm text-muted-foreground">{p.method === "MANUAL" ? "bKash/Nagad" : p.method}</TD>
                  <TD className="text-sm text-muted-foreground">{formatDateTime(p.paidAt ?? p.createdAt)}</TD>
                  <TD className="tabular text-right">{formatBDT(p.amount)}</TD>
                  <TD className="pr-6 text-right">
                    <Badge tone={p.status === "PAID" ? "success" : "danger"}>{p.status === "PAID" ? "Paid" : "Failed"}</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState icon={Wallet} title="No payment history yet" description="Approved and rejected payments appear here." />
          </div>
        )}
      </Card>
    </div>
  );
}
