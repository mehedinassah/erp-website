import { PLANS, type PlanId } from "./plans";

export type TenantBilling = {
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
};

export type AccessState = {
  active: boolean;
  reason: "ok" | "trial" | "trial_expired" | "subscription_expired" | "suspended";
  onTrial: boolean;
  daysLeft: number; // days until access ends (trial or paid period)
  planName: string;
};

const DAY = 86400000;

/** Compute whether a tenant currently has access, and why. */
export function accessState(t: TenantBilling, now = Date.now()): AccessState {
  const planName = PLANS[(t.plan as PlanId)]?.name ?? t.plan;

  if (t.status === "SUSPENDED") {
    return { active: false, reason: "suspended", onTrial: false, daysLeft: 0, planName };
  }

  // Paid plan: access governed by currentPeriodEnd
  if (t.plan !== "TRIAL") {
    const end = t.currentPeriodEnd?.getTime() ?? 0;
    const active = end > now;
    return {
      active,
      reason: active ? "ok" : "subscription_expired",
      onTrial: false,
      daysLeft: active ? Math.ceil((end - now) / DAY) : 0,
      planName,
    };
  }

  // Trial plan
  const trialEnd = t.trialEndsAt?.getTime() ?? 0;
  const active = trialEnd > now;
  return {
    active,
    reason: active ? "trial" : "trial_expired",
    onTrial: true,
    daysLeft: active ? Math.ceil((trialEnd - now) / DAY) : 0,
    planName,
  };
}
