import Link from "next/link";
import { Plus, Users, Pencil, Phone, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatBDT } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await requireUser();
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      salesOrders: { select: { total: true } },
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Customers"
        description="Wholesale buyers, boutiques, and retail customers."
      >
        <Button asChild variant="gold">
          <Link href="/customers/new">
            <Plus className="size-4" /> New customer
          </Link>
        </Button>
      </PageHeader>

      <Card className="animate-rise overflow-hidden">
        {customers.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Customer</TH>
                <TH>Contact</TH>
                <TH className="text-center">Orders</TH>
                <TH className="text-right">Lifetime value</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {customers.map((c) => {
                const ltv = c.salesOrders.reduce((s, o) => s + o.total, 0);
                return (
                  <TR key={c.id}>
                    <TD>
                      <p className="font-medium">{c.name}</p>
                      {c.address && (
                        <p className="text-xs text-muted-foreground">{c.address}</p>
                      )}
                    </TD>
                    <TD>
                      <div className="space-y-0.5">
                        {c.phone && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3" /> {c.phone}
                          </p>
                        )}
                        {c.email && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3" /> {c.email}
                          </p>
                        )}
                        {!c.phone && !c.email && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TD>
                    <TD className="tabular text-center">{c.salesOrders.length}</TD>
                    <TD className="tabular text-right font-medium">
                      {formatBDT(ltv)}
                    </TD>
                    <TD className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/customers/${c.id}/edit`}>
                          <Pencil className="size-3.5" /> Edit
                        </Link>
                      </Button>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Add a customer or create a walk-in sale."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
