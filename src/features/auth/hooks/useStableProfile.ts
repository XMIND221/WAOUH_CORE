// filepath: d:\WAOUH_CORE\waouh_core_app\src\features\auth\hooks\useStableProfile.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import type { UserRole } from "../../../types/auth.types";
type StableProfile = {
  id: string;
  email: string;
  company_id: string | null;
  role: UserRole | null;
  pin_initialized: boolean;
  must_change_pin: boolean;
} & Record<string, unknown>;
type UseStableProfileOptions = { enabled?: boolean; userId?: string | null };
type UserProfileRow = {
  id: string;
  email?: string | null;
  company_id?: string | null;
  role?: string | null;
  pin_initialized?: boolean | null;
  must_change_pin?: boolean | null;
} & Record<string, unknown>;
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Profile fetch failed";
}
export function useStableProfile(options: UseStableProfileOptions = {}) {
  const { enabled = true, userId = null } = options;
  const mountedRef = useRef(true);
  const [profile, setProfile] = useState<StableProfile | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(enabled));
  const [error, setError] = useState<string | null>(null);
  const loadProfile = useCallback(async () => {
    if (!enabled) {
      setProfile(null); setCompanyId(null); setRole(null); setError(null); setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    try {
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) throw getUserError;
      const currentUserId = userId ?? user?.id ?? null;
      if (!currentUserId) {
        if (!mountedRef.current) return;
        setProfile(null); setCompanyId(null); setRole(null);
        return;
      }
      const { data, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", currentUserId)
        .maybeSingle<UserProfileRow>();
      if (profileError) throw profileError;
      if (!mountedRef.current) return;
      if (!data) {
        setProfile(null); setCompanyId(null); setRole(null);
        return;
      }
      const normalized: StableProfile = {
        ...data,
        id: String(data.id),
        email: String(data.email ?? user?.email ?? ""),
        company_id: data.company_id ?? null,
        role: (data.role ?? null) as UserRole | null,
        pin_initialized: Boolean(data.pin_initialized ?? false),
        must_change_pin: Boolean(data.must_change_pin ?? false),
      };
      setProfile(normalized);
      setCompanyId(normalized.company_id);
      setRole(normalized.role);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(toErrorMessage(e));
      setProfile(null); setCompanyId(null); setRole(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled, userId]);
  useEffect(() => {
    mountedRef.current = true;
    void loadProfile();
    return () => { mountedRef.current = false; };
  }, [loadProfile]);
  return useMemo(() => ({
    profile, companyId, role, loading, error, reload: loadProfile
  }), [profile, companyId, role, loading, error, loadProfile]);
}
