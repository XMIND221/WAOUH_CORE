import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { logSecurity } from "../services/logging";
type AuthState = {
  session: Session | null;
  isLoading: boolean;
  userProfile: any | null;
  companyId: string | null;
  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  userProfile: null,
  companyId: null,
  bootstrap: async () => {
    set({ isLoading: true });
    const { data } = await supabase.auth.getSession();
    const session = data.session ?? null;
    if (session) {
      const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single();
      set({
        session,
        userProfile: profile ?? null,
        companyId: profile?.company_id ?? null,
        isLoading: false,
      });
    } else {
      set({ session: null, userProfile: null, companyId: null, isLoading: false });
    }
  },
  signIn: async (email, password) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false });
      await logSecurity({ email, event: "login", status: "failure" });
      return;
    }
    const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single();
    const companyId = profile?.company_id ?? null;
    set({ session: data.session, userProfile: profile ?? null, companyId, isLoading: false });
    if (companyId) {
      await logSecurity({ companyId, userId: data.user.id, event: "login", status: "success" });
    }
  },
  signOut: async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session ?? null;
    const companyId = session
      ? (await supabase.from("users").select("company_id").eq("id", session.user.id).single()).data?.company_id
      : null;
    await supabase.auth.signOut();
    set({ session: null, userProfile: null, companyId: null, isLoading: false });
    if (companyId) {
      await logSecurity({ companyId, userId: session?.user.id ?? null, event: "logout", status: "success" });
    }
  },
}));
