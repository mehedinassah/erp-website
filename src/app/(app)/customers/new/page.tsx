import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ContactForm } from "@/components/app/contact-form";
import { createCustomer } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  await requireUser();
  return (
    <div>
      <Link
        href="/customers"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Customers
      </Link>
      <PageHeader eyebrow="Sales" title="New customer" />
      <ContactForm action={createCustomer} submitLabel="Create customer" />
    </div>
  );
}
