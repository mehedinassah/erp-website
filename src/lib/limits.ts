import { prisma } from "./prisma";
import { planLimits, formatLimit, PLANS, type PlanId } from "./plans";

/** Returns an error string if the tenant has hit its warehouse limit, else null. */
export async function checkWarehouseLimit(tenantId: string): Promise<string | null> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true } });
  const limit = planLimits(tenant?.plan ?? "TRIAL").warehouses;
  if (limit === Infinity) return null;
  const used = await prisma.warehouse.count({ where: { tenantId } });
  if (used >= limit) {
    const planName = PLANS[(tenant?.plan as PlanId)]?.name ?? "current";
    return `Your ${planName} plan allows ${formatLimit(limit)} warehouse${limit > 1 ? "s" : ""}. Upgrade your plan to add more.`;
  }
  return null;
}

/** Returns an error string if the tenant has hit its user limit, else null. */
export async function checkUserLimit(tenantId: string): Promise<string | null> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true } });
  const limit = planLimits(tenant?.plan ?? "TRIAL").users;
  if (limit === Infinity) return null;
  const used = await prisma.user.count({ where: { tenantId } });
  if (used >= limit) {
    const planName = PLANS[(tenant?.plan as PlanId)]?.name ?? "current";
    return `Your ${planName} plan allows ${formatLimit(limit)} user${limit > 1 ? "s" : ""}. Upgrade your plan to add more.`;
  }
  return null;
}
