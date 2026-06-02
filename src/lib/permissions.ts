// Pure, client-safe role helpers (no server-only imports).
// Hierarchy: ADMIN > MANAGER > STAFF.

/** Admin only — hard-delete any entry. */
export const canDelete = (role: string) => role === "ADMIN";

/** Create/edit catalogue, suppliers, and purchasing. Admin + Manager. */
export const canManageCatalog = (role: string) =>
  role === "ADMIN" || role === "MANAGER";

/** Day-to-day operations: sales, stock movements, customers. All roles. */
export const canOperate = (role: string) =>
  role === "ADMIN" || role === "MANAGER" || role === "STAFF";

/** See financial figures (revenue + sales trend). Hidden from Staff. */
export const canViewFinancials = (role: string) =>
  role === "ADMIN" || role === "MANAGER";
