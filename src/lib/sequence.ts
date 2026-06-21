import type { Prisma } from "@/generated/prisma/client";

/** True if the error is a Postgres/Prisma unique-constraint violation (P2002). */
export function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

/**
 * Retry a function (typically a $transaction) when a unique-constraint violation
 * occurs. Used to make sequential document numbers (SO-2025-0001, etc.) safe under
 * concurrency: if two requests pick the same number, the loser retries and reads
 * the now-committed value.
 */
export async function withUniqueRetry<T>(
  fn: () => Promise<T>,
  attempts = 6,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (!isUniqueViolation(e)) throw e;
      // brief jittered backoff before retrying
      await new Promise((r) => setTimeout(r, 15 * (i + 1) + Math.random() * 20));
    }
  }
  throw lastError;
}

/**
 * Compute the next sequential document number for a tenant, based on the highest
 * existing number for the current year (not a row count — deletions don't shift it).
 * Format: `${prefix}-${year}-0001`. Must be called inside the same transaction as
 * the insert, and the insert wrapped in withUniqueRetry().
 */
export async function nextDocNumber(
  tx: Prisma.TransactionClient,
  opts: {
    model: "salesOrder" | "quotation" | "salesReturn" | "purchaseOrder";
    field: string;
    tenantId: string;
    prefix: string;
  },
): Promise<string> {
  const year = new Date().getFullYear();
  const like = `${opts.prefix}-${year}-`;

  // Find the latest matching number for this tenant/prefix/year.
  // Lexicographic desc works because the numeric suffix is zero-padded.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latest = await (tx as any)[opts.model].findFirst({
    where: { tenantId: opts.tenantId, [opts.field]: { startsWith: like } },
    orderBy: { [opts.field]: "desc" },
    select: { [opts.field]: true },
  });

  let nextSeq = 1;
  if (latest && latest[opts.field]) {
    const suffix = String(latest[opts.field]).slice(like.length);
    const n = parseInt(suffix, 10);
    if (Number.isFinite(n)) nextSeq = n + 1;
  }

  return `${like}${String(nextSeq).padStart(4, "0")}`;
}
