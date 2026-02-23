import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
type AppRole = string;
type StableProfile = {
  id: string;
  email: string;
  role: AppRole;
  company_id: string | null;
  pin_initialized: boolean;
  must_change_pin: boolean;
} & Record<string, unknown>;
type UseStableProfileOptions = {
  enabled?: boolean;
  userId?: string | null;
};
type ProfileRow = {
  id: string;
  email?: string | null;
  role?: string | null;
  company_id?: string | null;
  pin_initialized?: boolean | null;
  must_change_pin?: boolean | null;
} & Record<string, unknown>;
const DEFAULT_ROLE = "user";
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Profile loading failed";
}
export function useStableProfile(options: UseStableProfileOptions = {}) {
  const { enabled = true, userId = null } = options;
  const mountedRef = useRef(true);
  const [profile, setProfile] = useState<StableProfile | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole>(DEFAULT_ROLE);
  const [loading, setLoading] = useState<boolean>(Boolean(enabled));
  const [error, setError] = useState<string | null>(null);
  const setFallbackProfile = useCallback((uid: string, email: string) => {
    const fallback: StableProfile = {
      id: uid,
      email: email || "",
      role: DEFAULT_ROLE,
      company_id: null,
      pin_initialized: false,
      must_change_pin: false,
    };
    setProfile(fallback);
    setCompanyId(null);
    setRole(DEFAULT_ROLE);
  }, []);
  const loadProfile = useCallback(async () => {
    if (!enabled) {
      setProfile(null);
      setCompanyId(null);
      setRole(DEFAULT_ROLE);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      const uid = userId ?? user?.id ?? null;
      const email = String(user?.email ?? "");
      if (!uid) {
        if (!mountedRef.current) return;
        setProfile(null);
        setCompanyId(null);
        setRole(DEFAULT_ROLE);
        return;
      }
      const { data: row, error: selectError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle<ProfileRow>();
      if (!mountedRef.current) return;
      if (row && !selectError) {
        setProfile({
          ...row,
          id: String(row.id),
          email: String(row.email ?? email),
          role: String(row.role ?? DEFAULT_ROLE),
          company_id: row.company_id ?? null,
          pin_initialized: Boolean(row.pin_initialized ?? false),
          must_change_pin: Boolean(row.must_change_pin ?? false),
        });
        setCompanyId(row.company_id ?? null);
        setRole(String(row.role ?? DEFAULT_ROLE));
        return;
      }
      await supabase
        .from("user_profiles")
        .upsert(
          {
            id: uid,
            email: email || null,
            role: DEFAULT_ROLE,
            company_id: null,
            pin_initialized: false,
            must_change_pin: false,
          },
          { onConflict: "id" }
        );
      if (!mountedRef.current) return;
      setFallbackProfile(uid, email);
      if (selectError) {
        setError(toErrorMessage(selectError));
      }
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(toErrorMessage(e));
      if (userId) setFallbackProfile(userId, "");
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [enabled, userId, setFallbackProfile]);
  useEffect(() => {
    mountedRef.current = true;
    void loadProfile();
    return () => {
      mountedRef.current = false;
    };
  }, [loadProfile]);
  return useMemo(
    () => ({
      profile,
      companyId,
      role: role || DEFAULT_ROLE,
      loading,
      error,
      reload: loadProfile,
    }),
    [profile, companyId, role, loading, error, loadProfile]
  );
}
