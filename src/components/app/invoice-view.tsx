import Image from "next/image";
import { formatBDT, formatDate, formatVariant } from "@/lib/format";
import {
  SO_STATUS_LABEL, type SalesOrderStatus,
  PAYMENT_STATUS_LABEL, type PaymentStatus,
} from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

const paymentTone = (s: string) => (s === "PAID" ? "success" : s === "PARTIAL" ? "warning" : "danger");

type Biz = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  taxLabel: string;
  taxRatePct: number;
  invoiceFooter: string | null;
} | null;

type Order = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  orderDate: Date;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  customer: { name: string; address: string | null; phone: string | null } | null;
  warehouse: { name: string };
  user: { name: string } | null;
  items: { id: string; quantity: number; unitPrice: number; variant: { size: string; color: string; sku: string; product: { name: string } } }[];
};

export function InvoiceView({ order, biz }: { order: Order; biz: Biz }) {
  return (
    <Card className="animate-rise overflow-hidden p-8 sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {biz?.logoUrl ? (
              <Image src={biz.logoUrl} alt={biz.name} width={48} height={48} unoptimized className="size-12 rounded-md object-contain" />
            ) : (
              <span className="grid size-10 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground">
                {(biz?.name ?? "S").charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <p className="font-display text-xl font-semibold leading-none">{biz?.name ?? "Your Business"}</p>
              {(biz?.address || biz?.phone) && (
                <p className="mt-1 text-xs text-muted-foreground">{[biz?.address, biz?.phone].filter(Boolean).join(" · ")}</p>
              )}
              {biz?.email && <p className="text-xs text-muted-foreground">{biz.email}</p>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold">Invoice</p>
          <p className="tabular text-sm text-muted-foreground">{order.orderNumber}</p>
          <div className="mt-1 flex justify-end gap-2">
            <Badge tone={statusTone(order.status)}>{SO_STATUS_LABEL[order.status as SalesOrderStatus] ?? order.status}</Badge>
            <Badge tone={paymentTone(order.paymentStatus)}>{PAYMENT_STATUS_LABEL[order.paymentStatus as PaymentStatus] ?? order.paymentStatus}</Badge>
          </div>
        </div>
      </div>

      <div className="hairline my-7" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billed to</p>
          <p className="font-medium">{order.customer?.name ?? "Walk-in customer"}</p>
          {order.customer?.address && <p className="text-sm text-muted-foreground">{order.customer.address}</p>}
          {order.customer?.phone && <p className="text-sm text-muted-foreground">{order.customer.phone}</p>}
        </div>
        <div className="sm:text-right">
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Date: </span>{formatDate(order.orderDate)}</p>
            <p><span className="text-muted-foreground">From: </span>{order.warehouse.name}</p>
            {order.user && <p><span className="text-muted-foreground">Served by: </span>{order.user.name}</p>}
          </div>
        </div>
      </div>

      <div className="mt-7">
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Item</TH>
              <TH className="text-center">Qty</TH>
              <TH className="text-right">Unit price</TH>
              <TH className="text-right">Amount</TH>
            </TR>
          </THead>
          <TBody>
            {order.items.map((it) => {
              const vl = formatVariant(it.variant.size, it.variant.color);
              return (
                <TR key={it.id} className="hover:bg-transparent">
                  <TD>
                    <p className="font-medium">{it.variant.product.name}</p>
                    <p className="text-xs text-muted-foreground">{[vl, it.variant.sku].filter(Boolean).join(" · ")}</p>
                  </TD>
                  <TD className="tabular text-center">{it.quantity}</TD>
                  <TD className="tabular text-right">{formatBDT(it.unitPrice)}</TD>
                  <TD className="tabular text-right font-medium">{formatBDT(it.unitPrice * it.quantity)}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular">{formatBDT(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="tabular text-destructive">−{formatBDT(order.discount)}</span>
            </div>
          )}
          {order.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{biz?.taxLabel ?? "Tax"}{biz?.taxRatePct ? ` (${biz.taxRatePct}%)` : ""}</span>
              <span className="tabular">{formatBDT(order.tax)}</span>
            </div>
          )}
          <div className="hairline flex justify-between pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular text-accent">{formatBDT(order.total)}</span>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="hairline mt-7 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
          <p className="mt-1 text-sm text-muted-foreground">{order.notes}</p>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {biz?.invoiceFooter ?? `Thank you for shopping with ${biz?.name ?? "us"}`} · ৳ all amounts in BDT
      </p>
    </Card>
  );
}
