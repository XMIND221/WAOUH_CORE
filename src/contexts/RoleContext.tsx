import React, { createContext, useContext, ReactNode } from "react";
import { useAuthStore, UserRole } from "../store/authStore";
interface RoleContextType {
  role: UserRole | null;
  isAdmin: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}
const RoleContext = createContext<RoleContextType>({
  role: null,
  isAdmin: false,
  isManager: false,
  isSuperAdmin: false,
  isLoading: true,
  hasPermission: () => false,
});
export function RoleProvider({ children }: { children: ReactNode }) {
  const { userProfile, isLoading } = useAuthStore();
  const hasPermission = (permission: string): boolean => {
    if (!userProfile) return false;
    const adminRoles: UserRole[] = ["super_admin", "directeur_general", "admin"];
    const managerRoles: UserRole[] = ["responsable_commercial", "manager"];
    if (adminRoles.includes(userProfile.role)) return true;
    if (permission === "manage" && managerRoles.includes(userProfile.role)) return true;
    return false;
  };
  const isSuperAdmin =
    userProfile?.role === "super_admin" || userProfile?.role === "directeur_general";
  const isAdmin = isSuperAdmin || userProfile?.role === "admin";
  const isManager =
    isAdmin ||
    userProfile?.role === "manager" ||
    userProfile?.role === "responsable_commercial";
  return (
    <RoleContext.Provider value={{ role: userProfile?.role || null, isAdmin, isManager, isSuperAdmin, isLoading, hasPermission }}>
      {children}
    </RoleContext.Provider>
  );
}
export const useRole = () => useContext(RoleContext);