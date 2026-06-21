import * as XLSX from "xlsx";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireUser();
  const { tenantId } = session;

  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: {
      category: true,
      variants: { include: { stockLevels: true } },
    },
  });

  const rows = products.map((p) => {
    const stock = p.variants.reduce(
      (s, v) => s + v.stockLevels.reduce((t, sl) => t + sl.quantity, 0),
      0,
    );
    return {
      Name: p.name,
      SKU: p.sku,
      Category: p.category.name,
      Gender: p.gender,
      Material: p.material ?? "",
      "Cost (৳)": p.costPrice,
      "Sell (৳)": p.sellPrice,
      Variants: p.variants.length,
      "In stock": stock,
      Status: p.status,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="products-${date}.xlsx"`,
    },
  });
}
