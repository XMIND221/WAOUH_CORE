import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { UserRole, UserProfile } from "../types/auth.types";
export type { UserRole, UserProfile };
interface Session {
  user: { id: string; email?: string };
  access_token: string;
  expires_at?: number;
}
interface AuthState {
  user: any | null;
  session: Session | null;
  userProfile: UserProfile | null;
  companyId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ requiresPasswordChange: boolean }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  setUser: (user: any) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  fetchUserProfile: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearPasswordChangeFlag: () => Promise<void>;
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
    set({ user: data.user, session: data.session as Session });
    await get().fetchUserProfile();
    return { requiresPasswordChange: get().userProfile?.must_change_password || false };
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, userProfile: null, companyId: null });
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, userProfile: null, companyId: null });
  },
  bootstrap: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ user: null, session: null, userProfile: null, companyId: null, isLoading: false });
        return;
      }
      set({ user: session.user, session: session as Session });
      await get().fetchUserProfile();
    } catch (e) {
      console.error("bootstrap error:", e);
      set({ isLoading: false });
    }
  },
  setUser: (user) => set({ user }),
  setUserProfile: (profile) => set({
    userProfile: profile,
    companyId: profile?.company_id ?? null,
  }),
  fetchUserProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ userProfile: null, companyId: null, isLoading: false });
        return;
      }
      // 1) users
      const usersRes = await supabase.from("users").select("*").eq("id", user.id).single();
      let profile: any = usersRes.data;
      let err: any = usersRes.error;
      // 2) fallback user_profiles
      if (err || !profile) {
        const pRes = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
        profile = pRes.data;
        err = pRes.error;
      }
      if (err || !profile) {
        console.error("fetchUserProfile error:", err?.message ?? "profile not found");
        set({ user, userProfile: null, companyId: null, isLoading: false });
        return;
      }
      set({
        user,
        userProfile: profile as UserProfile,
        companyId: profile.company_id ?? null,
        isLoading: false,
      });
    } catch (e) {
      console.error("fetchUserProfile exception:", e);
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
    set((s) => ({
      userProfile: s.userProfile ? { ...s.userProfile, must_change_password: false } : null,
    }));
  },
}));
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    useAuthStore.setState({ user: session.user, session: session as Session });
    await useAuthStore.getState().fetchUserProfile();
  } else if (event === "SIGNED_OUT") {
    useAuthStore.setState({
      user: null,
      session: null,
      userProfile: null,
      companyId: null,
      isLoading: false,
    });
  }
});