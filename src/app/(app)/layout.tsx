import { requireUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/superadmin";
import { prisma } from "@/lib/prisma";
import { accessState } from "@/lib/subscription";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { businessType: true, plan: true, status: true, trialEndsAt: true, currentPeriodEnd: true },
  });
  const superAdmin = isSuperAdmin(session.email);
  const access = tenant
    ? accessState(tenant)
    : { active: true, reason: "ok" as const, onTrial: false, daysLeft: 0, planName: "" };

  return (
    <AppShell
      session={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
      businessType={tenant?.businessType ?? "CLOTHING"}
      isSuperAdmin={superAdmin}
      access={{
        // Super-admins (platform owner) are never locked out.
        locked: !superAdmin && !access.active,
        onTrial: access.onTrial,
        daysLeft: access.daysLeft,
        planName: access.planName,
        reason: access.reason,
      }}
    >
      {children}
    </AppShell>
  );
}
