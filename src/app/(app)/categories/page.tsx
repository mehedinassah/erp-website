import Link from "next/link";
import { Plus, Tag, Pencil, Sparkles, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canManageCatalog } from "@/lib/permissions";
import { BUSINESS_TYPE_LABEL, type BusinessType } from "@/lib/enums";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { addStarterCategories } from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string; starter?: string }>;
}) {
  const [session, sp] = await Promise.all([requireUser(), searchParams]);
  const { tenantId } = session;
  const manage = canManageCatalog(session.role);

  const [categories, tenant] = await Promise.all([
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { businessType: true } }),
  ]);
  const bt = (tenant?.businessType as BusinessType) ?? "GENERAL";

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Group your products. Every product belongs to a category."
      >
        {manage && (
          <>
            <form action={addStarterCategories}>
              <Button type="submit" variant="outline">
                <Sparkles className="size-4" /> Add {BUSINESS_TYPE_LABEL[bt]} starters
              </Button>
            </form>
            <Button asChild variant="gold">
              <Link href="/categories/new">
                <Plus className="size-4" /> New category
              </Link>
            </Button>
          </>
        )}
      </PageHeader>

      {sp.starter && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-success animate-rise">
          <CheckCircle2 className="size-4" /> Starter categories added for {BUSINESS_TYPE_LABEL[bt]}.
        </div>
      )}
      {sp.error === "in-use" && (
        <div className="mb-4 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          That category still has products. Move or delete its products first.
        </div>
      )}

      <Card className="animate-rise overflow-hidden">
        {categories.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Category</TH>
                <TH className="text-center">Products</TH>
                {manage && <TH className="text-right">Actions</TH>}
              </TR>
            </THead>
            <TBody>
              {categories.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium">{c.name}</TD>
                  <TD className="text-center">
                    <Badge tone="neutral">{c._count.products}</Badge>
                  </TD>
                  {manage && (
                    <TD className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/categories/${c.id}/edit`}>
                          <Pencil className="size-3.5" /> Edit
                        </Link>
                      </Button>
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Tag}
              title="No categories yet"
              description={`Add a ready-made set for your ${BUSINESS_TYPE_LABEL[bt]} business, or create your own.`}
            >
              {manage && (
                <div className="flex flex-wrap justify-center gap-2">
                  <form action={addStarterCategories}>
                    <Button type="submit" variant="gold">
                      <Sparkles className="size-4" /> Add {BUSINESS_TYPE_LABEL[bt]} starters
                    </Button>
                  </form>
                  <Button asChild variant="outline">
                    <Link href="/categories/new">
                      <Plus className="size-4" /> New category
                    </Link>
                  </Button>
                </div>
              )}
            </EmptyState>
          </div>
        )}
      </Card>
    </div>
  );
}
