export const ROLES = {
  ADMIN_GLOBAL: "admin_global",
  DIRECTOR: "director",
  SALES: "sales",
  FINANCE: "finance",
  DESIGNER: "designer",
  HR: "hr",
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];
