import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTenantProfile } from "@/lib/tenant";
import { verifyInvoiceToken } from "@/lib/invoice-token";
import { InvoiceView } from "@/components/app/invoice-view";
import { PrintButton } from "@/components/app/print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ id }, { t }] = await Promise.all([params, searchParams]);
  if (!verifyInvoiceToken(id, t ?? "")) notFound();

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      warehouse: true,
      user: true,
      items: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!order) notFound();

  const biz = await getTenantProfile(order.tenantId);

  return (
    <main className="min-h-dvh bg-background py-8 text-foreground">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-4 flex justify-end print:hidden">
          <PrintButton label="Download / Print" />
        </div>
        <InvoiceView order={order} biz={biz} />
        <p className="mt-6 text-center text-xs text-muted-foreground print:hidden">
          Powered by PERICO ERP
        </p>
      </div>
    </main>
  );
}
