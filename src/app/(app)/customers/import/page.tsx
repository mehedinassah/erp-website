import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ContactImporter } from "@/components/app/contact-importer";
import { importCustomers } from "./actions";

export const dynamic = "force-dynamic";

const KEY: Record<string, string> = {
  "name": "name", "customer": "name", "customer name": "name", "shop": "name", "shop name": "name",
  "phone": "phone", "mobile": "phone", "contact": "phone", "number": "phone",
  "email": "email", "e-mail": "email",
  "address": "address", "location": "address",
};

export default async function ImportCustomersPage() {
  await requireRole(["ADMIN", "MANAGER"]);
  return (
    <div className="max-w-3xl">
      <Link href="/customers" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="size-4" /> Customers
      </Link>
      <PageHeader eyebrow="Sales" title="Import customers" description="Bring in your customer list from Excel or CSV in one go." />
      <ContactImporter
        entityLabel="customers"
        listHref="/customers"
        templateFile="perico-customer-template.csv"
        columns={["Name", "Phone", "Email", "Address"]}
        sampleRows={[
          "Aarong Gulshan,+8801811111111,buy@aarong.com,Gulshan 1 Dhaka",
          "Sadia Rahman,+8801822222222,,Dhanmondi Dhaka",
        ]}
        keyMap={KEY}
        action={importCustomers}
      />
    </div>
  );
}
