import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTenantProfile } from "@/lib/tenant";
import { PageHeader } from "@/components/app/page-header";
import { BusinessProfileForm } from "@/components/app/business-profile-form";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const session = await requireRole(["ADMIN"]);
  const profile = await getTenantProfile(session.tenantId);
  if (!profile) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Settings
      </Link>
      <PageHeader
        eyebrow="System"
        title="Business profile"
        description="Your shop's identity, tax rate, and invoice settings."
      />
      <BusinessProfileForm profile={profile} />
    </div>
  );
}
