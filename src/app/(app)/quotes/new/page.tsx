import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { NewQuoteForm } from "./new-quote-form";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;

  const [customers, variants] = await Promise.all([
    prisma.customer.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.variant.findMany({
      where: { product: { tenantId, status: "ACTIVE" } },
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <Link href="/quotes" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Quotations
      </Link>
      <PageHeader eyebrow="Sales" title="New quotation" description="Build a price quote to send to a customer." />
      <NewQuoteForm
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        variants={variants.map((v) => ({
          id: v.id,
          product: v.product.name,
          detail: `${v.size} · ${v.color}`,
          sku: v.sku,
          price: v.product.sellPrice,
        }))}
      />
    </div>
  );
}
