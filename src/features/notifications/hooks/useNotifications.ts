import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useUserId, useCompanyId } from "../../../hooks/useCompany";
export interface Notification {
  id: string;
  user_id: string;
  company_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, any> | null;
}
async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}
async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) throw error;
}
async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}
export function useNotifications() {
  const userId = useUserId();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
  });
  useEffect(() => {
    if (query.data) {
      setNotifications(query.data);
    }
  }, [query.data]);
  // Realtime
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [userId]);
  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAsRead(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markAsRead: markReadMutation.mutateAsync,
    markAllAsRead: markAllReadMutation.mutateAsync,
  };
}
