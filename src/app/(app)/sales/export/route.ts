import * as XLSX from "xlsx";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_STATUS_LABEL, type PaymentStatus, SO_STATUS_LABEL, type SalesOrderStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireUser();
  const { tenantId } = session;

  const orders = await prisma.salesOrder.findMany({
    where: { tenantId },
    orderBy: { orderDate: "desc" },
    include: { customer: true, _count: { select: { items: true } } },
  });

  const rows = orders.map((o) => ({
    "Order #": o.orderNumber,
    Date: o.orderDate.toISOString().slice(0, 10),
    Customer: o.customer?.name ?? "Walk-in",
    Items: o._count.items,
    "Subtotal (৳)": o.subtotal,
    "Discount (৳)": o.discount,
    "Tax (৳)": o.tax,
    "Total (৳)": o.total,
    "Paid (৳)": o.amountPaid,
    Payment: PAYMENT_STATUS_LABEL[o.paymentStatus as PaymentStatus] ?? o.paymentStatus,
    Status: SO_STATUS_LABEL[o.status as SalesOrderStatus] ?? o.status,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sales-${date}.xlsx"`,
    },
  });
}
