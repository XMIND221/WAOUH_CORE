/* filepath: d:\WAOUH_CORE\waouh_core_app\src\store\authStore.ts */
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { UserRole, UserProfile } from "../types/auth.types";
export type { UserRole, UserProfile };
type AuthUser = { id: string; email?: string | null };
interface Session {
  user: AuthUser;
  access_token: string;
  expires_at?: number;
}
interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  userProfile: UserProfile | null;
  companyId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ requiresPasswordChange: boolean }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  fetchUserProfile: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearPasswordChangeFlag: () => Promise<void>;
}
function asRow(data: unknown): (UserProfile & { company_id: string | null }) | null {
  if (Array.isArray(data)) return (data[0] as UserProfile & { company_id: string | null }) ?? null;
  if (typeof data === "object" && data !== null) return data as UserProfile & { company_id: string | null };
  return null;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  userProfile: null,
  companyId: null,
  isLoading: true,
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ user: data.user ? { id: data.user.id, email: data.user.email } : null, session: data.session as Session, isLoading: true });
    await get().fetchUserProfile();
    return { requiresPasswordChange: Boolean(get().userProfile?.must_change_password) };
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, userProfile: null, companyId: null, isLoading: false });
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, userProfile: null, companyId: null, isLoading: false });
  },
  bootstrap: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ user: null, session: null, userProfile: null, companyId: null, isLoading: false });
        return;
      }
      set({ user: { id: session.user.id, email: session.user.email }, session: session as Session });
      await get().fetchUserProfile();
    } finally {
      set({ isLoading: false });
    }
  },
  setUser: (user) => set({ user }),
  setUserProfile: (profile) => set({ userProfile: profile, companyId: profile?.company_id ?? null }),
  fetchUserProfile: async () => {
    set({ isLoading: true });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        set({ userProfile: null, companyId: null, isLoading: false });
        return;
      }
      const { data, error } = await supabase.rpc("ensure_my_profile");
      if (error) throw error;
      const row = asRow(data);
      const companyId = row?.company_id ?? null;
      set({
        user: { id: userData.user.id, email: userData.user.email },
        userProfile: (row as UserProfile) ?? null,
        companyId,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
  clearPasswordChangeFlag: async () => {
    const userId = get().user?.id;
    if (!userId) return;
    const { error } = await supabase.from("users").update({ must_change_password: false }).eq("id", userId);
    if (error) throw error;
    set((s) => ({ userProfile: s.userProfile ? { ...s.userProfile, must_change_password: false } : null }));
  },
}));
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    useAuthStore.setState({ user: { id: session.user.id, email: session.user.email }, session: session as Session, isLoading: true });
    await useAuthStore.getState().fetchUserProfile();
  } else {
    useAuthStore.setState({ user: null, session: null, userProfile: null, companyId: null, isLoading: false });
  }
});
