import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { SimpleForm } from "@/components/app/simple-form";
import { createCategory } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  await requireRole(["ADMIN", "MANAGER"]);
  return (
    <div>
      <Link
        href="/categories"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Categories
      </Link>
      <PageHeader eyebrow="Catalog" title="New category" />
      <SimpleForm
        action={createCategory}
        submitLabel="Create category"
        fields={[
          { name: "name", label: "Category name", required: true, placeholder: "e.g. Shirts, Electronics, Groceries" },
        ]}
      />
    </div>
  );
}
