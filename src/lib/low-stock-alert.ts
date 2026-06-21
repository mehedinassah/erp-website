"use server";

import { prisma } from "./prisma";
import { sendLowStockAlert, emailConfigured } from "./email";

/**
 * After any stock-out operation, check if any variants in this tenant are now
 * at or below their threshold and fire an email to the admin(s).
 * Fire-and-forget — never throws, never blocks the calling action.
 */
export async function checkAndAlertLowStock(tenantId: string) {
  if (!emailConfigured()) return;

  try {
    // Find all variants where total stock across all warehouses ≤ lowStockThreshold
    const variants = await prisma.variant.findMany({
      where: { product: { tenantId } },
      include: {
        product: true,
        stockLevels: true,
      },
    });

    const alerts = variants
      .map((v) => {
        const totalQty = v.stockLevels.reduce((s, sl) => s + sl.quantity, 0);
        return { v, totalQty };
      })
      .filter(({ v, totalQty }) => totalQty <= v.lowStockThreshold)
      .map(({ v, totalQty }) => ({
        label: `${v.product.name} · ${v.size}/${v.color}`,
        sku: v.sku,
        qty: totalQty,
        threshold: v.lowStockThreshold,
      }));

    if (alerts.length === 0) return;

    // Get admin email(s) for this tenant
    const admins = await prisma.user.findMany({
      where: { tenantId, role: "ADMIN", active: true },
      select: { email: true },
    });
    if (admins.length === 0) return;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    for (const admin of admins) {
      await sendLowStockAlert({
        to: admin.email,
        businessName: tenant?.name ?? "Your business",
        alerts,
      });
    }
  } catch {
    // Never crash the caller
  }
}
