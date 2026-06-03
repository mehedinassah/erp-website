import Link from "next/link";
import { ChevronLeft, Users, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserAddForm } from "@/components/app/user-add-form";
import { UserEditDialog } from "@/components/app/user-edit-dialog";

export const dynamic = "force-dynamic";

const roleTone = (r: string) =>
  r === "ADMIN" ? "gold" : r === "MANAGER" ? "info" : "neutral";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const sp = await searchParams;

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="max-w-4xl">
      <Link
        href="/settings"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Settings
      </Link>
      <PageHeader
        eyebrow="System"
        title="Users & access"
        description="Create accounts for your team. Each person logs in with the email and password you set here, and gets the role you assign."
      />

      {sp.deleted && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-success animate-rise">
          <CheckCircle2 className="size-4" /> User removed.
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add a user</CardTitle>
          <CardDescription>
            Assign Manager or Staff a login. Managers can edit; Staff handle daily
            operations. Only admins manage users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAddForm />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Team ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH className="pl-6">Name</TH>
                <TH>Email</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH className="pr-6 text-right">Edit</TH>
              </TR>
            </THead>
            <TBody>
              {users.map((u) => (
                <TR key={u.id}>
                  <TD className="pl-6">
                    <span className="font-medium">{u.name}</span>
                    {u.id === session.userId && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                    <p className="text-xs text-muted-foreground">Added {formatDate(u.createdAt)}</p>
                  </TD>
                  <TD className="text-muted-foreground">{u.email}</TD>
                  <TD>
                    <Badge tone={roleTone(u.role)}>{ROLE_LABEL[u.role as Role] ?? u.role}</Badge>
                  </TD>
                  <TD>
                    <Badge tone={u.active ? "success" : "danger"}>
                      {u.active ? "Active" : "Disabled"}
                    </Badge>
                  </TD>
                  <TD className="pr-6 text-right">
                    <div className="flex justify-end">
                      <UserEditDialog
                        user={{ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active }}
                        isSelf={u.id === session.userId}
                      />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="size-3.5" />
        Tip: share each login over a secure channel and ask the user to tell you
        once they've signed in. You can reset a password here anytime.
      </p>
    </div>
  );
}
