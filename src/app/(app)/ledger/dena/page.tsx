import { requireUser } from "@/lib/auth";
import { LedgerListView } from "@/components/app/ledger-list-view";

export const dynamic = "force-dynamic";

export default async function DenaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const [session, sp] = await Promise.all([requireUser(), searchParams]);
  return <LedgerListView type="DENA" sp={sp} role={session.role} tenantId={session.tenantId} />;
}
