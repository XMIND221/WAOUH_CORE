import { useAuthStore } from "../store/authStore";
export function useCompanyId() {
  return useAuthStore((s) => s.companyId);
}
export function useUserId() {
  return useAuthStore((s) => s.session?.user.id ?? null);
}
