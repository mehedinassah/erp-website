import { requireUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/superadmin";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  return (
    <AppShell
      session={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
      isSuperAdmin={isSuperAdmin(session.email)}
    >
      {children}
    </AppShell>
  );
}
