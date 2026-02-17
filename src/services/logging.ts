import { supabase } from "./supabase";
type TimelineEvent = {
  companyId: string;
  userId: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
};
type AuditEvent = {
  companyId: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};
type SecurityEvent = {
  email?: string | null;
  companyId?: string | null;
  userId?: string | null;
  event: string;
  status?: "success" | "failure";
  metadata?: Record<string, unknown>;
};
export async function logTimeline(event: TimelineEvent) {
  await supabase.from("timeline_events").insert({
    company_id: event.companyId,
    user_id: event.userId,
    entity_type: event.entityType,
    entity_id: event.entityId ?? null,
    action: event.action,
    metadata: event.metadata ?? null,
  });
}
export async function logAudit(event: AuditEvent) {
  await supabase.from("audit_logs").insert({
    company_id: event.companyId,
    user_id: event.userId,
    action: event.action,
    entity: event.entity,
    entity_id: event.entityId ?? null,
    metadata: event.metadata ?? null,
  });
}
export async function logSecurity(event: SecurityEvent) {
  if (event.companyId) {
    await supabase.from("security_logs").insert({
      company_id: event.companyId,
      user_id: event.userId ?? null,
      event: event.event,
      status: event.status ?? "success",
      metadata: event.metadata ?? null,
    });
    return;
  }
  if (event.email) {
    await supabase.rpc("log_security_event", {
      p_email: event.email,
      p_event: event.event,
      p_status: event.status ?? "failure",
    });
  }
}
