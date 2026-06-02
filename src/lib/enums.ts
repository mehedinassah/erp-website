// SQLite has no native enums, so these string unions are the single source of
// truth, validated at the app boundary with zod.

export const ROLES = ["ADMIN", "MANAGER", "STAFF"] as const;
export type Role = (typeof ROLES)[number];

export const GENDERS = ["MEN", "WOMEN", "UNISEX", "KIDS"] as const;
export type Gender = (typeof GENDERS)[number];

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
