import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { canDelete } from "@/lib/permissions";
import { PageHeader } from "@/components/app/page-header";
import { ContactForm } from "@/components/app/contact-form";
import { DeleteButton } from "@/components/ui/delete-button";
import { updateSupplier, deleteSupplier } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  return (
    <div>
      <Link
        href="/suppliers"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Suppliers
      </Link>
      <PageHeader eyebrow="Purchasing" title="Edit supplier">
        {canDelete(session.role) && (
          <DeleteButton
            entity="supplier"
            name={supplier.name}
            description="Suppliers with purchase-order history cannot be deleted."
            action={async () => {
              "use server";
              await deleteSupplier(supplier.id);
            }}
          />
        )}
      </PageHeader>
      <ContactForm
        action={updateSupplier.bind(null, supplier.id)}
        withContact
        submitLabel="Save changes"
        defaults={{
          name: supplier.name,
          contactName: supplier.contactName,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
        }}
      />
    </div>
  );
}
