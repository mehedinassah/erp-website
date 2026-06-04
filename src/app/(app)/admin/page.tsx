import { Building2, Users, CheckCircle2, Ban } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TenantRowActions } from "@/components/app/tenant-row-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireSuperAdmin();

  // Crosses ALL tenants — this is the platform-owner view.
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, products: true, salesOrders: true } },
    },
  });

  const total = tenants.length;
  const active = tenants.filter((t) => t.status === "ACTIVE").length;
  const suspended = total - active;
  const totalUsers = tenants.reduce((s, t) => s + t._count.users, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="All businesses"
        description="Every business using PERICO. Suspend, reactivate, or change plans here."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total businesses" value={String(total)} icon={Building2} delay={0} />
        <StatCard label="Active" value={String(active)} icon={CheckCircle2} tone="success" delay={60} />
        <StatCard label="Suspended" value={String(suspended)} icon={Ban} tone={suspended ? "danger" : "default"} delay={120} />
        <StatCard label="Total users" value={String(totalUsers)} icon={Users} delay={180} />
      </div>

      <Card className="mt-6 animate-rise overflow-hidden">
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Business</TH>
              <TH className="hidden sm:table-cell text-center">Users</TH>
              <TH className="hidden md:table-cell text-center">Products</TH>
              <TH className="hidden md:table-cell text-center">Sales</TH>
              <TH className="hidden sm:table-cell">Joined</TH>
              <TH className="text-center">Status</TH>
              <TH className="text-right">Plan & actions</TH>
            </TR>
          </THead>
          <TBody>
            {tenants.map((t) => (
              <TR key={t.id}>
                <TD>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </TD>
                <TD className="hidden sm:table-cell text-center tabular">{t._count.users}</TD>
                <TD className="hidden md:table-cell text-center tabular">{t._count.products}</TD>
                <TD className="hidden md:table-cell text-center tabular">{t._count.salesOrders}</TD>
                <TD className="hidden sm:table-cell text-muted-foreground">{formatDate(t.createdAt)}</TD>
                <TD className="text-center">
                  <Badge tone={t.status === "ACTIVE" ? "success" : "danger"}>
                    {t.status === "ACTIVE" ? "Active" : "Suspended"}
                  </Badge>
                </TD>
                <TD>
                  <TenantRowActions id={t.id} status={t.status} plan={t.plan} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
