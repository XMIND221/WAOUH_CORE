import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useCompanyId } from "../../../hooks/useCompany";
import { TimelineEvent } from "../types";
export function useRealtimeTimeline(initialEvents: TimelineEvent[]) {
  const companyId = useCompanyId();
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);
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
          // Fetch avec user info
          const { data } = await supabase
            .from("timeline_events")
            .select("*, user:users(first_name, last_name, email)")
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setEvents((prev) => [data, ...prev].slice(0, 20));
          }
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [companyId]);
  return events;
}
