import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { canDelete } from "@/lib/permissions";
import { PageHeader } from "@/components/app/page-header";
import { SimpleForm } from "@/components/app/simple-form";
import { DeleteButton } from "@/components/ui/delete-button";
import { updateCategory, deleteCategory } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;
  const { id } = await params;
  const category = await prisma.category.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { products: true } } },
  });
  if (!category) notFound();

  return (
    <div>
      <Link
        href="/categories"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Categories
      </Link>
      <PageHeader eyebrow="Catalog" title="Edit category">
        {canDelete(session.role) && category._count.products === 0 && (
          <DeleteButton
            entity="category"
            name={category.name}
            action={async () => {
              "use server";
              await deleteCategory(category.id);
            }}
          />
        )}
      </PageHeader>
      <SimpleForm
        action={updateCategory.bind(null, category.id)}
        submitLabel="Save changes"
        fields={[
          { name: "name", label: "Category name", required: true, defaultValue: category.name },
        ]}
      />
    </div>
  );
}
