import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { summarize, withRunningBalance } from "@/lib/ledger";
import { METHOD_LABEL, type PaymentMethod } from "@/lib/enums";

function esc(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const account = await prisma.ledgerAccount.findUnique({
    where: { id },
    include: {
      entries: { orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!account) return new Response("Not found", { status: 404 });

  const isPaona = account.type === "PAONA";
  const { billed, paid, remaining } = summarize(account.openingAmount, account.entries);
  const rows = withRunningBalance(account.openingAmount, account.entries);

  const lines: string[] = [];
  lines.push(`RONG — ${isPaona ? "Receivable (Paona)" : "Payable (Dena)"} statement`);
  lines.push(`Account,${esc(account.code)}`);
  lines.push(`Business,${esc(account.shopName)}`);
  if (account.ownerName) lines.push(`Owner,${esc(account.ownerName)}`);
  if (account.phone) lines.push(`Phone,${esc(account.phone)}`);
  if (account.address) lines.push(`Address,${esc(account.address)}`);
  lines.push(`Generated,${esc(new Date().toLocaleString("en-GB"))}`);
  lines.push("");
  lines.push("Amounts in BDT (Taka)");
  lines.push(`Total billed,${billed}`);
  lines.push(`Total paid,${paid}`);
  lines.push(`Remaining,${Math.max(0, remaining)}`);
  lines.push("");
  lines.push(["Date", "Type", "Method", "Note", "Amount", "Balance"].join(","));
  lines.push(
    [ymd(account.createdAt), "Opening balance", "", "", account.openingAmount, account.openingAmount].join(","),
  );
  for (const e of rows) {
    const type =
      e.kind === "CHARGE" ? "Due added" : isPaona ? "Collected" : "Paid";
    const signed = e.kind === "CHARGE" ? e.amount : -e.amount;
    lines.push(
      [
        ymd(e.occurredAt),
        type,
        e.method ? METHOD_LABEL[e.method as PaymentMethod] ?? e.method : "",
        esc(e.note),
        signed,
        e.balanceAfter,
      ].join(","),
    );
  }

  // BOM so Excel reads UTF-8 correctly
  const csv = "﻿" + lines.join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${account.code}-statement.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
