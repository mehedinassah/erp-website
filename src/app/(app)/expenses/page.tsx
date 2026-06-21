import { Wallet, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { canDelete } from "@/lib/permissions";
import { formatBDT, formatDate } from "@/lib/format";
import { EXPENSE_CATEGORY_LABEL, METHOD_LABEL, type ExpenseCategory, type PaymentMethod } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { ExpenseForm } from "@/components/app/expense-form";
import { deleteExpense } from "./actions";

export const dynamic = "force-dynamic";

const DAY = 86400000;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const [session, sp] = await Promise.all([requireRole(["ADMIN", "MANAGER"]), searchParams]);
  const { tenantId } = session;
  const monthAgo = new Date(Date.now() - 30 * DAY);

  const [expenses, monthAgg] = await Promise.all([
    prisma.expense.findMany({ where: { tenantId }, orderBy: { spentAt: "desc" }, take: 100 }),
    prisma.expense.aggregate({ where: { tenantId, spentAt: { gte: monthAgo } }, _sum: { amount: true } }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Expenses"
        description="Record your operating costs so your Profit & Loss reflects real profit."
      />

      {sp.deleted && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-success animate-rise">
          <CheckCircle2 className="size-4" /> Expense deleted.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="mb-4 p-4">
            <p className="text-xs text-muted-foreground">Last 30 days</p>
            <p className="tabular mt-1 font-display text-2xl font-semibold">{formatBDT(monthAgg._sum.amount ?? 0)}</p>
          </Card>
          <Card className="animate-rise overflow-hidden">
            {expenses.length ? (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Date</TH>
                    <TH>Category</TH>
                    <TH className="hidden sm:table-cell">Note</TH>
                    <TH className="text-right">Amount</TH>
                    {canDelete(session.role) && <TH className="pr-4 text-right"></TH>}
                  </TR>
                </THead>
                <TBody>
                  {expenses.map((e) => (
                    <TR key={e.id}>
                      <TD className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(e.spentAt)}</TD>
                      <TD>
                        <Badge tone="neutral">{EXPENSE_CATEGORY_LABEL[e.category as ExpenseCategory] ?? e.category}</Badge>
                        {e.method && <span className="ml-2 text-xs text-muted-foreground">{METHOD_LABEL[e.method as PaymentMethod] ?? e.method}</span>}
                      </TD>
                      <TD className="hidden sm:table-cell text-sm text-muted-foreground">{e.note ?? "—"}</TD>
                      <TD className="tabular text-right font-medium">{formatBDT(e.amount)}</TD>
                      {canDelete(session.role) && (
                        <TD className="pr-4 text-right">
                          <DeleteButton
                            entity="expense"
                            name={`${EXPENSE_CATEGORY_LABEL[e.category as ExpenseCategory] ?? e.category} · ${formatBDT(e.amount)}`}
                            action={async () => {
                              "use server";
                              await deleteExpense(e.id);
                            }}
                          />
                        </TD>
                      )}
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <div className="p-4">
                <EmptyState icon={Wallet} title="No expenses yet" description="Record your first expense on the right." />
              </div>
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add expense</CardTitle>
            <CardDescription>Rent, salary, utilities, and other costs.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
