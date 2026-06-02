import { requireUser } from "@/lib/auth";
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
    >
      {children}
    </AppShell>
  );
}
