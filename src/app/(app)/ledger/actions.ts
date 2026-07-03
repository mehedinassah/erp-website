"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  LEDGER_TYPES,
  ENTRY_KINDS,
  PAYMENT_METHODS,
  type LedgerType,
} from "@/lib/enums";
import type { ActionState } from "@/lib/validation";

const MANAGER = ["ADMIN", "MANAGER"] as const;

function text(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) ?? "").trim();
  return v ? v : null;
}
function int(fd: FormData, key: string): number {
  return Math.max(0, Math.trunc(Number(fd.get(key)) || 0));
}

async function nextCode(type: LedgerType, tenantId: string) {
  const prefix = type === "PAONA" ? "P" : "D";
  const count = await prisma.ledgerAccount.count({ where: { type, tenantId } });
  return `${prefix}-${1001 + count}`;
}

export async function createAccount(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const session = await requireRole([...MANAGER]);
  const { tenantId } = session;

  const type = String(fd.get("type") ?? "") as LedgerType;
  const shopName = text(fd, "shopName");
  if (!LEDGER_TYPES.includes(type)) return { error: "Invalid account type." };
  if (!shopName) return { error: "Shop / business name is required.", fieldErrors: { shopName: "Required" } };

  const due = text(fd, "dueDate");
  const account = await prisma.ledgerAccount.create({
    data: {
      code: await nextCode(type, tenantId),
      type,
      shopName,
      ownerName: text(fd, "ownerName"),
      address: text(fd, "address"),
      phone: text(fd, "phone"),
      category: text(fd, "category"),
      notes: text(fd, "notes"),
      openingAmount: int(fd, "openingAmount"),
      dueDate: due ? new Date(due) : null,
      tenantId,
    },
  });

  revalidatePath("/ledger");
  redirect(`/ledger/${account.id}`);
}

export async function updateAccount(
  id: string,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const session = await requireRole([...MANAGER]);
  const { tenantId } = session;

  const shopName = text(fd, "shopName");
  if (!shopName) return { error: "Shop / business name is required.", fieldErrors: { shopName: "Required" } };

  const due = text(fd, "dueDate");
  await prisma.ledgerAccount.update({
    where: { id, tenantId },
    data: {
      shopName,
      ownerName: text(fd, "ownerName"),
      address: text(fd, "address"),
      phone: text(fd, "phone"),
      category: text(fd, "category"),
      notes: text(fd, "notes"),
      openingAmount: int(fd, "openingAmount"),
      dueDate: due ? new Date(due) : null,
    },
  });

  revalidatePath("/ledger");
  revalidatePath(`/ledger/${id}`);
  redirect(`/ledger/${id}`);
}

export async function deleteAccount(id: string) {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  const acc = await prisma.ledgerAccount.findFirst({ where: { id, tenantId } });
  if (!acc) return;
  await prisma.ledgerAccount.delete({ where: { id } }); // cascades entries
  revalidatePath("/ledger");
  redirect(acc?.type === "DENA" ? "/ledger/dena" : "/ledger/paona");
}

export async function addEntry(
  ledgerId: string,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const session = await requireRole([...MANAGER]);

  const kind = String(fd.get("kind") ?? "PAYMENT");
  const amount = int(fd, "amount");
  const method = String(fd.get("method") ?? "CASH");
  const occurred = text(fd, "occurredAt");

  if (!ENTRY_KINDS.includes(kind as never))
    return { error: "Invalid entry type." };
  if (amount <= 0) return { error: "Enter an amount greater than zero." };

  // Tenant guard: the target account must belong to the caller's tenant.
  const account = await prisma.ledgerAccount.findFirst({
    where: { id: ledgerId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!account) return { error: "Account not found." };

  await prisma.ledgerEntry.create({
    data: {
      ledgerId,
      kind,
      amount,
      method: kind === "PAYMENT" && PAYMENT_METHODS.includes(method as never) ? method : null,
      note: text(fd, "note"),
      occurredAt: occurred ? new Date(occurred) : new Date(),
      userId: session.userId,
    },
  });

  revalidatePath(`/ledger/${ledgerId}`);
  revalidatePath("/ledger");
  return { ok: true };
}

export async function updateEntry(
  entryId: string,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const session = await requireRole([...MANAGER]);
  const amount = int(fd, "amount");
  if (amount <= 0) return { error: "Enter an amount greater than zero." };

  // Tenant guard: the entry's account must belong to the caller's tenant.
  const owned = await prisma.ledgerEntry.findFirst({
    where: { id: entryId, ledger: { tenantId: session.tenantId } },
    select: { id: true },
  });
  if (!owned) return { error: "Entry not found." };

  const entry = await prisma.ledgerEntry.update({
    where: { id: entryId },
    data: {
      amount,
      method: text(fd, "method"),
      note: text(fd, "note"),
      occurredAt: text(fd, "occurredAt")
        ? new Date(String(fd.get("occurredAt")))
        : undefined,
    },
  });

  revalidatePath(`/ledger/${entry.ledgerId}`);
  revalidatePath("/ledger");
  return { ok: true };
}

export async function deleteEntry(id: string) {
  const session = await requireRole(["ADMIN"]);
  // Tenant guard: only delete an entry whose account belongs to this tenant.
  const entry = await prisma.ledgerEntry.findFirst({
    where: { id, ledger: { tenantId: session.tenantId } },
  });
  if (!entry) return;
  await prisma.ledgerEntry.delete({ where: { id } });
  revalidatePath(`/ledger/${entry.ledgerId}`);
  revalidatePath("/ledger");
}
