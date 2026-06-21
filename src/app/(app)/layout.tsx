import { requireUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/superadmin";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { businessType: true },
  });
  return (
    <AppShell
      session={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
      businessType={tenant?.businessType ?? "CLOTHING"}
      isSuperAdmin={isSuperAdmin(session.email)}
    >
      {children}
    </AppShell>
  );
}
