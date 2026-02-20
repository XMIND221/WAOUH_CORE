import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
export interface TimelineEvent {
  id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}
export function useTimeline() {
  const { userProfile } = useAuthStore();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!userProfile?.company_id) return;
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("timeline_events")
        .select("*")
        .eq("company_id", userProfile.company_id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) {
        setEvents(data);
      }
      setIsLoading(false);
    };
    fetchEvents();
    // Subscription temps réel
    const channel = supabase
      .channel("timeline:" + userProfile.company_id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "timeline_events",
          filter: "company_id=eq." + userProfile.company_id,
        },
        (payload) => {
          setEvents((prev) => [payload.new as TimelineEvent, ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.company_id]);
  return { events, isLoading };
}