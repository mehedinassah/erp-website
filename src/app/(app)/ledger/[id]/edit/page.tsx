import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { type LedgerType } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { AccountForm } from "@/components/app/account-form";
import { updateAccount } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "MANAGER"]);
  const { id } = await params;
  const account = await prisma.ledgerAccount.findUnique({ where: { id } });
  if (!account) notFound();

  return (
    <div>
      <Link
        href={`/ledger/${account.id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> {account.shopName}
      </Link>
      <PageHeader eyebrow="Dena–Paona" title="Edit account" />
      <AccountForm
        mode="edit"
        type={account.type as LedgerType}
        action={updateAccount.bind(null, account.id)}
        defaults={{
          shopName: account.shopName,
          ownerName: account.ownerName,
          address: account.address,
          phone: account.phone,
          category: account.category,
          notes: account.notes,
          openingAmount: account.openingAmount,
          dueDate: account.dueDate
            ? account.dueDate.toISOString().slice(0, 10)
            : null,
        }}
      />
    </div>
  );
}
