// filepath: d:\WAOUH_CORE\waouh_core_app\src\features\auth\hooks\useStableProfile.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import type { UserRole } from "../../../types/auth.types";
type StableProfile = {
  id: string;
  email: string;
  company_id: string;
  role: UserRole;
  pin_initialized: boolean;
  must_change_pin: boolean;
} & Record<string, unknown>;
type StableProfileState = {
  profile: StableProfile | null;
  companyId: string | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
};
type EnsureMyProfileRpc = {
  id: string;
  email?: string | null;
  company_id: string | null;
  role: string | null;
  pin_initialized: boolean | null;
  must_change_pin: boolean | null;
} & Record<string, unknown>;
const DEFAULT_ROLE = "employee" as UserRole;
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown profile error";
}
function normalizeRpcRow(data: unknown): EnsureMyProfileRpc | null {
  if (Array.isArray(data)) return (data[0] as EnsureMyProfileRpc) ?? null;
  if (typeof data === "object" && data !== null) return data as EnsureMyProfileRpc;
  return null;
}
export function useStableProfile() {
  const [state, setState] = useState<StableProfileState>({
    profile: null,
    companyId: null,
    role: null,
    loading: true,
    error: null,
  });
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const authUser = userData.user;
      if (!authUser) {
        setState({ profile: null, companyId: null, role: null, loading: false, error: null });
        return;
      }
      const { data, error } = await supabase.rpc("ensure_my_profile");
      if (error) throw error;
      const row = normalizeRpcRow(data);
      if (!row || !row.company_id) {
        throw new Error("Profile company_id missing");
      }
      const profile: StableProfile = {
        ...row,
        id: String(row.id),
        email: typeof row.email === "string" && row.email.length > 0 ? row.email : String(authUser.email ?? ""),
        company_id: String(row.company_id),
        role: (row.role ?? DEFAULT_ROLE) as UserRole,
        pin_initialized: Boolean(row.pin_initialized ?? false),
        must_change_pin: Boolean(row.must_change_pin ?? false),
      };
      setState({
        profile,
        companyId: profile.company_id,
        role: profile.role,
        loading: false,
        error: null,
      });
    } catch (e: unknown) {
      setState({
        profile: null,
        companyId: null,
        role: DEFAULT_ROLE,
        loading: false,
        error: toErrorMessage(e),
      });
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return useMemo(() => ({ ...state, reload: load }), [state, load]);
}
