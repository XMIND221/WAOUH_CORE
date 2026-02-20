import { supabase } from "../../lib/supabase";
export type AuditAction =
  | "login"
  | "logout"
  | "login_failed"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "user_role_changed"
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "task_status_changed"
  | "client_created"
  | "client_updated"
  | "client_deleted"
  | "deal_created"
  | "deal_updated"
  | "deal_stage_changed"
  | "invoice_created"
  | "invoice_updated"
  | "invoice_paid"
  | "message_sent"
  | "group_created"
  | "permission_changed";
export interface AuditLogInput {
  companyId: string;
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}
export async function auditLog(input: AuditLogInput): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      company_id: input.companyId,
      user_id: input.actorId || null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId || null,
      metadata: input.metadata || null,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
    });
  } catch (error) {
    console.error("Audit log failed:", error);
    // Ne pas bloquer l'action même si l'audit échoue
  }
}
// Helpers spécifiques
export async function logAuthEvent(
  action: "login" | "logout" | "login_failed",
  companyId: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await auditLog({
    companyId,
    actorId: userId,
    action,
    entityType: "auth",
    metadata,
  });
}
export async function logUserEvent(
  action: "user_created" | "user_updated" | "user_deleted" | "user_role_changed",
  companyId: string,
  actorId: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await auditLog({
    companyId,
    actorId,
    action,
    entityType: "user",
    entityId: userId,
    metadata,
  });
}
export async function logEntityEvent(
  action: AuditAction,
  companyId: string,
  actorId: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await auditLog({
    companyId,
    actorId,
    action,
    entityType,
    entityId,
    metadata,
  });
}
