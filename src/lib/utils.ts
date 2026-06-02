import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL/identifier-safe slug from arbitrary text. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Short uppercase token for SKUs, e.g. colour or size codes. */
export function code(s: string, len = 3): string {
  return s.replace(/[^a-zA-Z0-9]/g, "").slice(0, len).toUpperCase();
}

