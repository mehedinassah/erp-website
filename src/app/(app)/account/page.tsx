import { requireUser } from "@/lib/auth";
import { ROLE_LABEL, type Role } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { ChangePasswordForm } from "@/components/app/change-password-form";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireUser();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="My account"
        description="Your profile and sign-in settings."
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Name</p>
            <p className="mt-0.5 font-medium">{session.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Email</p>
            <p className="mt-0.5 truncate font-medium">{session.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Role</p>
            <p className="mt-0.5 font-medium">{ROLE_LABEL[session.role as Role] ?? session.role}</p>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}
