import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { useStableProfile } from "./useStableProfile";
import { logSecurityEvent } from "../../security/hooks/usePinSecurity";
type AuthUser = { id: string; email?: string | null };
type AuthSession = { access_token: string; expires_at?: number; user: AuthUser };
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Authentication failed";
}
async function resolveCompanyId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle<{ company_id: string | null }>();
  return data?.company_id ?? null;
}
export function useAuth() {
  const mountedRef = useRef(true);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = Boolean(user && session);
  const profileState = useStableProfile({
    enabled: isAuthenticated,
    userId: user?.id ?? null,
  });
  const setAuthState = useCallback((nextUser: AuthUser | null, nextSession: AuthSession | null) => {
    useAuthStore.setState({
      user: nextUser,
      session: nextSession,
      isLoading: false,
    });
  }, []);
  const bootstrapAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (currentSession?.user) {
        setAuthState(
          { id: currentSession.user.id, email: currentSession.user.email },
          currentSession as AuthSession
        );
      } else {
        setAuthState(null, null);
      }
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(toErrorMessage(e));
      setAuthState(null, null);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [setAuthState]);
  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (data.session?.user) {
          const authUser = { id: data.session.user.id, email: data.session.user.email };
          setAuthState(authUser, data.session as AuthSession);
          const companyId = await resolveCompanyId(authUser.id);
          await logSecurityEvent({
            eventType: "LOGIN_SUCCESS",
            companyId,
            actorId: authUser.id,
            actorEmail: authUser.email ?? null,
            message: "Connexion réussie",
            metadata: { source: "useAuth.signIn" },
          });
        } else {
          setAuthState(null, null);
        }
        return { ok: true as const, error: null };
      } catch (e: unknown) {
        const message = toErrorMessage(e);
        if (mountedRef.current) {
          setError(message);
          setAuthState(null, null);
        }
        await logSecurityEvent({
          eventType: "LOGIN_FAILURE",
          companyId: null,
          actorId: null,
          actorEmail: email,
          message: "Échec de connexion",
          metadata: { source: "useAuth.signIn", error: message },
        });
        return { ok: false as const, error: message };
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
      }
    },
    [setAuthState]
  );
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.auth.signOut();
      setAuthState(null, null);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(toErrorMessage(e));
      setAuthState(null, null);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [setAuthState]);
  useEffect(() => {
    mountedRef.current = true;
    void bootstrapAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mountedRef.current) return;
      if (nextSession?.user) {
        setAuthState(
          { id: nextSession.user.id, email: nextSession.user.email },
          nextSession as AuthSession
        );
      } else {
        setAuthState(null, null);
      }
      setLoading(false);
    });
    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [bootstrapAuth, setAuthState]);
  return useMemo(
    () => ({
      user,
      session,
      isAuthenticated,
      loading,
      error,
      signIn,
      signOut,
      logout: signOut,
      profile: profileState.profile,
      companyId: profileState.companyId,
      role: profileState.role || "user",
      profileLoading: profileState.loading,
      profileError: profileState.error,
      reloadProfile: profileState.reload,
    }),
    [
      user,
      session,
      isAuthenticated,
      loading,
      error,
      signIn,
      signOut,
      profileState.profile,
      profileState.companyId,
      profileState.role,
      profileState.loading,
      profileState.error,
      profileState.reload,
    ]
  );
}
