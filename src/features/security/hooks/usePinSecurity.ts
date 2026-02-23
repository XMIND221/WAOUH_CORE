import { useCallback, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
const MAX_PIN_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 5 * 60 * 1000;
type SecurityEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "PIN_FAILURE"
  | "ROLE_CHANGE"
  | "CRITICAL_ACTION";
type LogSecurityEventInput = {
  eventType: SecurityEventType;
  companyId: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};
type VerifyPinResult = {
  ok: boolean;
  locked: boolean;
  attemptsRemaining: number;
  reason: "success" | "failed" | "locked" | "error" | "not_authenticated";
};
type RpcCandidate = {
  fn: string;
  args: Record<string, unknown>;
};
function nowIso() {
  return new Date().toISOString();
}
async function callFirstRpcString(candidates: RpcCandidate[]): Promise<string | null> {
  for (const candidate of candidates) {
    const { data, error } = await supabase.rpc(candidate.fn, candidate.args);
    if (!error && typeof data === "string" && data.length > 0) return data;
  }
  return null;
}
async function callFirstRpcBoolean(candidates: RpcCandidate[]): Promise<boolean | null> {
  for (const candidate of candidates) {
    const { data, error } = await supabase.rpc(candidate.fn, candidate.args);
    if (error) continue;
    if (typeof data === "boolean") return data;
    if (data && typeof data === "object" && "valid" in (data as Record<string, unknown>)) {
      return Boolean((data as Record<string, unknown>).valid);
    }
  }
  return null;
}
export async function logSecurityEvent(input: LogSecurityEventInput): Promise<void> {
  const baseMetadata = input.metadata ?? {};
  const payloads: Record<string, unknown>[] = [
    {
      company_id: input.companyId,
      event_type: input.eventType,
      status: input.eventType.endsWith("FAILURE") ? "failure" : "success",
      actor_id: input.actorId ?? null,
      actor_email: input.actorEmail ?? null,
      message: input.message ?? null,
      metadata: baseMetadata,
      created_at: nowIso(),
    },
    {
      company_id: input.companyId,
      action: input.eventType,
      actor_id: input.actorId ?? null,
      actor_email: input.actorEmail ?? null,
      metadata: { ...baseMetadata, message: input.message ?? null, status: input.eventType.endsWith("FAILURE") ? "failure" : "success" },
      created_at: nowIso(),
    },
    {
      company_id: input.companyId,
      type: input.eventType,
      metadata: { ...baseMetadata, actor_id: input.actorId ?? null, actor_email: input.actorEmail ?? null, message: input.message ?? null },
      created_at: nowIso(),
    },
  ];
  for (const payload of payloads) {
    const { error } = await supabase.from("security_logs").insert(payload);
    if (!error) return;
  }
}
export async function logRoleChange(params: {
  companyId: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  targetUserId: string;
  oldRole: string;
  newRole: string;
}) {
  await logSecurityEvent({
    eventType: "ROLE_CHANGE",
    companyId: params.companyId,
    actorId: params.actorId ?? null,
    actorEmail: params.actorEmail ?? null,
    message: "Role changed",
    metadata: {
      target_user_id: params.targetUserId,
      old_role: params.oldRole,
      new_role: params.newRole,
    },
  });
}
export async function logCriticalAction(params: {
  companyId: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  metadata?: Record<string, unknown> | null;
}) {
  await logSecurityEvent({
    eventType: "CRITICAL_ACTION",
    companyId: params.companyId,
    actorId: params.actorId ?? null,
    actorEmail: params.actorEmail ?? null,
    message: params.action,
    metadata: params.metadata ?? {},
  });
}
export function usePinSecurity() {
  const { user, companyId, isAuthenticated } = useAuth();
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const lockRef = useRef<number | null>(null);
  const isLocked = useMemo(() => {
    if (!lockedUntil) return false;
    return Date.now() < lockedUntil;
  }, [lockedUntil]);
  const attemptsRemaining = useMemo(() => {
    return Math.max(0, MAX_PIN_ATTEMPTS - attemptCount);
  }, [attemptCount]);
  const resetAttempts = useCallback(() => {
    setAttemptCount(0);
    setLockedUntil(null);
    lockRef.current = null;
  }, []);
  const setPin = useCallback(
    async (rawPin: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) return false;
      const pin = rawPin.trim();
      if (!pin) {
        setPinError("PIN invalide");
        return false;
      }
      setPinLoading(true);
      setPinError(null);
      try {
        const hash = await callFirstRpcString([
          { fn: "hash_pin_bcrypt", args: { pin_input: pin } },
          { fn: "hash_pin", args: { pin_input: pin } },
          { fn: "security_hash_pin", args: { pin_input: pin } },
        ]);
        if (!hash) {
          setPinError("Hash PIN indisponible");
          return false;
        }
        const { error } = await supabase
          .from("user_profiles")
          .update({
            pin_hash: hash,
            pin_initialized: true,
            must_change_pin: false,
            pin_updated_at: nowIso(),
          })
          .eq("id", user.id);
        if (error) {
          setPinError(error.message);
          return false;
        }
        resetAttempts();
        return true;
      } catch (e: unknown) {
        setPinError(e instanceof Error ? e.message : "PIN update failed");
        return false;
      } finally {
        setPinLoading(false);
      }
    },
    [isAuthenticated, user?.id, resetAttempts]
  );
  const verifyPin = useCallback(
    async (rawPin: string): Promise<VerifyPinResult> => {
      if (!isAuthenticated || !user?.id) {
        return {
          ok: false,
          locked: false,
          attemptsRemaining: MAX_PIN_ATTEMPTS,
          reason: "not_authenticated",
        };
      }
      if (lockRef.current && Date.now() < lockRef.current) {
        const left = Math.max(0, MAX_PIN_ATTEMPTS - attemptCount);
        return {
          ok: false,
          locked: true,
          attemptsRemaining: left,
          reason: "locked",
        };
      }
      const pin = rawPin.trim();
      if (!pin) {
        const nextAttempts = attemptCount + 1;
        const left = Math.max(0, MAX_PIN_ATTEMPTS - nextAttempts);
        setAttemptCount(nextAttempts);
        await logSecurityEvent({
          eventType: "PIN_FAILURE",
          companyId: companyId ?? null,
          actorId: user.id,
          actorEmail: user.email ?? null,
          message: "PIN vide",
          metadata: { attempts: nextAttempts, max_attempts: MAX_PIN_ATTEMPTS },
        });
        if (nextAttempts >= MAX_PIN_ATTEMPTS) {
          const until = Date.now() + LOCK_WINDOW_MS;
          lockRef.current = until;
          setLockedUntil(until);
          return { ok: false, locked: true, attemptsRemaining: 0, reason: "locked" };
        }
        return { ok: false, locked: false, attemptsRemaining: left, reason: "failed" };
      }
      setPinLoading(true);
      setPinError(null);
      try {
        const valid = await callFirstRpcBoolean([
          { fn: "verify_pin_bcrypt", args: { user_id_input: user.id, pin_input: pin } },
          { fn: "verify_user_pin", args: { user_id_input: user.id, pin_input: pin } },
          { fn: "verify_pin", args: { user_id_input: user.id, pin_input: pin } },
          { fn: "security_verify_pin", args: { user_id_input: user.id, pin_input: pin } },
        ]);
        if (valid === true) {
          resetAttempts();
          return {
            ok: true,
            locked: false,
            attemptsRemaining: MAX_PIN_ATTEMPTS,
            reason: "success",
          };
        }
        const nextAttempts = attemptCount + 1;
        const left = Math.max(0, MAX_PIN_ATTEMPTS - nextAttempts);
        setAttemptCount(nextAttempts);
        await logSecurityEvent({
          eventType: "PIN_FAILURE",
          companyId: companyId ?? null,
          actorId: user.id,
          actorEmail: user.email ?? null,
          message: "PIN invalide",
          metadata: { attempts: nextAttempts, max_attempts: MAX_PIN_ATTEMPTS },
        });
        if (nextAttempts >= MAX_PIN_ATTEMPTS) {
          const until = Date.now() + LOCK_WINDOW_MS;
          lockRef.current = until;
          setLockedUntil(until);
          return { ok: false, locked: true, attemptsRemaining: 0, reason: "locked" };
        }
        return {
          ok: false,
          locked: false,
          attemptsRemaining: left,
          reason: "failed",
        };
      } catch (e: unknown) {
        const nextAttempts = attemptCount + 1;
        const left = Math.max(0, MAX_PIN_ATTEMPTS - nextAttempts);
        setAttemptCount(nextAttempts);
        setPinError(e instanceof Error ? e.message : "PIN verification failed");
        await logSecurityEvent({
          eventType: "PIN_FAILURE",
          companyId: companyId ?? null,
          actorId: user.id,
          actorEmail: user.email ?? null,
          message: "Erreur de vérification PIN",
          metadata: { attempts: nextAttempts, max_attempts: MAX_PIN_ATTEMPTS },
        });
        if (nextAttempts >= MAX_PIN_ATTEMPTS) {
          const until = Date.now() + LOCK_WINDOW_MS;
          lockRef.current = until;
          setLockedUntil(until);
          return { ok: false, locked: true, attemptsRemaining: 0, reason: "locked" };
        }
        return { ok: false, locked: false, attemptsRemaining: left, reason: "error" };
      } finally {
        setPinLoading(false);
      }
    },
    [isAuthenticated, user?.id, user?.email, companyId, attemptCount, resetAttempts]
  );
  return {
    pinLoading,
    pinError,
    isLocked,
    lockedUntil,
    attemptsRemaining,
    setPin,
    verifyPin,
    resetAttempts,
  };
}
