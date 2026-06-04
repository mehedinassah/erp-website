import Link from "next/link";
import { Plus, Warehouse as WarehouseIcon, Pencil, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canManageCatalog } from "@/lib/permissions";
import { setDefaultWarehouse } from "./actions";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function WarehousesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const [session, sp] = await Promise.all([requireUser(), searchParams]);
  const { tenantId } = session;
  const manage = canManageCatalog(session.role);

  const warehouses = await prisma.warehouse.findMany({
    where: { tenantId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    include: { _count: { select: { stockLevels: true } } },
  });

  const errorMsg =
    sp.error === "last"
      ? "You can't delete your only warehouse — every business needs at least one."
      : sp.error === "in-use"
        ? "That warehouse holds stock or has orders. It can't be deleted."
        : null;

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Warehouses"
        description="Stores and stock locations. Sales and stock are tracked per warehouse."
      >
        {manage && (
          <Button asChild variant="gold">
            <Link href="/warehouses/new">
              <Plus className="size-4" /> New warehouse
            </Link>
          </Button>
        )}
      </PageHeader>

      {errorMsg && (
        <div className="mb-4 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      <Card className="animate-rise overflow-hidden">
        {warehouses.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Warehouse</TH>
                <TH className="hidden sm:table-cell">Code</TH>
                <TH className="text-center">Default</TH>
                {manage && <TH className="text-right">Actions</TH>}
              </TR>
            </THead>
            <TBody>
              {warehouses.map((w) => (
                <TR key={w.id}>
                  <TD>
                    <p className="font-medium">{w.name}</p>
                    {w.address && (
                      <p className="text-xs text-muted-foreground">{w.address}</p>
                    )}
                  </TD>
                  <TD className="hidden sm:table-cell">
                    <Badge tone="neutral">{w.code}</Badge>
                  </TD>
                  <TD className="text-center">
                    {w.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                        <Star className="size-3.5 fill-accent" /> Default
                      </span>
                    ) : manage ? (
                      <form
                        action={async () => {
                          "use server";
                          await setDefaultWarehouse(w.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                          Set default
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TD>
                  {manage && (
                    <TD className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/warehouses/${w.id}/edit`}>
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
              icon={WarehouseIcon}
              title="No warehouses yet"
              description="Add a warehouse so you can track stock and record sales."
            >
              {manage && (
                <Button asChild variant="gold">
                  <Link href="/warehouses/new">
                    <Plus className="size-4" /> New warehouse
                  </Link>
                </Button>
              )}
            </EmptyState>
          </div>
        )}
      </Card>
    </div>
  );
}
