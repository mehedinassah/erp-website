// Pure, client-safe role helpers (no server-only imports).
// Hierarchy: ADMIN > MANAGER > STAFF.

/** Admin only — hard-delete any entry. */
export const canDelete = (role: string) => role === "ADMIN";

/** Create/edit suppliers and purchasing. Admin + Manager. */
export const canManageCatalog = (role: string) =>
  role === "ADMIN" || role === "MANAGER";

/** Create/edit products. All roles (Staff included). */
export const canManageProducts = (role: string) =>
  role === "ADMIN" || role === "MANAGER" || role === "STAFF";

/** Day-to-day operations: sales, stock movements, customers. All roles. */
export const canOperate = (role: string) =>
  role === "ADMIN" || role === "MANAGER" || role === "STAFF";

/** See financial figures (revenue + sales trend). Hidden from Staff. */
export const canViewFinancials = (role: string) =>
  role === "ADMIN" || role === "MANAGER";

/** Edit the Dena–Paona ledger (accounts + transactions). Admin + Manager.
 *  Staff can view only; delete is admin-only via canDelete. */
export const canManageLedger = (role: string) =>
  role === "ADMIN" || role === "MANAGER";
