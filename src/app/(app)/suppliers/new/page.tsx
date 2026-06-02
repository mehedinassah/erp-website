import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ContactForm } from "@/components/app/contact-form";
import { createSupplier } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewSupplierPage() {
  await requireRole(["ADMIN", "MANAGER"]);
  return (
    <div>
      <Link
        href="/suppliers"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Suppliers
      </Link>
      <PageHeader eyebrow="Purchasing" title="New supplier" />
      <ContactForm action={createSupplier} withContact submitLabel="Create supplier" />
    </div>
  );
}
