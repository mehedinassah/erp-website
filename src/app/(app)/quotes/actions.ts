"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { nextDocNumber, withUniqueRetry } from "@/lib/sequence";
import type { ActionState } from "@/lib/validation";

type LineItem = { variantId: string; quantity: number; price: number };

function parseItems(formData: FormData): LineItem[] {
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]"));
    return (raw as LineItem[])
      .map((r) => ({
        variantId: String(r.variantId),
        quantity: Math.trunc(Number(r.quantity)),
        price: Math.trunc(Number(r.price)),
      }))
      .filter((r) => r.variantId && r.quantity > 0 && r.price >= 0);
  } catch {
    return [];
  }
}

export async function createQuotation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "MANAGER"]);
  const { tenantId } = session;

  const customerId = String(formData.get("customerId") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const discount = Math.max(0, Math.trunc(Number(formData.get("discount")) || 0));
  const validUntilRaw = String(formData.get("validUntil") ?? "").trim();
  const validUntil = validUntilRaw ? new Date(validUntilRaw) : null;
  const items = parseItems(formData);

  if (items.length === 0) return { error: "Add at least one line item." };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const total = Math.max(0, subtotal - discount);

  let id = "";
  let quoteNumber = "";
  try {
    const q = await withUniqueRetry(() =>
      prisma.$transaction(async (tx) => {
        quoteNumber = await nextDocNumber(tx, {
          model: "quotation",
          field: "quoteNumber",
          tenantId,
          prefix: "QUO",
        });
        return tx.quotation.create({
          data: {
            quoteNumber,
            status: "DRAFT",
            customerId,
            notes,
            discount,
            subtotal,
            total,
            validUntil,
            tenantId,
            userId: session.userId,
            items: {
              create: items.map((i) => ({
                variantId: i.variantId,
                quantity: i.quantity,
                unitPrice: i.price,
              })),
            },
          },
        });
      }),
    );
    id = q.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the quotation." };
  }

  await logAudit({
    tenantId,
    userId: session.userId,
    action: "CREATE",
    entity: "Quotation",
    entityId: id,
    entityRef: quoteNumber,
  });

  revalidatePath("/quotes");
  redirect(`/quotes/${id}`);
}

export async function updateQuoteStatus(
  quoteId: string,
  status: string,
  tenantId: string,
  userId: string,
) {
  await prisma.quotation.updateMany({
    where: { id: quoteId, tenantId },
    data: { status },
  });
  await logAudit({ tenantId, userId, action: "UPDATE", entity: "Quotation", entityId: quoteId, changes: { status } });
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
}

export async function deleteQuotation(id: string) {
  const session = await requireRole(["ADMIN"]);
  await prisma.quotation.deleteMany({ where: { id, tenantId: session.tenantId } });
  revalidatePath("/quotes");
  redirect("/quotes?deleted=1");
}
