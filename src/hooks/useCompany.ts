import { useAuthStore } from "../store/authStore";
export function useCompanyId() {
  return useAuthStore((s) => s.companyId ?? s.userProfile?.company_id ?? null);
}
export function useUserId() {
  return useAuthStore((s) => s.user?.id ?? null);
}