"use server";

import { prisma } from "./prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export async function logAudit(opts: {
  tenantId: string;
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  entityRef?: string | null;
  changes?: Record<string, unknown> | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: opts.tenantId,
        userId: opts.userId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        entityRef: opts.entityRef ?? null,
        changes: opts.changes ? JSON.stringify(opts.changes) : null,
      },
    });
  } catch {
    // Audit failures must never break the main operation — swallow silently.
  }
}
