import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const actionTone = (a: string) =>
  a === "CREATE" ? "success" : a === "DELETE" ? "danger" : "neutral";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; page?: string }>;
}) {
  const [session, sp] = await Promise.all([requireRole(["ADMIN"]), searchParams]);
  const { tenantId } = session;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const PER = 30;

  const where = {
    tenantId,
    ...(sp.entity ? { entity: sp.entity } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      include: { user: { select: { name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER));

  // Get distinct entity types for filter
  const entities = await prisma.auditLog.findMany({
    where: { tenantId },
    select: { entity: true },
    distinct: ["entity"],
    orderBy: { entity: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Audit log"
        description={`${total} recorded actions across your business.`}
      />

      <form className="mb-4 flex gap-2">
        <select name="entity" defaultValue={sp.entity ?? ""} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="">All entities</option>
          {entities.map((e) => (
            <option key={e.entity} value={e.entity}>{e.entity}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>

      <Card className="animate-rise overflow-hidden">
        {logs.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>When</TH>
                <TH>Action</TH>
                <TH>Entity</TH>
                <TH className="hidden sm:table-cell">Reference</TH>
                <TH className="hidden md:table-cell">By</TH>
                <TH className="hidden lg:table-cell">Changes</TH>
              </TR>
            </THead>
            <TBody>
              {logs.map((log) => (
                <TR key={log.id}>
                  <TD className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </TD>
                  <TD>
                    <Badge tone={actionTone(log.action)}>{log.action}</Badge>
                  </TD>
                  <TD className="text-sm font-medium">{log.entity}</TD>
                  <TD className="hidden sm:table-cell text-sm text-muted-foreground">
                    {log.entityRef ?? log.entityId.slice(0, 8) + "…"}
                  </TD>
                  <TD className="hidden md:table-cell text-sm text-muted-foreground">
                    {log.user?.name ?? "System"}
                  </TD>
                  <TD className="hidden lg:table-cell max-w-xs">
                    {log.changes ? (
                      <code className="text-xs text-muted-foreground break-all">
                        {log.changes.slice(0, 100)}{log.changes.length > 100 ? "…" : ""}
                      </code>
                    ) : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState icon={ShieldCheck} title="No audit logs yet" description="Actions will be logged here as your team uses the system." />
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Page {page} of {totalPages} · {total} entries</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?${sp.entity ? `entity=${sp.entity}&` : ""}page=${page - 1}`}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted">Previous</a>
            )}
            {page < totalPages && (
              <a href={`?${sp.entity ? `entity=${sp.entity}&` : ""}page=${page + 1}`}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
