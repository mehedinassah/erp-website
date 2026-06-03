import Link from "next/link";
import { Plus, Factory, Pencil, Phone, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, canManage } from "@/lib/auth";
import { canDelete } from "@/lib/permissions";
import { ClearButton } from "@/components/app/clear-button";
import { clearSuppliers } from "../clear-actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const session = await requireUser();
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { purchaseOrders: true } } },
  });
  const manage = canManage(session.role);

  return (
    <div>
      <PageHeader
        eyebrow="Purchasing"
        title="Suppliers"
        description="Mills, weavers, and importers that supply the RONG catalogue."
      >
        {manage && (
          <Button asChild variant="gold">
            <Link href="/suppliers/new">
              <Plus className="size-4" /> New supplier
            </Link>
          </Button>
        )}
        {canDelete(session.role) && (
          <ClearButton
            action={clearSuppliers}
            entity="all suppliers"
            description="Deletes every supplier and their purchase orders. Products are kept."
          />
        )}
      </PageHeader>

      <Card className="animate-rise overflow-hidden">
        {suppliers.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Supplier</TH>
                <TH className="hidden sm:table-cell">Contact</TH>
                <TH className="hidden sm:table-cell text-center">Orders</TH>
                {manage && <TH className="text-right">Actions</TH>}
              </TR>
            </THead>
            <TBody>
              {suppliers.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <p className="font-medium">{s.name}</p>
                    {s.address && (
                      <p className="text-xs text-muted-foreground">{s.address}</p>
                    )}
                  </TD>
                  <TD className="hidden sm:table-cell">
                    <div className="space-y-0.5 text-sm">
                      {s.contactName && <p>{s.contactName}</p>}
                      {s.phone && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="size-3" /> {s.phone}
                        </p>
                      )}
                      {s.email && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="size-3" /> {s.email}
                        </p>
                      )}
                    </div>
                  </TD>
                  <TD className="hidden sm:table-cell text-center">
                    <Badge tone="neutral">{s._count.purchaseOrders}</Badge>
                  </TD>
                  {manage && (
                    <TD className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/suppliers/${s.id}/edit`}>
                          <Pencil className="size-3.5" /> Edit
                        </Link>
                      </Button>
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Factory}
              title="No suppliers yet"
              description="Add a supplier to start raising purchase orders."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
