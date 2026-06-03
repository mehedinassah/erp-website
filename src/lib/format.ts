// All money is stored as whole BDT taka (Int). These helpers format for display.

const bdt = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

/** Format an integer amount of taka as "৳1,250". */
export function formatBDT(amount: number): string {
  // Intl renders "BDT" or "৳" depending on the runtime; normalise to the symbol.
  return bdt.format(amount).replace("BDT", "৳").replace(/\s/g, "");
}

/** Compact form for KPI cards: ৳1.2k, ৳3.4L (lakh), ৳1.1Cr. */
export function formatBDTCompact(amount: number): string {
  if (Math.abs(amount) >= 10_000_000)
    return `৳${(amount / 10_000_000).toFixed(2)}Cr`;
  if (Math.abs(amount) >= 100_000) return `৳${(amount / 100_000).toFixed(2)}L`;
  if (Math.abs(amount) >= 1_000) return `৳${(amount / 1_000).toFixed(1)}k`;
  return `৳${amount}`;
}

/**
 * Bengali/South-Asian currency grouping: last 3 digits, then groups of 2.
 * 950000 → ৳9,50,000 · 10000000 → ৳1,00,00,000
 */
export function formatTaka(amount: number): string {
  const neg = amount < 0;
  const s = Math.abs(Math.round(amount)).toString();
  let lastThree = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest) {
    lastThree = "," + lastThree;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  }
  return `${neg ? "−" : ""}৳${rest}${lastThree}`;
}

const numberFmt = new Intl.NumberFormat("en-BD");
export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
