import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  entity_type: "client" | "invoice" | "message" | "user" | "settings" | "other";
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
export function useAuditLogs(filters?: {
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { userProfile } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    byEntityType: {} as Record<string, number>,
    byUser: {} as Record<string, number>,
  });
  useEffect(() => {
    if (!userProfile?.company_id) return;
    fetchLogs();
  }, [userProfile?.company_id, filters]);
  const fetchLogs = async () => {
    setIsLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("*")
      .eq("company_id", userProfile?.company_id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (filters?.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }
    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }
    const { data, error } = await query;
    if (!error && data) {
      setLogs(data);
      // Calculer les statistiques
      const byEntityType: Record<string, number> = {};
      const byUser: Record<string, number> = {};
      data.forEach(log => {
        byEntityType[log.entity_type] = (byEntityType[log.entity_type] || 0) + 1;
        byUser[log.user_email] = (byUser[log.user_email] || 0) + 1;
      });
      setStats({
        total: data.length,
        byEntityType,
        byUser,
      });
    }
    setIsLoading(false);
  };
  return { logs, isLoading, stats, refetch: fetchLogs };
}
// Fonction utilitaire pour logger une action
export async function logAuditEvent(
  action: string,
  entityType: AuditLog["entity_type"],
  entityId?: string,
  oldValues?: any,
  newValues?: any
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email,
    company_id: profile?.company_id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_values: oldValues,
    new_values: newValues,
    ip_address: null,
    user_agent: navigator.userAgent,
  });
}