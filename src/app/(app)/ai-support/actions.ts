"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { planHasAISupport } from "@/lib/plans";
import {
  provisionTenant,
  addTextDocument,
  uploadDocument,
  deleteDocument,
} from "@/lib/helpdeck";
import type { ActionState } from "@/lib/validation";

/** Load the calling tenant's Helpdeck key, enforcing PRO access. Throws on failure. */
async function requireHelpdeckTenant(): Promise<{ tenantId: string; apiKey: string }> {
  const session = await requireRole(["ADMIN"]);
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { plan: true, helpdeckApiKey: true },
  });
  if (!tenant || !planHasAISupport(tenant.plan)) {
    throw new Error("AI Support is available on the Pro plan only.");
  }
  if (!tenant.helpdeckApiKey) {
    throw new Error("AI Support is not enabled yet.");
  }
  return { tenantId: session.tenantId, apiKey: tenant.helpdeckApiKey };
}

/** Provision a Helpdeck tenant for this business (idempotent). PRO only. */
export async function enableAISupport(): Promise<ActionState> {
  const session = await requireRole(["ADMIN"]);
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { plan: true, name: true, helpdeckApiKey: true },
  });
  if (!tenant) return { error: "Business not found." };
  if (!planHasAISupport(tenant.plan)) {
    return { error: "AI Support is available on the Pro plan only." };
  }
  if (tenant.helpdeckApiKey) {
    revalidatePath("/ai-support");
    return { ok: true };
  }

  try {
    const hd = await provisionTenant(tenant.name);
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { helpdeckTenantId: hd.id, helpdeckApiKey: hd.api_key },
    });
    await logAudit({
      tenantId: session.tenantId,
      userId: session.userId,
      action: "CREATE",
      entity: "AISupport",
      entityId: hd.id,
      entityRef: "AI Support enabled",
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/ai-support");
  return { ok: true };
}

export async function addTextDoc(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (title.length < 2) return { error: "Enter a document title." };
  if (content.length < 10) return { error: "Add a bit more content." };

  try {
    const { apiKey } = await requireHelpdeckTenant();
    await addTextDocument(apiKey, title, content);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/ai-support");
  return { ok: true };
}

export async function uploadDoc(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };

  try {
    const { apiKey } = await requireHelpdeckTenant();
    await uploadDocument(apiKey, file);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/ai-support");
  return { ok: true };
}

export async function removeDoc(id: string): Promise<ActionState> {
  try {
    const { apiKey } = await requireHelpdeckTenant();
    await deleteDocument(apiKey, id);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/ai-support");
  return { ok: true };
}
