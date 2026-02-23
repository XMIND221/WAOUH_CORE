import { useMemo } from "react";
import { useAuth } from "./useAuth";
export type AppRole = "admin" | "manager" | "user";
export type Capability =
  | "crm.read"
  | "crm.write"
  | "projects.read"
  | "projects.write"
  | "projects.readOwn"
  | "tasks.read"
  | "tasks.write"
  | "tasks.readOwn"
  | "messaging.read"
  | "messaging.write"
  | "timeline.read"
  | "security.logs.read"
  | "finance.read"
  | "finance.write";
type RoleMatrix = Record<AppRole, Record<Capability, boolean>>;
const ROLE_MATRIX: RoleMatrix = {
  admin: {
    "crm.read": true,
    "crm.write": true,
    "projects.read": true,
    "projects.write": true,
    "projects.readOwn": true,
    "tasks.read": true,
    "tasks.write": true,
    "tasks.readOwn": true,
    "messaging.read": true,
    "messaging.write": true,
    "timeline.read": true,
    "security.logs.read": true,
    "finance.read": true,
    "finance.write": true,
  },
  manager: {
    "crm.read": true,
    "crm.write": true,
    "projects.read": true,
    "projects.write": true,
    "projects.readOwn": true,
    "tasks.read": true,
    "tasks.write": true,
    "tasks.readOwn": true,
    "messaging.read": true,
    "messaging.write": true,
    "timeline.read": true,
    "security.logs.read": false,
    "finance.read": false,
    "finance.write": false,
  },
  user: {
    "crm.read": true,
    "crm.write": false,
    "projects.read": false,
    "projects.write": false,
    "projects.readOwn": true,
    "tasks.read": false,
    "tasks.write": false,
    "tasks.readOwn": true,
    "messaging.read": true,
    "messaging.write": true,
    "timeline.read": true,
    "security.logs.read": false,
    "finance.read": false,
    "finance.write": false,
  },
};
function normalizeRole(input: string | null | undefined): AppRole {
  const v = String(input ?? "").toLowerCase();
  if (v === "admin") return "admin";
  if (v === "manager") return "manager";
  return "user";
}
export function useRole() {
  const { role: rawRole, user } = useAuth();
  const role = useMemo<AppRole>(() => normalizeRole(rawRole), [rawRole]);
  const can = (capability: Capability): boolean => ROLE_MATRIX[role][capability] ?? false;
  const canAny = (capabilities: Capability[]): boolean => capabilities.some((c) => can(c));
  const canAll = (capabilities: Capability[]): boolean => capabilities.every((c) => can(c));
  const canAccessOwnResource = (ownerId?: string | null): boolean => {
    if (!ownerId) return false;
    if (role === "admin" || role === "manager") return true;
    return user?.id === ownerId;
  };
  return {
    role,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isUser: role === "user",
    can,
    canAny,
    canAll,
    canAccessOwnResource,
    canViewSecurityLogs: can("security.logs.read"),
    canAccessFinance: can("finance.read"),
    canEditCRM: can("crm.write"),
  };
}
