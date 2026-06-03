"use client";

import { useEffect, useRef } from "react";

/** Renders a scannable CODE128 barcode as inline SVG (vector, print-crisp). */
export function Barcode({
  value,
  height = 38,
}: {
  value: string;
  height?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("jsbarcode");
      const JsBarcode = mod.default;
      if (cancelled || !ref.current) return;
      try {
        JsBarcode(ref.current, value, {
          format: "CODE128",
          height,
          width: 1.5,
          displayValue: false,
          margin: 0,
          background: "transparent",
          lineColor: "#000000",
        });
      } catch {
        // ignore invalid values
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, height]);

  return <svg ref={ref} className="h-auto w-full max-w-full" />;
}
