import { supabase } from "./supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
export const subscribeToTasks = (companyId: string, callback: (payload: any) => void): RealtimeChannel => {
  return supabase
    .channel(`tasks:${companyId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `company_id=eq.${companyId}` }, callback)
    .subscribe();
};
export const subscribeToNotifications = (userId: string, callback: (payload: any) => void): RealtimeChannel => {
  return supabase
    .channel(`notifications:${userId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, callback)
    .subscribe();
};
export const subscribeToTimeline = (companyId: string, callback: (payload: any) => void): RealtimeChannel => {
  return supabase
    .channel(`timeline:${companyId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "timeline_events", filter: `company_id=eq.${companyId}` }, callback)
    .subscribe();
};
