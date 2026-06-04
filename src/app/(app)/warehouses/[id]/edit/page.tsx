import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { canDelete } from "@/lib/permissions";
import { PageHeader } from "@/components/app/page-header";
import { SimpleForm } from "@/components/app/simple-form";
import { DeleteButton } from "@/components/ui/delete-button";
import { updateWarehouse, deleteWarehouse } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditWarehousePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;
  const { id } = await params;
  const warehouse = await prisma.warehouse.findFirst({ where: { id, tenantId } });
  if (!warehouse) notFound();

  return (
    <div>
      <Link
        href="/warehouses"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Warehouses
      </Link>
      <PageHeader eyebrow="Inventory" title="Edit warehouse">
        {canDelete(session.role) && (
          <DeleteButton
            entity="warehouse"
            name={warehouse.name}
            description="Only possible if it holds no stock and has no orders, and isn't your only warehouse."
            action={async () => {
              "use server";
              await deleteWarehouse(warehouse.id);
            }}
          />
        )}
      </PageHeader>
      <SimpleForm
        action={updateWarehouse.bind(null, warehouse.id)}
        submitLabel="Save changes"
        fields={[
          { name: "name", label: "Warehouse name", required: true, defaultValue: warehouse.name },
          { name: "code", label: "Short code", required: true, defaultValue: warehouse.code },
          { name: "address", label: "Address", type: "textarea", defaultValue: warehouse.address },
        ]}
      />
    </div>
  );
}
