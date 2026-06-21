import { notFound } from "next/navigation";
import { CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { accessState } from "@/lib/subscription";
import { sslczConfigured } from "@/lib/sslcommerz";
import { PAID_PLANS } from "@/lib/plans";
import { BILLING } from "@/lib/site";
import { formatBDT, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { BillingPlans } from "@/components/app/billing-plans";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; failed?: string; cancelled?: string }>;
}) {
  const [session, sp] = await Promise.all([requireRole(["ADMIN"]), searchParams]);
  const { tenantId } = session;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, status: true, trialEndsAt: true, currentPeriodEnd: true },
  });
  if (!tenant) notFound();

  const payments = await prisma.payment.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const access = accessState(tenant);
  const popularId = "BUSINESS";

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Subscription & billing"
        description="Manage your PERICO plan, payments, and renewals."
      />

      {/* Current status */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-accent-soft text-accent"><CreditCard className="size-5" /></span>
            <div>
              <p className="font-display text-lg font-semibold">{access.planName} plan</p>
              <p className="text-sm text-muted-foreground">
                {access.reason === "ok" && `Renews / ends ${tenant.currentPeriodEnd ? formatDate(tenant.currentPeriodEnd) : "—"}`}
                {access.reason === "trial" && `Trial — ${access.daysLeft} day${access.daysLeft !== 1 ? "s" : ""} left`}
                {access.reason === "trial_expired" && "Your free trial has ended"}
                {access.reason === "subscription_expired" && "Your subscription has expired"}
                {access.reason === "suspended" && "Account suspended"}
              </p>
            </div>
          </div>
          <Badge tone={access.active ? (access.onTrial ? "warning" : "success") : "danger"}>
            {access.active ? (access.onTrial ? "Trial active" : "Active") : "Inactive"}
          </Badge>
        </CardContent>
      </Card>

      {sp.paid && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" /> Payment received — your plan is active. Thank you!
        </div>
      )}
      {(sp.failed || sp.cancelled) && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <Clock className="size-4 shrink-0" /> Payment was {sp.cancelled ? "cancelled" : "not completed"}. You can try again below.
        </div>
      )}
      {!access.active && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <Clock className="size-4 shrink-0" />
          Your access is paused. Choose a plan below and complete payment to continue using PERICO.
        </div>
      )}

      <BillingPlans
        plans={PAID_PLANS.map((p) => ({ id: p.id, name: p.name, price: p.price, features: p.features, popular: p.id === popularId }))}
        currentPlan={tenant.plan}
        bkash={BILLING.bkash}
        nagad={BILLING.nagad}
        onlineEnabled={sslczConfigured()}
      />

      {/* Payment history */}
      <Card className="mt-8 overflow-hidden">
        <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
        <CardContent className="px-0">
          {payments.length ? (
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH className="pl-6">Date</TH>
                  <TH>Plan</TH>
                  <TH>Method</TH>
                  <TH>Reference</TH>
                  <TH className="text-right">Amount</TH>
                  <TH className="pr-6 text-right">Status</TH>
                </TR>
              </THead>
              <TBody>
                {payments.map((p) => (
                  <TR key={p.id}>
                    <TD className="pl-6 text-sm text-muted-foreground">{formatDate(p.createdAt)}</TD>
                    <TD className="font-medium">{p.plan}</TD>
                    <TD className="text-sm text-muted-foreground">{p.method === "MANUAL" ? "bKash/Nagad" : p.method}</TD>
                    <TD className="text-xs text-muted-foreground">{p.reference ?? "—"}</TD>
                    <TD className="tabular text-right">{formatBDT(p.amount)}</TD>
                    <TD className="pr-6 text-right">
                      <Badge tone={p.status === "PAID" ? "success" : p.status === "PENDING" ? "warning" : "danger"}>
                        {p.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3" /> Paid</span>
                        ) : p.status === "PENDING" ? "Pending review" : "Failed"}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No payments yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
