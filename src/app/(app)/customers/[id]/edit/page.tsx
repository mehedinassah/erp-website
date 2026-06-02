import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canDelete } from "@/lib/permissions";
import { PageHeader } from "@/components/app/page-header";
import { ContactForm } from "@/components/app/contact-form";
import { DeleteButton } from "@/components/ui/delete-button";
import { updateCustomer, deleteCustomer } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div>
      <Link
        href="/customers"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Customers
      </Link>
      <PageHeader eyebrow="Sales" title="Edit customer">
        {canDelete(session.role) && (
          <DeleteButton
            entity="customer"
            name={customer.name}
            description="Their past orders are kept and marked as walk-in."
            action={async () => {
              "use server";
              await deleteCustomer(customer.id);
            }}
          />
        )}
      </PageHeader>
      <ContactForm
        action={updateCustomer.bind(null, customer.id)}
        submitLabel="Save changes"
        defaults={{
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
        }}
      />
    </div>
  );
}
