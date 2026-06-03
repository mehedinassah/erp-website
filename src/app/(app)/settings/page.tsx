import { TriangleAlert, CheckCircle2, Database } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import { resetTransactions, resetAllData } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const { tenantId } = session;
  const sp = await searchParams;

  const [products, variants, sales, purchases, suppliers, customers, units] =
    await Promise.all([
      prisma.product.count({ where: { tenantId } }),
      prisma.variant.count({ where: { product: { tenantId } } }),
      prisma.salesOrder.count({ where: { tenantId } }),
      prisma.purchaseOrder.count({ where: { tenantId } }),
      prisma.supplier.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.stockLevel.aggregate({ where: { variant: { product: { tenantId } } }, _sum: { quantity: true } }),
    ]);

  const stats = [
    { label: "Products", value: products },
    { label: "Variants", value: variants },
    { label: "Sales orders", value: sales },
    { label: "Purchase orders", value: purchases },
    { label: "Suppliers", value: suppliers },
    { label: "Customers", value: customers },
    { label: "Units in stock", value: units._sum.quantity ?? 0 },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Administrator tools for this workspace."
      />

      {sp.reset === "tx" && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-success animate-rise">
          <CheckCircle2 className="size-4" />
          Transactions cleared and stock reset to zero. Your catalogue was kept.
        </div>
      )}
      {sp.reset === "all" && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-success animate-rise">
          <CheckCircle2 className="size-4" />
          All business data wiped. You now have a clean workspace — start adding
          your real data.
        </div>
      )}

      {/* Current data */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4 text-muted-foreground" /> Current data
          </CardTitle>
          <CardDescription>What this workspace holds right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="tabular font-display text-2xl font-semibold">
                  {formatNumber(s.value)}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="size-4" /> Danger zone
          </CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone. Admin only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Clear transactions</p>
              <p className="text-sm text-muted-foreground">
                Deletes all sales orders, purchase orders and stock movements,
                and resets every stock level to 0. Keeps your products,
                suppliers and customers.
              </p>
            </div>
            <DeleteButton
              entity="all sales, purchases & stock movements"
              label="Clear transactions"
              confirmLabel="Clear transactions"
              description="Stock will be reset to zero. Your catalogue, suppliers and customers are kept."
              action={async () => {
                "use server";
                await resetTransactions();
              }}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Clear ALL data (fresh start)</p>
              <p className="text-sm text-muted-foreground">
                Wipes the entire catalogue, suppliers, customers and all
                transactions. Keeps only login users and warehouses so you can
                begin entering real data immediately.
              </p>
            </div>
            <DeleteButton
              entity="ALL business data"
              label="Clear everything"
              confirmLabel="Erase all data"
              description="This removes every product, variant, supplier, customer, order and movement. Login users and warehouses are kept."
              action={async () => {
                "use server";
                await resetAllData();
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Signed in as {session.email} (Administrator). Tip: you can re-seed
            the demo data anytime with{" "}
            <code className="rounded bg-muted px-1">npm run db:seed</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
