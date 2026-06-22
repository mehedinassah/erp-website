// Single source of truth for plans, prices, and limits — used by the landing
// pricing section, the billing page, and limit enforcement.

export const PLAN_IDS = ["TRIAL", "STARTER", "BUSINESS", "PRO"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type PlanDef = {
  id: PlanId;
  name: string;
  price: number; // BDT / month
  warehouses: number; // Infinity = unlimited
  users: number;
  aiSupport: boolean; // AI Customer-Support widget (Helpdeck) — PRO only
  features: string[];
};

export const PLANS: Record<PlanId, PlanDef> = {
  TRIAL: {
    id: "TRIAL",
    name: "Trial",
    price: 0,
    warehouses: 3,
    users: 5,
    aiSupport: false,
    features: ["Full access during trial"],
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    price: 1500,
    warehouses: 1,
    users: 2,
    aiSupport: false,
    features: ["1 warehouse", "2 users", "Inventory + POS", "Dena–Paona ledger"],
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    price: 3500,
    warehouses: 3,
    users: 5,
    aiSupport: false,
    features: ["3 warehouses", "5 users", "Everything in Starter", "Profit reports", "Bulk import"],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    price: 6000,
    warehouses: Infinity,
    users: Infinity,
    aiSupport: true,
    features: [
      "Unlimited warehouses",
      "Unlimited users",
      "Everything in Business",
      "AI Customer-Support widget",
      "Priority support",
    ],
  },
};

/** Paid plans (excludes TRIAL) for pricing/checkout UIs. */
export const PAID_PLANS: PlanDef[] = [PLANS.STARTER, PLANS.BUSINESS, PLANS.PRO];

export const TRIAL_DAYS = 14;

export function planLimits(plan: string): { warehouses: number; users: number } {
  const p = PLANS[(plan as PlanId)] ?? PLANS.TRIAL;
  return { warehouses: p.warehouses, users: p.users };
}

export function formatLimit(n: number): string {
  return n === Infinity ? "Unlimited" : String(n);
}

/** Whether a plan includes the AI Customer-Support widget (Helpdeck). */
export function planHasAISupport(plan: string): boolean {
  return PLANS[(plan as PlanId)]?.aiSupport ?? false;
}
