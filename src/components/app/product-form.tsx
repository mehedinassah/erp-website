"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field, FieldError } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GENDERS, PRODUCT_STATUSES, SIZES, VARIANT_AXES, showsClothingFields, type BusinessType } from "@/lib/enums";
import { COLOR_PALETTE } from "@/lib/constants";
import type { ActionState } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

type Defaults = {
  name?: string;
  sku?: string;
  categoryId?: string;
  gender?: string;
  material?: string | null;
  season?: string | null;
  brand?: string | null;
  unit?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  costPrice?: number;
  sellPrice?: number;
  targetStock?: number;
  status?: string;
};

/** Free-text chip adder for generic variant axes (non-clothing). */
function ChipAdder({
  label,
  values,
  setValues,
  placeholder,
}: {
  label: string;
  values: string[];
  setValues: (v: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (v && !values.includes(v)) setValues([...values, v]);
    setDraft("");
  }
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="size-4" /> Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((v) => (
            <span key={v} className="flex items-center gap-1.5 rounded-md border border-accent bg-accent-soft px-2.5 py-1 text-sm text-accent">
              {v}
              <button type="button" onClick={() => setValues(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductForm({
  mode,
  action,
  categories,
  businessType = "CLOTHING",
  defaults = {},
}: {
  mode: "create" | "edit";
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  categories: Category[];
  businessType?: string;
  defaults?: Defaults;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  const clothing = showsClothingFields(businessType);
  const axes = VARIANT_AXES[(businessType as BusinessType)] ?? VARIANT_AXES.GENERAL;

  // Clothing uses chip presets; others use free-text values.
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [axis1, setAxis1] = useState<string[]>([]);
  const [axis2, setAxis2] = useState<string[]>([]);
  const [simple, setSimple] = useState(false);

  const variants = useMemo(() => {
    const out: { size: string; color: string; colorHex: string | null }[] = [];
    if (simple) {
      out.push({ size: "Default", color: "", colorHex: null });
      return out;
    }
    if (axes.clothingChips) {
      for (const s of sizes)
        for (const c of colors) {
          const hex = COLOR_PALETTE.find((p) => p.name === c)?.hex ?? null;
          out.push({ size: s, color: c, colorHex: hex });
        }
    } else {
      const a2 = axis2.length ? axis2 : [""];
      for (const a of axis1)
        for (const b of a2) out.push({ size: a, color: b, colorHex: null });
    }
    return out;
  }, [simple, axes.clothingChips, sizes, colors, axis1, axis2]);

  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />

      <div className="space-y-6 lg:col-span-2">
        {state.error && (
          <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {state.error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <Label htmlFor="name" required>Product name</Label>
              <Input id="name" name="name" defaultValue={defaults.name} placeholder={clothing ? "Hand-Block Cotton Panjabi" : "Product name"} />
              <FieldError>{fe.name}</FieldError>
            </Field>

            <Field>
              <Label htmlFor="sku" required>Base SKU</Label>
              <Input id="sku" name="sku" defaultValue={defaults.sku} placeholder="PRD-001" className="uppercase" />
              <FieldError>{fe.sku}</FieldError>
            </Field>

            <Field>
              <Label htmlFor="categoryId" required>Category</Label>
              <Select id="categoryId" name="categoryId" defaultValue={defaults.categoryId ?? ""}>
                <option value="" disabled>Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <FieldError>{fe.categoryId}</FieldError>
            </Field>

            {/* Clothing-specific fields */}
            {clothing ? (
              <>
                <Field>
                  <Label htmlFor="gender">Audience</Label>
                  <Select id="gender" name="gender" defaultValue={defaults.gender ?? "UNISEX"}>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="material">Material</Label>
                  <Input id="material" name="material" defaultValue={defaults.material ?? ""} placeholder="Cotton" />
                </Field>
                <Field>
                  <Label htmlFor="season">Season / collection</Label>
                  <Input id="season" name="season" defaultValue={defaults.season ?? ""} placeholder="Eid" />
                </Field>
              </>
            ) : (
              <>
                {/* Keep gender at default for non-clothing */}
                <input type="hidden" name="gender" value="UNISEX" />
                <Field>
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" defaultValue={defaults.brand ?? ""} placeholder="Brand / manufacturer" />
                </Field>
                <Field>
                  <Label htmlFor="unit">Unit of measure</Label>
                  <Input id="unit" name="unit" defaultValue={defaults.unit ?? ""} placeholder="pcs, kg, box, strip…" />
                </Field>
              </>
            )}

            {mode === "edit" && (
              <Field>
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue={defaults.status ?? "ACTIVE"}>
                  {PRODUCT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </Select>
              </Field>
            )}

            <Field className="sm:col-span-2">
              <Label htmlFor="imageUrl">Product image URL</Label>
              <Input id="imageUrl" name="imageUrl" type="url" defaultValue={defaults.imageUrl ?? ""} placeholder="https://example.com/product.jpg" />
            </Field>
            <Field className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={defaults.description ?? ""} rows={3} />
            </Field>
          </CardContent>
        </Card>

        {mode === "create" && (
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={simple} onChange={(e) => setSimple(e.target.checked)} className="accent-[var(--accent)]" />
                Single product (no variants)
              </label>

              {!simple && axes.clothingChips && (
                <>
                  <div>
                    <Label>{axes.axis1}s</Label>
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map((s) => {
                        const on = sizes.includes(s);
                        return (
                          <button type="button" key={s}
                            onClick={() => setSizes((p) => (on ? p.filter((x) => x !== s) : [...p, s]))}
                            className={cn("h-9 min-w-11 rounded-md border px-3 text-sm font-medium transition-colors cursor-pointer",
                              on ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface hover:bg-muted")}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label>{axes.axis2}s</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTE.map((c) => {
                        const on = colors.includes(c.name);
                        return (
                          <button type="button" key={c.name}
                            onClick={() => setColors((p) => (on ? p.filter((x) => x !== c.name) : [...p, c.name]))}
                            className={cn("flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors cursor-pointer",
                              on ? "border-accent ring-1 ring-accent" : "border-border hover:bg-muted")}>
                            <span className="size-4 rounded-full border border-black/10" style={{ background: c.hex }} />
                            {c.name}
                            {on && <Check className="size-3.5 text-accent" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {!simple && !axes.clothingChips && (
                <>
                  <ChipAdder label={axes.axis1} values={axis1} setValues={setAxis1} placeholder={`Add a ${axes.axis1.toLowerCase()} (e.g. 250mg) and press Enter`} />
                  {axes.axis2 && (
                    <ChipAdder label={`${axes.axis2} (optional)`} values={axis2} setValues={setAxis2} placeholder={`Add a ${axes.axis2.toLowerCase()} (optional)`} />
                  )}
                </>
              )}

              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                {variants.length > 0 ? (
                  <>
                    <span className="font-medium text-foreground">
                      {variants.length} variant{variants.length > 1 ? "s" : ""}
                    </span>{" "}
                    will be created. Stock starts at 0 — add stock from the Stock Control screen.
                  </>
                ) : (
                  simple
                    ? "A single stock item will be created."
                    : `Pick at least one ${axes.axis1.toLowerCase()} to generate variants.`
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pricing &amp; stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <Label htmlFor="costPrice">Cost price (৳)</Label>
              <Input id="costPrice" name="costPrice" type="number" min={0} defaultValue={defaults.costPrice ?? 0} className="tabular" />
            </Field>
            <Field>
              <Label htmlFor="sellPrice">Sell price (৳)</Label>
              <Input id="sellPrice" name="sellPrice" type="number" min={0} defaultValue={defaults.sellPrice ?? 0} className="tabular" />
            </Field>
            <Field>
              <Label htmlFor="targetStock">Target stock level</Label>
              <Input id="targetStock" name="targetStock" type="number" min={0} defaultValue={defaults.targetStock ?? 0} className="tabular" />
              <p className="mt-1 text-xs text-muted-foreground">How many units you aim to keep in stock (0 = no target).</p>
            </Field>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" variant="gold" className="flex-1" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {mode === "create" ? "Create product" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
