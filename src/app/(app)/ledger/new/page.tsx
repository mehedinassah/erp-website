import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { LEDGER_TYPES, type LedgerType } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { AccountForm } from "@/components/app/account-form";
import { createAccount } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireRole(["ADMIN", "MANAGER"]);
  const sp = await searchParams;
  const type = (LEDGER_TYPES.includes(sp.type as LedgerType)
    ? sp.type
    : "PAONA") as LedgerType;
  const isPaona = type === "PAONA";
  const backHref = isPaona ? "/ledger/paona" : "/ledger/dena";

  return (
    <div>
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> {isPaona ? "Paona" : "Dena"}
      </Link>
      <PageHeader
        eyebrow="Dena–Paona"
        title={isPaona ? "New receivable account" : "New payable account"}
        description={
          isPaona
            ? "Add a business that owes you money."
            : "Add a business you owe money to."
        }
      />
      <AccountForm mode="create" type={type} action={createAccount} />
    </div>
  );
}
