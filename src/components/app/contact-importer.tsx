"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

type Result = { ok: boolean; error?: string; created?: number; warnings?: string[] };
type Row = Record<string, unknown>;

export function ContactImporter({
  entityLabel,
  columns,
  sampleRows,
  keyMap,
  action,
  listHref,
  templateFile,
}: {
  entityLabel: string;
  columns: string[];
  sampleRows: string[];
  keyMap: Record<string, string>;
  action: (rows: Row[]) => Promise<Result>;
  listHref: string;
  templateFile: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const csv = columns.join(",") + "\n" + sampleRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFile;
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
      const raw: Row[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const mapped: Row[] = raw.map((r) => {
        const out: Row = {};
        for (const [header, value] of Object.entries(r)) {
          const key = keyMap[header.trim().toLowerCase()];
          if (key) out[key] = value;
        }
        return out;
      });
      const valid = mapped.filter((r) => String(r.name ?? "").trim());
      if (!valid.length) {
        setParseError("No rows with a Name found. Use the template's column names.");
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
      const res = await action(rows);
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

  if (result?.ok) {
    return (
      <Card className="mx-auto max-w-lg animate-scale-in">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-8" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">Import complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Added <b>{result.created}</b> {entityLabel}.
          </p>
          {result.warnings && result.warnings.length > 0 && (
            <div className="mt-4 w-full rounded-md border border-warning/30 bg-warning/10 p-3 text-left text-xs text-warning">
              <ul className="list-disc space-y-0.5 pl-4">
                {result.warnings.slice(0, 6).map((w, i) => <li key={i}>{w}</li>)}
                {result.warnings.length > 6 && <li>…and {result.warnings.length - 6} more.</li>}
              </ul>
            </div>
          )}
          <div className="mt-6 flex gap-2">
            <Button variant="gold" onClick={() => router.push(listHref)}>View {entityLabel}</Button>
            <Button variant="outline" onClick={reset}>Import another file</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">1. Download the template</p>
            <p className="text-sm text-muted-foreground">Fill it in Excel, or paste your existing list under the same columns.</p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="size-4" /> Download CSV template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="font-medium">2. Upload your filled file (.csv or .xlsx)</p>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border px-4 py-5 transition-colors hover:bg-muted/40">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
              <Upload className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{fileName || "Click to choose a file"}</span>
              <span className="block text-xs text-muted-foreground">Excel (.xlsx) or CSV based on the template</span>
            </span>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={onFile} />
          </label>

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

      {rows.length > 0 && (
        <Card className="animate-rise overflow-hidden">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 font-medium">
                <FileSpreadsheet className="size-4 text-accent" /> {rows.length} {entityLabel} ready
              </p>
              <button onClick={reset} className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted" aria-label="Clear">
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-auto rounded-md border border-border">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Name</TH>
                    <TH className="hidden sm:table-cell">Phone</TH>
                    <TH className="hidden sm:table-cell">Email</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.slice(0, 50).map((r, i) => (
                    <TR key={i}>
                      <TD className="font-medium">{String(r.name)}</TD>
                      <TD className="hidden sm:table-cell text-muted-foreground">{String(r.phone ?? "—")}</TD>
                      <TD className="hidden sm:table-cell text-muted-foreground">{String(r.email ?? "—")}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            {rows.length > 50 && <p className="mt-2 text-xs text-muted-foreground">Showing first 50 of {rows.length}. All will be imported.</p>}

            <Button variant="gold" size="lg" className="mt-4 w-full" disabled={pending} onClick={runImport}>
              {pending ? <><Loader2 className="size-4 animate-spin" /> Importing…</> : <>Import {rows.length} {entityLabel}</>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
