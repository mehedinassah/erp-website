import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ContactImporter } from "@/components/app/contact-importer";
import { importSuppliers } from "./actions";

export const dynamic = "force-dynamic";

const KEY: Record<string, string> = {
  "name": "name", "supplier": "name", "supplier name": "name", "company": "name",
  "contact": "contactName", "contact person": "contactName", "contact name": "contactName",
  "phone": "phone", "mobile": "phone", "number": "phone",
  "email": "email", "e-mail": "email",
  "address": "address", "location": "address",
};

export default async function ImportSuppliersPage() {
  await requireRole(["ADMIN", "MANAGER"]);
  return (
    <div className="max-w-3xl">
      <Link href="/suppliers" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="size-4" /> Suppliers
      </Link>
      <PageHeader eyebrow="Purchasing" title="Import suppliers" description="Bring in your supplier list from Excel or CSV in one go." />
      <ContactImporter
        entityLabel="suppliers"
        listHref="/suppliers"
        templateFile="perico-supplier-template.csv"
        columns={["Name", "Contact Person", "Phone", "Email", "Address"]}
        sampleRows={[
          "Tangail Weavers,Rafiqul Islam,+8801711000111,sales@tangail.com,Tangail",
          "Bengal Silk House,Nusrat Jahan,+8801714000444,,Rajshahi",
        ]}
        keyMap={KEY}
        action={importSuppliers}
      />
    </div>
  );
}
