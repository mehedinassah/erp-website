import { z } from "zod";
import { GENDERS, PRODUCT_STATUSES } from "./enums";

// Stable-across-versions enum helper (avoids z.enum/z.email API drift).
const oneOf = (arr: readonly string[], msg = "Invalid value") =>
  z.string().refine((v) => arr.includes(v), msg);

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  sku: z.string().trim().min(2, "SKU is required"),
  categoryId: z.string().min(1, "Choose a category"),
  gender: oneOf(GENDERS),
  material: optionalText,
  season: optionalText,
  description: optionalText,
  imageUrl: optionalText,
  costPrice: z.coerce.number().int().min(0),
  sellPrice: z.coerce.number().int().min(0),
  status: oneOf(PRODUCT_STATUSES).default("ACTIVE"),
});

export const variantInputSchema = z.object({
  size: z.string().trim().min(1),
  color: z.string().trim().min(1),
  colorHex: z.string().trim().nullable().optional(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  contactName: optionalText,
  phone: optionalText,
  email: optionalText,
  address: optionalText,
});

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  phone: optionalText,
  email: optionalText,
  address: optionalText,
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
});

export const warehouseSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .transform((s) => s.toUpperCase()),
  address: optionalText,
});

/** URL-safe slug from a free-text name. */
export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Collapse a ZodError into a flat field→message map. */
export function fieldErrorsFrom(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
