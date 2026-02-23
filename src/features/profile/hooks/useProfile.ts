import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
import { usePinSecurity, logCriticalAction } from "../../security/hooks/usePinSecurity";
type RawProfileRow = Record<string, unknown>;
export type ProfileData = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  companyId: string | null;
  companyName: string;
  accountStatus: string;
  lastLoginAt: string | null;
};
export type SecurityActivity = {
  label: string;
  createdAt: string | null;
};
function toSafeString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function toSafeNullableString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
function normalizeRole(role: string | null | undefined): string {
  const v = String(role ?? "").toLowerCase();
  if (v === "admin" || v === "manager" || v === "user") return v;
  return "user";
}
function isValidName(input: string): boolean {
  const value = input.trim();
  if (value.length < 1 || value.length > 60) return false;
  return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(value);
}
function isValidAvatarUrl(input: string): boolean {
  const v = input.trim();
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
async function logAuditEvent(params: {
  companyId: string | null;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabase.from("audit_logs").insert({
      company_id: params.companyId,
      actor_id: params.actorId,
      action: params.action,
      entity_type: "profile",
      metadata: params.metadata ?? {},
      created_at: new Date().toISOString(),
    });
  } catch {
  }
}
export function useProfile() {
  const mountedRef = useRef(true);
  const { user, role, companyId, isAuthenticated } = useAuth();
  const { verifyPin, setPin, pinLoading } = usePinSecurity();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [securityActivity, setSecurityActivity] = useState<SecurityActivity | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [pinSaving, setPinSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchCompanyName = useCallback(async (targetCompanyId: string | null) => {
    if (!targetCompanyId) return "";
    try {
      const { data } = await supabase
        .from("companies")
        .select("name")
        .eq("id", targetCompanyId)
        .maybeSingle<{ name?: string | null }>();
      return data?.name ?? "";
    } catch {
      return "";
    }
  }, []);
  const fetchLastSecurityActivity = useCallback(async () => {
    if (!isAuthenticated || !companyId || !user?.id) {
      setSecurityActivity(null);
      return;
    }
    try {
      const { data } = await supabase
        .from("security_logs")
        .select("created_at,event_type,action,message")
        .eq("company_id", companyId)
        .eq("actor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const row = (data?.[0] ?? null) as RawProfileRow | null;
      if (!mountedRef.current) return;
      if (!row) {
        setSecurityActivity(null);
        return;
      }
      const label =
        toSafeString(row.event_type) ||
        toSafeString(row.action) ||
        toSafeString(row.message) ||
        "Security activity";
      setSecurityActivity({
        label,
        createdAt: toSafeNullableString(row.created_at),
      });
    } catch {
      if (!mountedRef.current) return;
      setSecurityActivity(null);
    }
  }, [isAuthenticated, companyId, user?.id]);
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      if (!mountedRef.current) return;
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      let row = (data ?? null) as RawProfileRow | null;
      if (!row) {
        try {
          await supabase.from("user_profiles").insert({
            id: user.id,
            company_id: companyId ?? null,
            role: normalizeRole(role),
            created_at: new Date().toISOString(),
          });
          const created = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          row = (created.data ?? null) as RawProfileRow | null;
        } catch {
          row = null;
        }
      }
      const firstName = toSafeString(row?.first_name, "");
      const lastName = toSafeString(row?.last_name, "");
      const fullNameFromFields = `${firstName} ${lastName}`.trim();
      const fallbackName = toSafeString(user.email, "Utilisateur");
      const companyFromRow = toSafeNullableString(row?.company_id) ?? companyId ?? null;
      const companyName = await fetchCompanyName(companyFromRow);
      if (!mountedRef.current) return;
      setProfile({
        id: user.id,
        firstName,
        lastName,
        fullName: fullNameFromFields || fallbackName,
        avatarUrl: toSafeNullableString(row?.avatar_url),
        role: normalizeRole(toSafeString(row?.role, role ?? "user")),
        companyId: companyFromRow,
        companyName: companyName || "N/A",
        accountStatus: toSafeString(row?.account_status, toSafeString(row?.status, "active")),
        lastLoginAt: toSafeNullableString(row?.last_login_at),
      });
      await fetchLastSecurityActivity();
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      const fallbackName = toSafeString(user.email, "Utilisateur");
      setProfile({
        id: user.id,
        firstName: "",
        lastName: "",
        fullName: fallbackName,
        avatarUrl: null,
        role: normalizeRole(role),
        companyId: companyId ?? null,
        companyName: "N/A",
        accountStatus: "active",
        lastLoginAt: null,
      });
      setError(e instanceof Error ? e.message : "Impossible de charger le profil");
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, user?.email, role, companyId, fetchCompanyName, fetchLastSecurityActivity]);
  const updateProfile = useCallback(
    async (input: { firstName: string; lastName: string; avatarUrl?: string | null }) => {
      if (!isAuthenticated || !user?.id) return false;
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();
      const avatarUrl = (input.avatarUrl ?? "").trim();
      if (!isValidName(firstName) || !isValidName(lastName)) {
        setError("Nom invalide");
        return false;
      }
      if (!isValidAvatarUrl(avatarUrl)) {
        setError("Avatar URL invalide");
        return false;
      }
      setSaving(true);
      setError(null);
      try {
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        if (updateError) throw updateError;
        if (!mountedRef.current) return false;
        setProfile((prev) => {
          const current = prev ?? {
            id: user.id,
            firstName: "",
            lastName: "",
            fullName: "",
            avatarUrl: null,
            role: normalizeRole(role),
            companyId: companyId ?? null,
            companyName: "N/A",
            accountStatus: "active",
            lastLoginAt: null,
          };
          return {
            ...current,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            avatarUrl: avatarUrl || null,
          };
        });
        await logAuditEvent({
          companyId: companyId ?? null,
          actorId: user.id,
          action: "PROFILE_UPDATED",
          metadata: { first_name: firstName, last_name: lastName, avatar_changed: Boolean(avatarUrl) },
        });
        return true;
      } catch (e: unknown) {
        if (!mountedRef.current) return false;
        setError(e instanceof Error ? e.message : "Échec de mise à jour du profil");
        return false;
      } finally {
        if (!mountedRef.current) return;
        setSaving(false);
      }
    },
    [isAuthenticated, user?.id, role, companyId]
  );
  const changePin = useCallback(
    async (currentPin: string, nextPin: string, confirmPin: string) => {
      if (!isAuthenticated || !user?.id) return { ok: false, message: "Session invalide" as const };
      const current = currentPin.trim();
      const next = nextPin.trim();
      const confirm = confirmPin.trim();
      if (!/^\d{4,8}$/.test(next)) return { ok: false, message: "PIN invalide" as const };
      if (next !== confirm) return { ok: false, message: "PIN non confirmé" as const };
      setPinSaving(true);
      setError(null);
      try {
        const checked = await verifyPin(current);
        if (!checked.ok) return { ok: false, message: "PIN actuel invalide" as const };
        const updated = await setPin(next);
        if (!updated) return { ok: false, message: "Échec changement PIN" as const };
        await logAuditEvent({
          companyId: companyId ?? null,
          actorId: user.id,
          action: "PROFILE_PIN_CHANGED",
          metadata: {},
        });
        await logCriticalAction({
          companyId: companyId ?? null,
          actorId: user.id,
          actorEmail: user.email ?? null,
          action: "PIN changed",
          metadata: {},
        });
        await fetchLastSecurityActivity();
        return { ok: true, message: "PIN mis à jour" as const };
      } catch {
        return { ok: false, message: "Échec changement PIN" as const };
      } finally {
        if (!mountedRef.current) return;
        setPinSaving(false);
      }
    },
    [isAuthenticated, user?.id, user?.email, verifyPin, setPin, companyId, fetchLastSecurityActivity]
  );
  useEffect(() => {
    mountedRef.current = true;
    void fetchProfile();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProfile]);
  return useMemo(
    () => ({
      profile,
      securityActivity,
      loading,
      saving,
      pinSaving: pinSaving || pinLoading,
      error,
      refresh: fetchProfile,
      updateProfile,
      changePin,
    }),
    [profile, securityActivity, loading, saving, pinSaving, pinLoading, error, fetchProfile, updateProfile, changePin]
  );
}
