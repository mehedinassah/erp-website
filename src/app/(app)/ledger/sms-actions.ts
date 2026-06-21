"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { summarize } from "@/lib/ledger";
import { sendSMS, smsConfigured } from "@/lib/sms";
import { getTenantProfile } from "@/lib/tenant";
import { formatTaka } from "@/lib/format";
import { logAudit } from "@/lib/audit";

function reminderText(businessName: string, shopName: string, remaining: number) {
  return `Assalamu Alaikum${shopName ? ` ${shopName}` : ""}. Our records show an outstanding balance of ${formatTaka(remaining)} at ${businessName}. Kindly arrange the payment. Thank you.`;
}

/** Send a single due-reminder SMS to one ledger account. */
export async function sendSmsReminder(accountId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  if (!smsConfigured()) return { ok: false, error: "SMS gateway is not set up. Add SMS_API_URL / SMS_API_KEY / SMS_SENDER in Vercel." };

  const account = await prisma.ledgerAccount.findFirst({
    where: { id: accountId, tenantId: session.tenantId },
    include: { entries: { select: { kind: true, amount: true } } },
  });
  if (!account) return { ok: false, error: "Account not found." };
  if (!account.phone) return { ok: false, error: "This account has no phone number." };

  const { remaining } = summarize(account.openingAmount, account.entries);
  if (remaining <= 0) return { ok: false, error: "Nothing outstanding to remind about." };

  const biz = await getTenantProfile(session.tenantId);
  const result = await sendSMS(account.phone, reminderText(biz?.name ?? "our shop", account.shopName, remaining));

  if (result.ok) {
    await logAudit({
      tenantId: session.tenantId,
      userId: session.userId,
      action: "UPDATE",
      entity: "LedgerAccount",
      entityId: accountId,
      entityRef: account.code,
      changes: { smsReminderSent: formatTaka(remaining) },
    });
  }
  return result;
}

/** Blast reminders to every Paona (receivable) account with a balance + phone. */
export async function sendAllDueReminders(): Promise<{ ok: boolean; sent: number; failed: number; error?: string }> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  if (!smsConfigured()) return { ok: false, sent: 0, failed: 0, error: "SMS gateway is not set up." };

  const accounts = await prisma.ledgerAccount.findMany({
    where: { tenantId: session.tenantId, type: "PAONA", phone: { not: null } },
    include: { entries: { select: { kind: true, amount: true } } },
  });
  const biz = await getTenantProfile(session.tenantId);

  let sent = 0;
  let failed = 0;
  for (const a of accounts) {
    const { remaining } = summarize(a.openingAmount, a.entries);
    if (remaining <= 0 || !a.phone) continue;
    const r = await sendSMS(a.phone, reminderText(biz?.name ?? "our shop", a.shopName, remaining));
    if (r.ok) sent++;
    else failed++;
  }

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "UPDATE",
    entity: "LedgerAccount",
    entityId: "bulk",
    entityRef: "Bulk SMS reminders",
    changes: { sent, failed },
  });

  return { ok: true, sent, failed };
}
