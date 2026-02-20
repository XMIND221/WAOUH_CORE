import { useAuthStore, UserRole } from "../../store/authStore";
export function getSessionTimeout(role: UserRole): number {
  const adminRoles: UserRole[] = ["super_admin", "directeur_general", "admin"];
  if (adminRoles.includes(role)) {
    return 60 * 60 * 1000; // 1 heure pour les admins
  }
  return 30 * 60 * 1000; // 30 minutes pour les autres
}
export function checkSessionValidity(): boolean {
  const { userProfile, session } = useAuthStore.getState();
  if (!session || !userProfile) return false;
  return true;
}