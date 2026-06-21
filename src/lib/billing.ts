import { prisma } from "./prisma";

/** Add N months to the later of "now" or an existing period end. */
export function extendPeriod(from: Date | null, months: number): Date {
  const base = from && from.getTime() > Date.now() ? new Date(from) : new Date();
  base.setMonth(base.getMonth() + months);
  return base;
}

/**
 * Mark a payment PAID and activate the tenant's plan. Idempotent — does nothing
 * if the payment is already paid or missing. Used by both the super-admin manual
 * approval and the SSLCommerz callback/IPN.
 */
export async function activatePayment(paymentId: string, reference?: string): Promise<boolean> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === "PAID") return false;

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { id: payment.tenantId },
      select: { currentPeriodEnd: true },
    });
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "PAID", paidAt: new Date(), ...(reference ? { reference } : {}) },
    });
    await tx.tenant.update({
      where: { id: payment.tenantId },
      data: {
        plan: payment.plan,
        status: "ACTIVE",
        currentPeriodEnd: extendPeriod(tenant?.currentPeriodEnd ?? null, payment.periodMonths),
      },
    });
  });
  return true;
}
