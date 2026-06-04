"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type ContactImportResult = {
  ok: boolean;
  error?: string;
  created?: number;
  warnings?: string[];
};

type Row = { name?: string; phone?: string; email?: string; address?: string };
const txt = (v: unknown) => String(v ?? "").trim();

export async function importCustomers(rows: Row[]): Promise<ContactImportResult> {
  const { tenantId } = await requireRole(["ADMIN", "MANAGER"]);
  if (!rows?.length) return { ok: false, error: "No rows to import." };

  const warnings: string[] = [];
  const data: { id: string; name: string; phone: string | null; email: string | null; address: string | null; tenantId: string }[] = [];
  rows.forEach((r, i) => {
    const name = txt(r.name);
    if (!name) {
      if (Object.values(r).some((v) => txt(v))) warnings.push(`Row ${i + 2}: skipped — no name.`);
      return;
    }
    data.push({ id: randomUUID(), name, phone: txt(r.phone) || null, email: txt(r.email) || null, address: txt(r.address) || null, tenantId });
  });
  if (!data.length) return { ok: false, error: "No valid rows found (Name is required).", warnings };

  try {
    await prisma.customer.createMany({ data });
  } catch (e) {
    return { ok: false, error: "Import failed. " + (e instanceof Error ? e.message : ""), warnings };
  }
  revalidatePath("/customers");
  return { ok: true, created: data.length, warnings };
}
