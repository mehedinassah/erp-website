"use client";

import { useMemo, useState } from "react";
import { Tags, Plus, Minus, Eraser } from "lucide-react";
import { Barcode } from "./barcode";
import { PrintButton } from "./print-button";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatBDT } from "@/lib/format";

type Variant = {
  id: string;
  sku: string;
  barcode: string | null;
  size: string;
  color: string;
  colorHex: string | null;
};
type Product = {
  id: string;
  name: string;
  sellPrice: number;
  variants: Variant[];
};

export function LabelSheet({ products }: { products: Product[] }) {
  const [copies, setCopies] = useState<Record<string, number>>({});
  const [perRow, setPerRow] = useState(4);
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(false);

  const variantIndex = useMemo(() => {
    const m = new Map<string, { product: Product; variant: Variant }>();
    for (const p of products)
      for (const v of p.variants) m.set(v.id, { product: p, variant: v });
    return m;
  }, [products]);

  function setCopy(id: string, n: number) {
    setCopies((prev) => ({ ...prev, [id]: Math.max(0, n) }));
  }
  function bump(id: string, delta: number) {
    setCopies((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
  }
  function oneEach(p: Product) {
    setCopies((prev) => {
      const next = { ...prev };
      for (const v of p.variants) next[v.id] = (next[v.id] ?? 0) || 1;
      return next;
    });
  }
  function clearAll() {
    setCopies({});
  }

  // Flatten into a printable list
  const labels = useMemo(() => {
    const out: { key: string; product: Product; variant: Variant }[] = [];
    for (const [id, n] of Object.entries(copies)) {
      const entry = variantIndex.get(id);
      if (!entry || n <= 0) continue;
      for (let i = 0; i < n; i++)
        out.push({ key: `${id}-${i}`, product: entry.product, variant: entry.variant });
    }
    return out;
  }, [copies, variantIndex]);

  const totalLabels = labels.length;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="print:hidden">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Per row</label>
                <Select
                  value={String(perRow)}
                  onChange={(e) => setPerRow(Number(e.target.value))}
                  className="w-24"
                >
                  {[2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {[
                  ["Product name", showName, setShowName],
                  ["Price", showPrice, setShowPrice],
                  ["SKU", showSku, setShowSku],
                ].map(([label, val, set]) => (
                  <label
                    key={label as string}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={val as boolean}
                      onChange={(e) =>
                        (set as (b: boolean) => void)(e.target.checked)
                      }
                      className="accent-[var(--accent)]"
                    />
                    {label as string}
                  </label>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {totalLabels} label{totalLabels === 1 ? "" : "s"}
                </span>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  <Eraser className="size-4" /> Clear
                </Button>
                <PrintButton label="Print labels" />
              </div>
            </div>

            {/* Per-product variant pickers */}
            <div className="max-h-[40vh] space-y-4 overflow-y-auto rounded-lg border border-border p-3">
              {products.map((p) => (
                <div key={p.id}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {p.name}{" "}
                      <span className="text-muted-foreground">
                        · {formatBDT(p.sellPrice)}
                      </span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => oneEach(p)}
                    >
                      <Plus className="size-3.5" /> 1 of each
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.variants.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1"
                      >
                        <span
                          className="size-3 rounded-full border border-black/10"
                          style={{ background: v.colorHex ?? "#ccc" }}
                        />
                        <span className="text-xs">
                          {v.size}/{v.color}
                        </span>
                        <button
                          onClick={() => bump(v.id, -1)}
                          className="grid size-5 place-items-center rounded hover:bg-muted cursor-pointer"
                          aria-label="Fewer"
                        >
                          <Minus className="size-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={copies[v.id] ?? 0}
                          onChange={(e) => setCopy(v.id, Number(e.target.value))}
                          className="tabular h-6 w-10 rounded border border-input bg-surface text-center text-xs"
                        />
                        <button
                          onClick={() => bump(v.id, 1)}
                          className="grid size-5 place-items-center rounded hover:bg-muted cursor-pointer"
                          aria-label="More"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print sheet */}
      {totalLabels === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground print:hidden">
          Choose products and quantities above to build your label sheet.
        </div>
      ) : (
        <div
          className="label-sheet grid gap-2"
          style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}
        >
          {labels.map(({ key, product, variant }) => {
            const code = variant.barcode || variant.sku;
            return (
              <div
                key={key}
                className="label flex flex-col items-center gap-0.5 rounded border border-border bg-white p-2 text-center text-black"
              >
                {showName && (
                  <p className="line-clamp-2 text-[10px] font-medium leading-tight">
                    {product.name}
                  </p>
                )}
                <p className="text-[9px] text-neutral-500">
                  {variant.size} · {variant.color}
                </p>
                <Barcode value={code} height={34} />
                <p className="tabular text-[9px] tracking-wider">{code}</p>
                {showPrice && (
                  <p className="text-[11px] font-semibold">
                    {formatBDT(product.sellPrice)}
                  </p>
                )}
                {showSku && (
                  <p className="text-[8px] text-neutral-500">{variant.sku}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
