import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
export interface SecurityLog {
  id: string;
  user_email: string;
  action: "login" | "logout" | "failed_login" | "password_change" | "pin_change" | "unauthorized_access";
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  details?: any;
  created_at: string;
}
export function useSecurityLogs() {
  const { userProfile } = useAuthStore();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!userProfile?.company_id) return;
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("security_logs")
        .select("*")
        .eq("company_id", userProfile.company_id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data) {
        setLogs(data);
      }
      setIsLoading(false);
    };
    fetchLogs();
    // Subscription temps réel
    const channel = supabase
      .channel("security_logs:" + userProfile.company_id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "security_logs",
          filter: "company_id=eq." + userProfile.company_id,
        },
        (payload) => {
          setLogs((prev) => [payload.new as SecurityLog, ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.company_id]);
  return { logs, isLoading };
}
// Fonction utilitaire pour logger une action de sécurité
export async function logSecurityEvent(
  action: SecurityLog["action"],
  success: boolean,
  details?: any
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("security_logs").insert({
    user_id: user.id,
    user_email: user.email,
    action,
    success,
    details,
    ip_address: null, // À implémenter avec un service IP
    user_agent: navigator.userAgent,
  });
}