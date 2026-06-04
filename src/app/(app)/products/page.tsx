import Link from "next/link";
import { Plus, Search, Shirt, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canManageProducts, canDelete } from "@/lib/permissions";
import { ClearButton } from "@/components/app/clear-button";
import { clearProducts } from "../clear-actions";
import { formatBDT, formatNumber } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/constants";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge, statusTone } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type SP = { q?: string; category?: string; page?: string };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const [session, sp] = await Promise.all([requireUser(), searchParams]);
  const { tenantId } = session;
  const q = (sp.q ?? "").trim();
  const categoryId = sp.category ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        variants: { include: { stockLevels: true } },
      },
    }),
  ]);

  // Case-insensitive search + category filter (dataset is small; filter in JS)
  const ql = q.toLowerCase();
  const filtered = products.filter((p) => {
    const matchesQ =
      !ql ||
      p.name.toLowerCase().includes(ql) ||
      p.sku.toLowerCase().includes(ql);
    const matchesCat = !categoryId || p.categoryId === categoryId;
    return matchesQ && matchesCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("category", categoryId);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/products?${s}` : "/products";
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Every style in your catalogue, with live variant and stock counts."
      >
        {canManageProducts(session.role) && (
          <>
            <Button asChild variant="outline">
              <Link href="/products/import">
                <Upload className="size-4" /> Import
              </Link>
            </Button>
            <Button asChild variant="gold">
              <Link href="/products/new">
                <Plus className="size-4" /> New product
              </Link>
            </Button>
          </>
        )}
        {canDelete(session.role) && (
          <ClearButton
            action={clearProducts}
            entity="all products"
            description="Permanently deletes every product, variant and stock record — and all sales & purchase orders, since they depend on products."
          />
        )}
      </PageHeader>

      {/* Filters (GET form — works without JS) */}
      <form className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by name or SKU…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select name="category" defaultValue={categoryId} className="sm:w-48">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </div>
      </form>

      <Card className="animate-rise overflow-hidden">
        {rows.length ? (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Product</TH>
                <TH className="hidden sm:table-cell">Category</TH>
                <TH className="hidden sm:table-cell text-center">Variants</TH>
                <TH className="hidden md:table-cell text-right">In stock</TH>
                <TH className="text-right">Price</TH>
                <TH className="text-right">Status</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((p) => {
                const stock = p.variants.reduce(
                  (s, v) =>
                    s + v.stockLevels.reduce((t, sl) => t + sl.quantity, 0),
                  0,
                );
                const colors = new Set(p.variants.map((v) => v.colorHex));
                return (
                  <TR key={p.id}>
                    <TD>
                      <Link
                        href={`/products/${p.id}`}
                        className="font-medium gold-underline"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </TD>
                    <TD className="hidden sm:table-cell text-muted-foreground">{p.category.name}</TD>
                    <TD className="hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <span className="tabular text-sm">
                          {p.variants.length}
                        </span>
                        <div className="flex -space-x-1">
                          {[...colors].slice(0, 4).map((hex, i) => (
                            <span
                              key={i}
                              className="size-3.5 rounded-full border border-card"
                              style={{ background: hex ?? "#ccc" }}
                            />
                          ))}
                        </div>
                      </div>
                    </TD>
                    <TD className="hidden md:table-cell tabular text-right">{formatNumber(stock)}</TD>
                    <TD className="tabular text-right font-medium">
                      {formatBDT(p.sellPrice)}
                    </TD>
                    <TD className="text-right">
                      <Badge tone={statusTone(p.status)}>
                        {p.status === "ACTIVE" ? "Active" : "Archived"}
                      </Badge>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Shirt}
              title="No products found"
              description={
                q || categoryId
                  ? "Try a different search or clear the filters."
                  : "Create your first product to get started."
              }
            >
              {canManageProducts(session.role) && !q && !categoryId && (
                <Button asChild variant="gold">
                  <Link href="/products/new">
                    <Plus className="size-4" /> New product
                  </Link>
                </Button>
              )}
            </EmptyState>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {current} of {totalPages} · {filtered.length} products
          </p>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={current <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              <Link href={hrefFor(current - 1)}>Previous</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className={
                current >= totalPages ? "pointer-events-none opacity-50" : ""
              }
            >
              <Link href={hrefFor(current + 1)}>Next</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
