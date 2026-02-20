import { useAuthStore, UserRole } from "../store/authStore";
export type Permission =
  | "manage_invoices"
  | "view_security_logs"
  | "manage_users"
  | "manage_settings"
  | "manage"
  | "view_all";
export function usePermissions() {
  const { userProfile } = useAuthStore();
  const hasPermission = (permission: Permission): boolean => {
    if (!userProfile) return false;
    const adminRoles: UserRole[] = ["super_admin", "directeur_general", "admin"];
    const managerRoles: UserRole[] = ["responsable_commercial", "manager"];
    if (adminRoles.includes(userProfile.role)) return true;
    if (managerRoles.includes(userProfile.role)) {
      if (permission === "manage" || permission === "manage_invoices") return true;
    }
    return false;
  };
  return { hasPermission };
}