import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { getSupabaseErrorMessage } from "../../lib/supabaseError";
export interface TimelineEvent {
  id: string;
  company_id: string;
  created_at: string;
  user_email?: string | null;
  action?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  title?: string | null;
  description?: string | null;
  event_date?: string | null;
}
export function useTimeline() {
  const { userProfile } = useAuthStore();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!userProfile?.company_id) {
      setEvents([]);
      setIsLoading(false);
      return;
    }
    fetchTimeline().catch((e) => console.error("fetchTimeline:", getSupabaseErrorMessage(e)));
  }, [userProfile?.company_id]);
  const fetchTimeline = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("timeline_events")
      .select("*")
      .eq("company_id", userProfile?.company_id)
      .order("created_at", { ascending: false });
    if (error) {
      setIsLoading(false);
      throw new Error(getSupabaseErrorMessage(error, "Chargement timeline impossible"));
    }
    setEvents((data ?? []) as TimelineEvent[]);
    setIsLoading(false);
  };
  return { events, isLoading, refetch: fetchTimeline };
}
