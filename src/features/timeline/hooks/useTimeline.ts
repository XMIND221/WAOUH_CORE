import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useCompanyId, useUserId } from "../../../hooks/useCompany";
import { useAuthStore } from "../../../store/authStore";
import { TimelineEvent } from "../types";
async function fetchTimeline(companyId: string, userId: string, role: string): Promise<TimelineEvent[]> {
  const isSuperAdmin = role === "super_admin";
  const isDirector = role === "directeur_general";
  let query = supabase
    .from("timeline_events")
    .select("*, user:users!user_id(first_name, last_name, email)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);
  // Si pas super_admin ou directeur, filtrer par utilisateur
  if (!isSuperAdmin && !isDirector) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
export function useTimeline() {
  const companyId = useCompanyId();
  const userId = useUserId();
  const userProfile = useAuthStore((s) => s.userProfile);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const query = useQuery({
    queryKey: ["timeline", companyId, userId, userProfile?.role],
    queryFn: () => fetchTimeline(companyId!, userId!, userProfile?.role || "employe"),
    enabled: !!companyId && !!userId && !!userProfile,
  });
  useEffect(() => {
    if (query.data) {
      setEvents(query.data);
    }
  }, [query.data]);
  // Realtime subscription
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`timeline:${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "timeline_events",
          filter: `company_id=eq.${companyId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("timeline_events")
            .select("*, user:users!user_id(first_name, last_name, email)")
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setEvents((prev) => [data, ...prev].slice(0, 100));
          }
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [companyId]);
  return {
    events,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
