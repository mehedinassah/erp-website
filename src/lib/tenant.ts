import { prisma } from "./prisma";

export type TenantProfile = {
  id: string;
  name: string;
  businessType: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  invoicePrefix: string;
  taxRatePct: number;
  taxLabel: string;
  currency: string;
  invoiceFooter: string | null;
};

/** Load the business profile for a tenant (for invoices, quotes, settings). */
export async function getTenantProfile(tenantId: string): Promise<TenantProfile | null> {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      businessType: true,
      legalName: true,
      email: true,
      phone: true,
      address: true,
      logoUrl: true,
      invoicePrefix: true,
      taxRatePct: true,
      taxLabel: true,
      currency: true,
      invoiceFooter: true,
    },
  });
}

/** Compute tax amount (whole taka) from a taxable base and a tenant's rate. */
export function computeTax(taxableBase: number, taxRatePct: number): number {
  if (!taxRatePct || taxRatePct <= 0) return 0;
  return Math.round((taxableBase * taxRatePct) / 100);
}
