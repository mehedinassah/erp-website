// SQLite has no native enums, so these string unions are the single source of
// truth, validated at the app boundary with zod.

export const ROLES = ["ADMIN", "MANAGER", "STAFF"] as const;
export type Role = (typeof ROLES)[number];

export const GENDERS = ["MEN", "WOMEN", "UNISEX", "KIDS"] as const;
export type Gender = (typeof GENDERS)[number];

// ---- Business type (drives catalog labels & which fields show) ----
export const BUSINESS_TYPES = ["CLOTHING", "GROCERY", "PHARMACY", "GENERAL"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABEL: Record<BusinessType, string> = {
  CLOTHING: "Clothing / Fashion",
  GROCERY: "Grocery / Retail",
  PHARMACY: "Pharmacy",
  GENERAL: "General / Other",
};

/** The two variant axes, relabeled per business type. axis2 optional. */
export const VARIANT_AXES: Record<
  BusinessType,
  { axis1: string; axis2: string | null; clothingChips: boolean }
> = {
  CLOTHING: { axis1: "Size", axis2: "Colour", clothingChips: true },
  GROCERY: { axis1: "Size / Weight", axis2: "Pack", clothingChips: false },
  PHARMACY: { axis1: "Strength", axis2: "Pack", clothingChips: false },
  GENERAL: { axis1: "Variant", axis2: "Option", clothingChips: false },
};

/** Whether clothing-specific fields (audience/material/season) should show. */
export function showsClothingFields(bt: string): boolean {
  return bt === "CLOTHING";
}

export const PRODUCT_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const MOVEMENT_TYPES = [
  "PURCHASE_IN",
  "SALE_OUT",
  "ADJUSTMENT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const PO_STATUSES = [
  "DRAFT",
  "ORDERED",
  "PARTIAL",
  "RECEIVED",
  "CANCELLED",
] as const;
export type PurchaseOrderStatus = (typeof PO_STATUSES)[number];

export const SO_STATUSES = [
  "DRAFT",
  "CONFIRMED",
  "FULFILLED",
  "CANCELLED",
] as const;
export type SalesOrderStatus = (typeof SO_STATUSES)[number];

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

// ---- Dena–Paona ledger ----
export const LEDGER_TYPES = ["PAONA", "DENA"] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export const ENTRY_KINDS = ["PAYMENT", "CHARGE"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

export const PAYMENT_METHODS = ["CASH", "BANK", "MOBILE", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// ---- Expense categories ----
export const EXPENSE_CATEGORIES = [
  "RENT", "SALARY", "UTILITIES", "TRANSPORT", "MARKETING", "SUPPLIES", "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  RENT: "Rent",
  SALARY: "Salary / wages",
  UTILITIES: "Utilities (electric, gas, water)",
  TRANSPORT: "Transport / delivery",
  MARKETING: "Marketing / ads",
  SUPPLIES: "Supplies",
  OTHER: "Other",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK: "Bank",
  MOBILE: "Mobile banking",
  OTHER: "Other",
};

export const LEDGER_TYPE_LABEL: Record<LedgerType, string> = {
  PAONA: "Paona (receivable)",
  DENA: "Dena (payable)",
};

// Human-friendly labels + tone for status badges
export const PO_STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  DRAFT: "Draft",
  ORDERED: "Ordered",
  PARTIAL: "Partially received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export const SO_STATUS_LABEL: Record<SalesOrderStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  STAFF: "Staff",
};

// ---- Payment status ----
export const PAYMENT_STATUSES = ["UNPAID", "PARTIAL", "PAID"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partially paid",
  PAID: "Paid",
};

// ---- Quotations ----
export const QUOTE_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "DECLINED",
  "EXPIRED",
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};
