"use client";

import { useEffect, useState } from "react";
import { formatTaka, formatNumber } from "@/lib/format";

/** Animated number that eases from 0 to `value`. `format` is a serializable
 *  discriminator (functions can't cross the server→client boundary). */
export function CountUp({
  value,
  format = "taka",
  duration = 900,
}: {
  value: number;
  format?: "taka" | "number";
  duration?: number;
}) {
  const [n, setN] = useState(value);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const fmt = format === "number" ? formatNumber : formatTaka;
  return <>{fmt(n)}</>;
}
