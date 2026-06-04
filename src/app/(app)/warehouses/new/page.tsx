import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { SimpleForm } from "@/components/app/simple-form";
import { createWarehouse } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewWarehousePage() {
  await requireRole(["ADMIN", "MANAGER"]);
  return (
    <div>
      <Link
        href="/warehouses"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Warehouses
      </Link>
      <PageHeader eyebrow="Inventory" title="New warehouse" />
      <SimpleForm
        action={createWarehouse}
        submitLabel="Create warehouse"
        fields={[
          { name: "name", label: "Warehouse name", required: true, placeholder: "e.g. Main Store, Gulshan Branch" },
          { name: "code", label: "Short code", required: true, placeholder: "e.g. MAIN, GUL", hint: "A short unique label used on labels and reports." },
          { name: "address", label: "Address", type: "textarea", placeholder: "Optional" },
        ]}
      />
    </div>
  );
}
