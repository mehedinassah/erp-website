"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, Field, FieldError } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GENDERS, PRODUCT_STATUSES, SIZES } from "@/lib/enums";
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
  description?: string | null;
  costPrice?: number;
  sellPrice?: number;
  status?: string;
};

export function ProductForm({
  mode,
  action,
  categories,
  defaults = {},
}: {
  mode: "create" | "edit";
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  categories: Category[];
  defaults?: Defaults;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );

  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  const variants = useMemo(() => {
    const out: { size: string; color: string; colorHex: string }[] = [];
    for (const s of sizes)
      for (const c of colors) {
        const hex = COLOR_PALETTE.find((p) => p.name === c)?.hex ?? null;
        out.push({ size: s, color: c, colorHex: hex ?? "#999" });
      }
    return out;
  }, [sizes, colors]);

  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />

      {/* Left: core details */}
      <div className="space-y-6 lg:col-span-2">
        {state.error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
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
              <Label htmlFor="name" required>
                Product name
              </Label>
              <Input id="name" name="name" defaultValue={defaults.name} placeholder="Hand-Block Cotton Panjabi" />
              <FieldError>{fe.name}</FieldError>
            </Field>

            <Field>
              <Label htmlFor="sku" required>
                Base SKU
              </Label>
              <Input id="sku" name="sku" defaultValue={defaults.sku} placeholder="PAN-001" className="uppercase" />
              <FieldError>{fe.sku}</FieldError>
            </Field>

            <Field>
              <Label htmlFor="categoryId" required>
                Category
              </Label>
              <Select id="categoryId" name="categoryId" defaultValue={defaults.categoryId ?? ""}>
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <FieldError>{fe.categoryId}</FieldError>
            </Field>

            <Field>
              <Label htmlFor="gender">Audience</Label>
              <Select id="gender" name="gender" defaultValue={defaults.gender ?? "UNISEX"}>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g.charAt(0) + g.slice(1).toLowerCase()}
                  </option>
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

            {mode === "edit" && (
              <Field>
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue={defaults.status ?? "ACTIVE"}>
                  {PRODUCT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

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
              <div>
                <Label>Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => {
                    const on = sizes.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() =>
                          setSizes((prev) =>
                            on ? prev.filter((x) => x !== s) : [...prev, s],
                          )
                        }
                        className={cn(
                          "h-9 min-w-11 rounded-md border px-3 text-sm font-medium transition-colors cursor-pointer",
                          on
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-surface hover:bg-muted",
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Colours</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => {
                    const on = colors.includes(c.name);
                    return (
                      <button
                        type="button"
                        key={c.name}
                        onClick={() =>
                          setColors((prev) =>
                            on
                              ? prev.filter((x) => x !== c.name)
                              : [...prev, c.name],
                          )
                        }
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors cursor-pointer",
                          on
                            ? "border-accent ring-1 ring-accent"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        <span
                          className="size-4 rounded-full border border-black/10"
                          style={{ background: c.hex }}
                        />
                        {c.name}
                        {on && <Check className="size-3.5 text-accent" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                {variants.length > 0 ? (
                  <>
                    <span className="font-medium text-foreground">
                      {variants.length} variant{variants.length > 1 ? "s" : ""}
                    </span>{" "}
                    will be created ({sizes.length} sizes × {colors.length}{" "}
                    colours). Stock starts at 0 — add stock from the Stock
                    Control screen.
                  </>
                ) : (
                  "Pick at least one size and one colour to generate variants."
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: pricing + submit */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
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
