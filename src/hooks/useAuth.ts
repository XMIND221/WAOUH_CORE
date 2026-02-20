import { useAuthStore } from "../store/authStore";
export function useAuth() {
  const { session, userProfile, companyId, isLoading, signIn, signOut, bootstrap } = useAuthStore();
  return {
    session,
    userProfile,
    companyId,
    isLoading,
    signIn,
    signOut,
    bootstrap,
    isAuthenticated: !!session,
  };
}