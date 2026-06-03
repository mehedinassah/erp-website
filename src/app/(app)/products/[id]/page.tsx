import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, canManage } from "@/lib/auth";
import { canDelete } from "@/lib/permissions";
import { formatBDT, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { archiveProduct, deleteProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([requireUser(), params]);

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: {
        orderBy: [{ size: "asc" }, { color: "asc" }],
        include: { stockLevels: { include: { warehouse: true } } },
      },
    },
  });
  if (!product) notFound();

  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: "asc" },
  });

  const totalStock = product.variants.reduce(
    (s, v) => s + v.stockLevels.reduce((t, sl) => t + sl.quantity, 0),
    0,
  );
  const margin =
    product.sellPrice > 0
      ? Math.round(((product.sellPrice - product.costPrice) / product.sellPrice) * 100)
      : 0;
  const manage = canManage(session.role);
  const allowDelete = canDelete(session.role);

  return (
    <div>
      <Link
        href="/products"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Products
      </Link>

      <PageHeader
        eyebrow={product.category.name}
        title={product.name}
        description={product.description ?? undefined}
      >
        {manage && (
          <>
            <form
              action={async () => {
                "use server";
                await archiveProduct(product.id);
              }}
            >
              <Button type="submit" variant="outline">
                {product.status === "ARCHIVED" ? (
                  <>
                    <ArchiveRestore className="size-4" /> Restore
                  </>
                ) : (
                  <>
                    <Archive className="size-4" /> Archive
                  </>
                )}
              </Button>
            </form>
            <Button asChild variant="gold">
              <Link href={`/products/${product.id}/edit`}>
                <Pencil className="size-4" /> Edit
              </Link>
            </Button>
            {allowDelete && (
              <DeleteButton
                entity="product"
                name={product.name}
                description="Removes the product, all its variants and stock, and any order lines that referenced it."
                action={async () => {
                  "use server";
                  await deleteProduct(product.id);
                }}
              />
            )}
          </>
        )}
      </PageHeader>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Base SKU", value: product.sku },
          { label: "Sell price", value: formatBDT(product.sellPrice) },
          { label: "Margin", value: `${margin}%` },
          { label: "Units in stock", value: formatNumber(totalStock) },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="tabular mt-1 font-display text-xl font-semibold">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Attributes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Attributes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Status", product.status === "ACTIVE" ? "Active" : "Archived"],
              ["Audience", product.gender.charAt(0) + product.gender.slice(1).toLowerCase()],
              ["Material", product.material ?? "—"],
              ["Season", product.season ?? "—"],
              ["Cost price", formatBDT(product.costPrice)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-muted-foreground">{k}</span>
                {k === "Status" ? (
                  <Badge tone={statusTone(product.status)}>{v}</Badge>
                ) : (
                  <span className="font-medium">{v}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Variant matrix */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Variants &amp; stock</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH className="pl-6">Variant</TH>
                  <TH>SKU</TH>
                  {warehouses.map((w) => (
                    <TH key={w.id} className="text-right">
                      {w.code}
                    </TH>
                  ))}
                  <TH className="pr-6 text-right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {product.variants.map((v) => {
                  const total = v.stockLevels.reduce(
                    (t, sl) => t + sl.quantity,
                    0,
                  );
                  const low = total <= v.lowStockThreshold;
                  return (
                    <TR key={v.id}>
                      <TD className="pl-6">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="size-3.5 rounded-full border border-black/10"
                            style={{ background: v.colorHex ?? "#ccc" }}
                          />
                          <span className="font-medium">{v.size}</span>
                          <span className="text-muted-foreground">
                            {v.color}
                          </span>
                        </span>
                      </TD>
                      <TD className="text-xs text-muted-foreground">{v.sku}</TD>
                      {warehouses.map((w) => {
                        const sl = v.stockLevels.find(
                          (x) => x.warehouseId === w.id,
                        );
                        return (
                          <TD key={w.id} className="tabular text-right">
                            {sl?.quantity ?? 0}
                          </TD>
                        );
                      })}
                      <TD className="pr-6 text-right">
                        <Badge tone={low ? (total === 0 ? "danger" : "warning") : "neutral"}>
                          {total}
                        </Badge>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
