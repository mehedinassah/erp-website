"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, X,
} from "lucide-react";
import { importProducts, type ImportRow, type ImportResult } from "@/app/(app)/products/import/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

type Warehouse = { id: string; name: string };

const HEADERS = [
  "Product Name", "Category", "Size", "Color",
  "Cost Price", "Sell Price", "SKU", "Barcode", "Opening Stock",
];

// Map flexible header names → our keys
const KEY: Record<string, keyof ImportRow> = {
  "product name": "productName", "product": "productName", "name": "productName", "item": "productName", "item name": "productName",
  "category": "category",
  "size": "size",
  "color": "color", "colour": "color",
  "cost price": "costPrice", "cost": "costPrice", "buy price": "costPrice", "purchase price": "costPrice",
  "sell price": "sellPrice", "price": "sellPrice", "sale price": "sellPrice", "mrp": "sellPrice", "selling price": "sellPrice",
  "sku": "sku", "code": "sku",
  "barcode": "barcode", "bar code": "barcode",
  "opening stock": "openingStock", "stock": "openingStock", "quantity": "openingStock", "qty": "openingStock",
};

export function ProductImporter({ warehouses }: { warehouses: Warehouse[] }) {
  const router = useRouter();
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const sample = [
      "Hand-Block Cotton Panjabi,Panjabi,M,Ivory,1100,2350,,8800001,12",
      "Hand-Block Cotton Panjabi,Panjabi,L,Ivory,1100,2350,,8800002,8",
      "Premium Cotton T-Shirt,T-Shirt,M,Midnight,320,790,,,25",
    ];
    const csv = HEADERS.join(",") + "\n" + sample.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "perico-product-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setResult(null);
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const mapped: ImportRow[] = raw.map((r) => {
        const out: ImportRow = {};
        for (const [header, value] of Object.entries(r)) {
          const key = KEY[header.trim().toLowerCase()];
          if (key) out[key] = value as never;
        }
        return out;
      });
      const valid = mapped.filter((r) => String(r.productName ?? "").trim());
      if (!valid.length) {
        setParseError("No rows with a Product Name found. Use the template's column names.");
        setRows([]);
        return;
      }
      setRows(valid);
    } catch {
      setParseError("Couldn't read that file. Use a .csv or .xlsx file based on the template.");
      setRows([]);
    }
  }

  function runImport() {
    startTransition(async () => {
      const res = await importProducts(rows, warehouseId);
      setResult(res);
      if (res.ok) {
        setRows([]);
        setFileName("");
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      }
    });
  }

  function reset() {
    setRows([]);
    setFileName("");
    setParseError("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // Success screen
  if (result?.ok && result.created) {
    return (
      <Card className="mx-auto max-w-lg animate-scale-in">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-8" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">Import complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Added <b>{result.created.products}</b> products · <b>{result.created.variants}</b> variants ·{" "}
            <b>{result.created.units}</b> units of stock.
          </p>
          {result.warnings && result.warnings.length > 0 && (
            <div className="mt-4 w-full rounded-md border border-warning/30 bg-warning/10 p-3 text-left text-xs text-warning">
              <p className="mb-1 font-medium">Notes:</p>
              <ul className="list-disc space-y-0.5 pl-4">
                {result.warnings.slice(0, 6).map((w, i) => <li key={i}>{w}</li>)}
                {result.warnings.length > 6 && <li>…and {result.warnings.length - 6} more.</li>}
              </ul>
            </div>
          )}
          <div className="mt-6 flex gap-2">
            <Button variant="gold" onClick={() => router.push("/products")}>View products</Button>
            <Button variant="outline" onClick={reset}>Import another file</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step 1: template */}
      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">1. Download the template</p>
            <p className="text-sm text-muted-foreground">Fill it in Excel, or paste your existing data under the same columns.</p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="size-4" /> Download CSV template
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: warehouse + upload */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="font-medium">2. Choose where the opening stock goes</p>
            <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="mt-2 sm:w-72">
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </div>

          <div>
            <p className="font-medium">3. Upload your filled file (.csv or .xlsx)</p>
            <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border px-4 py-5 transition-colors hover:bg-muted/40">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
                <Upload className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{fileName || "Click to choose a file"}</span>
                <span className="block text-xs text-muted-foreground">Excel (.xlsx) or CSV based on the template</span>
              </span>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={onFile} />
            </label>
          </div>

          {parseError && (
            <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" /> {parseError}
            </div>
          )}
          {result && !result.ok && (
            <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" /> {result.error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: preview + import */}
      {rows.length > 0 && (
        <Card className="animate-rise overflow-hidden">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 font-medium">
                <FileSpreadsheet className="size-4 text-accent" />
                {rows.length} rows ready
              </p>
              <button onClick={reset} className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted" aria-label="Clear">
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-auto rounded-md border border-border">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Product</TH>
                    <TH className="hidden sm:table-cell">Size/Color</TH>
                    <TH className="text-right">Price</TH>
                    <TH className="text-right">Stock</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.slice(0, 50).map((r, i) => (
                    <TR key={i}>
                      <TD className="font-medium">{String(r.productName)}</TD>
                      <TD className="hidden sm:table-cell text-muted-foreground">{String(r.size ?? "—")}/{String(r.color ?? "—")}</TD>
                      <TD className="tabular text-right">{String(r.sellPrice ?? "0")}</TD>
                      <TD className="tabular text-right">{String(r.openingStock ?? "0")}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            {rows.length > 50 && <p className="mt-2 text-xs text-muted-foreground">Showing first 50 of {rows.length} rows. All will be imported.</p>}

            <Button variant="gold" size="lg" className="mt-4 w-full" disabled={pending || !warehouseId} onClick={runImport}>
              {pending ? <><Loader2 className="size-4 animate-spin" /> Importing…</> : <>Import {rows.length} rows</>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
