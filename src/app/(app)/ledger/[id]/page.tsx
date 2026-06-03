import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Pencil,
  Phone,
  MapPin,
  CalendarClock,
  Tag,
  Download,
  HandCoins,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canManageLedger, canDelete } from "@/lib/permissions";
import { formatTaka, formatDate } from "@/lib/format";
import { summarize, withRunningBalance } from "@/lib/ledger";
import { METHOD_LABEL, type PaymentMethod, type LedgerType } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { PrintButton } from "@/components/app/print-button";
import { EntryDialog } from "@/components/app/entry-dialog";
import { ReminderButtons } from "@/components/app/reminder-buttons";
import { deleteAccount } from "../actions";

export const dynamic = "force-dynamic";

export default async function AccountProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([requireUser(), params]);

  const account = await prisma.ledgerAccount.findUnique({
    where: { id },
    include: {
      entries: { orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!account) notFound();

  const type = account.type as LedgerType;
  const isPaona = type === "PAONA";
  const manage = canManageLedger(session.role);
  const allowDelete = canDelete(session.role);

  const { billed, paid, remaining } = summarize(
    account.openingAmount,
    account.entries,
  );
  // Oldest → newest: opening balance first, latest transaction last.
  const ledgerRows = withRunningBalance(account.openingAmount, account.entries);
  const payments = account.entries.filter((e) => e.kind === "PAYMENT");
  const lastPayment = payments.length ? payments[payments.length - 1] : null;
  const accent = isPaona ? "text-success" : "text-warning";
  const backHref = isPaona ? "/ledger/paona" : "/ledger/dena";

  const reminderMsg = `Assalamu Alaikum. Our records (RONG) show an outstanding balance of ${formatTaka(
    remaining,
  )} on account ${account.code}${
    account.shopName ? ` (${account.shopName})` : ""
  }. Kindly arrange the payment. Thank you.`;

  return (
    <div>
      {/* Toolbar */}
      <div className="print:hidden">
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> {isPaona ? "Paona" : "Dena"}
        </Link>

        <PageHeader
          eyebrow={`${account.code} · ${isPaona ? "Receivable" : "Payable"}`}
          title={account.shopName}
          description={account.ownerName ?? undefined}
        >
          <Button asChild variant="outline">
            <a href={`/ledger/${account.id}/statement`} download>
              <Download className="size-4" /> Download CSV
            </a>
          </Button>
          <PrintButton label="Print / PDF" />
          {manage && (
            <>
              <Button asChild variant="outline">
                <Link href={`/ledger/${account.id}/edit`}>
                  <Pencil className="size-4" /> Edit
                </Link>
              </Button>
              <EntryDialog mode="add" ledgerType={type} ledgerId={account.id} />
            </>
          )}
          {allowDelete && (
            <DeleteButton
              entity="account"
              name={account.shopName}
              description="Removes the business and its entire transaction history."
              action={async () => {
                "use server";
                await deleteAccount(account.id);
              }}
            />
          )}
        </PageHeader>
      </div>

      {/* Print-only header */}
      <div className="mb-4 hidden print:block">
        <h1 className="font-display text-2xl font-semibold">
          RONG — {isPaona ? "Receivable" : "Payable"} statement
        </h1>
        <p className="text-sm">
          {account.shopName} · {account.code} · Generated {formatDate(new Date())}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total billed</p>
          <p className="tabular mt-1 font-display text-2xl font-semibold">{formatTaka(billed)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total paid</p>
          <p className="tabular mt-1 font-display text-2xl font-semibold">{formatTaka(paid)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">
            {isPaona ? "Remaining to collect" : "Remaining to pay"}
          </p>
          <p className={`tabular mt-1 font-display text-2xl font-semibold ${remaining > 0 ? accent : "text-muted-foreground"}`}>
            {formatTaka(Math.max(0, remaining))}
          </p>
          <div className="mt-1">
            <Badge tone={remaining > 0 ? "warning" : "success"}>
              {remaining > 0 ? "Pending" : "Cleared"}
            </Badge>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {account.phone && (
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" /> {account.phone}
              </p>
            )}
            {account.address && (
              <p className="flex items-start gap-2">
                <MapPin className="size-4 shrink-0 text-muted-foreground" /> {account.address}
              </p>
            )}
            {account.category && (
              <p className="flex items-center gap-2">
                <Tag className="size-4 text-muted-foreground" /> {account.category}
              </p>
            )}
            {account.dueDate && (
              <p className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" /> Due {formatDate(account.dueDate)}
              </p>
            )}
            {lastPayment && (
              <p className="flex items-center gap-2">
                <HandCoins className="size-4 text-success" />
                Last {isPaona ? "collection" : "payment"}:{" "}
                <span className="font-medium">{formatTaka(lastPayment.amount)}</span>
                <span className="text-muted-foreground">· {formatDate(lastPayment.occurredAt)}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Opened {formatDate(account.createdAt)}
            </p>
            {account.notes && (
              <p className="hairline pt-3 text-muted-foreground">{account.notes}</p>
            )}

            {isPaona && remaining > 0 && (
              <div className="hairline pt-4 print:hidden">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Send a due reminder
                </p>
                <ReminderButtons phone={account.phone} message={reminderMsg} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ledger */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaction ledger</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH className="pl-6">Date</TH>
                  <TH>Detail</TH>
                  <TH className="text-right">Amount</TH>
                  <TH className="pr-6 text-right">Balance</TH>
                  {manage && <TH className="w-10 pr-4 print:hidden" />}
                </TR>
              </THead>
              <TBody>
                {/* Opening row */}
                <TR className="hover:bg-transparent">
                  <TD className="pl-6 text-muted-foreground">{formatDate(account.createdAt)}</TD>
                  <TD className="font-medium">Opening balance</TD>
                  <TD className="tabular text-right text-muted-foreground">{formatTaka(account.openingAmount)}</TD>
                  <TD className="tabular pr-6 text-right">{formatTaka(account.openingAmount)}</TD>
                  {manage && <TD className="print:hidden" />}
                </TR>
                {ledgerRows.map((e) => {
                  const isCharge = e.kind === "CHARGE";
                  return (
                    <TR key={e.id}>
                      <TD className="pl-6 text-muted-foreground">{formatDate(e.occurredAt)}</TD>
                      <TD>
                        <span className="inline-flex items-center gap-2">
                          <Badge tone={isCharge ? "neutral" : isPaona ? "success" : "warning"}>
                            {isCharge ? "Due added" : isPaona ? "Collected" : "Paid"}
                          </Badge>
                          {e.method && (
                            <span className="text-xs text-muted-foreground">
                              {METHOD_LABEL[e.method as PaymentMethod] ?? e.method}
                            </span>
                          )}
                        </span>
                        {e.note && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{e.note}</p>
                        )}
                      </TD>
                      <TD className={`tabular text-right font-medium ${isCharge ? "text-muted-foreground" : isPaona ? "text-success" : "text-warning"}`}>
                        {isCharge ? "+" : "−"}
                        {formatTaka(e.amount)}
                      </TD>
                      <TD className="tabular pr-6 text-right">{formatTaka(e.balanceAfter)}</TD>
                      {manage && (
                        <TD className="pr-4 text-right print:hidden">
                          <EntryDialog
                            mode="edit"
                            ledgerType={type}
                            canDelete={allowDelete}
                            entry={{
                              id: e.id,
                              kind: e.kind,
                              amount: e.amount,
                              method: e.method,
                              note: e.note,
                              occurredAt: e.occurredAt.toISOString().slice(0, 10),
                            }}
                          />
                        </TD>
                      )}
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
