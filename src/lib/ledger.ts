// Pure ledger math shared by pages and actions (no server-only imports).

export type RawEntry = { kind: string; amount: number };

/** Total billed, total paid, and remaining balance for an account. */
export function summarize(openingAmount: number, entries: RawEntry[]) {
  let billed = openingAmount;
  let paid = 0;
  for (const e of entries) {
    if (e.kind === "CHARGE") billed += e.amount;
    else paid += e.amount;
  }
  return { billed, paid, remaining: billed - paid };
}

/**
 * Walk entries oldest→newest, returning each with the running balance after it.
 * Pass entries already sorted ascending by occurredAt.
 */
export function withRunningBalance<
  T extends { kind: string; amount: number },
>(openingAmount: number, ascEntries: T[]): (T & { balanceAfter: number })[] {
  let balance = openingAmount;
  return ascEntries.map((e) => {
    balance += e.kind === "CHARGE" ? e.amount : -e.amount;
    return { ...e, balanceAfter: balance };
  });
}
