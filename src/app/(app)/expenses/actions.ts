"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/enums";
import type { ActionState } from "@/lib/validation";

export async function createExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;

  const categoryRaw = String(formData.get("category") ?? "OTHER");
  const category = (EXPENSE_CATEGORIES as readonly string[]).includes(categoryRaw) ? categoryRaw : "OTHER";
  const amount = Math.trunc(Number(formData.get("amount") ?? 0));
  const note = String(formData.get("note") ?? "").trim() || null;
  const methodRaw = String(formData.get("method") ?? "");
  const method = (PAYMENT_METHODS as readonly string[]).includes(methodRaw) ? methodRaw : null;
  const spentRaw = String(formData.get("spentAt") ?? "").trim();
  const spentAt = spentRaw ? new Date(spentRaw) : new Date();

  if (amount <= 0) return { error: "Enter an amount greater than 0." };

  const expense = await prisma.expense.create({
    data: { tenantId, category, amount, note, method, spentAt, userId: session.userId },
  });

  await logAudit({
    tenantId,
    userId: session.userId,
    action: "CREATE",
    entity: "Expense",
    entityId: expense.id,
    entityRef: category,
    changes: { amount, category },
  });

  revalidatePath("/expenses");
  revalidatePath("/reports/pnl");
  return { ok: true };
}

export async function deleteExpense(id: string) {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  await prisma.expense.deleteMany({ where: { id, tenantId: session.tenantId } });
  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: "DELETE",
    entity: "Expense",
    entityId: id,
  });
  revalidatePath("/expenses");
  revalidatePath("/reports/pnl");
  redirect("/expenses?deleted=1");
}
