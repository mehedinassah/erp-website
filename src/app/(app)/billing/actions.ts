"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { PLANS, type PlanId } from "@/lib/plans";
import { initSession, sslczConfigured } from "@/lib/sslcommerz";
import { getTenantProfile } from "@/lib/tenant";
import type { ActionState } from "@/lib/validation";

/** Start an online (SSLCommerz) payment; returns the gateway URL to redirect to. */
export async function startOnlinePayment(
  planId: string,
  months = 1,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  if (!sslczConfigured()) return { ok: false, error: "Online payment is not set up." };

  const plan = PLANS[planId as PlanId];
  if (!plan || planId === "TRIAL") return { ok: false, error: "Choose a valid plan." };
  const m = Math.min(12, Math.max(1, Math.trunc(months)));

  const payment = await prisma.payment.create({
    data: {
      tenantId,
      plan: planId,
      amount: plan.price * m,
      periodMonths: m,
      method: "SSLCOMMERZ",
      status: "PENDING",
    },
  });
  // Use the payment id as the gateway transaction id for easy lookup on callback.
  await prisma.payment.update({ where: { id: payment.id }, data: { gatewaySessionId: payment.id } });

  const biz = await getTenantProfile(tenantId);
  const result = await initSession({
    tranId: payment.id,
    amount: plan.price * m,
    planName: plan.name,
    customerName: biz?.name ?? session.name,
    customerEmail: biz?.email ?? session.email,
    customerPhone: biz?.phone ?? "",
  });

  if (!result.ok) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return { ok: false, error: result.error };
  }
  return { ok: true, url: result.url };
}

/** Record a manual bKash/Nagad payment; stays PENDING until an admin approves. */
export async function submitManualPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;

  const planId = String(formData.get("plan") ?? "") as PlanId;
  const plan = PLANS[planId];
  if (!plan || planId === "TRIAL") return { error: "Choose a valid plan." };

  const reference = String(formData.get("reference") ?? "").trim();
  if (reference.length < 4) return { error: "Enter the bKash/Nagad transaction ID." };

  const months = Math.min(12, Math.max(1, Math.trunc(Number(formData.get("months")) || 1)));

  // Prevent duplicate pending submissions for the same txn id
  const dupe = await prisma.payment.findFirst({
    where: { tenantId, reference, status: "PENDING" },
    select: { id: true },
  });
  if (dupe) return { error: "We already have a pending payment with that transaction ID." };

  const payment = await prisma.payment.create({
    data: {
      tenantId,
      plan: planId,
      amount: plan.price * months,
      periodMonths: months,
      method: "MANUAL",
      status: "PENDING",
      reference,
    },
  });

  await logAudit({
    tenantId,
    userId: session.userId,
    action: "CREATE",
    entity: "Payment",
    entityId: payment.id,
    entityRef: `${plan.name} (manual)`,
    changes: { amount: plan.price * months, reference },
  });

  revalidatePath("/billing");
  return { ok: true };
}
