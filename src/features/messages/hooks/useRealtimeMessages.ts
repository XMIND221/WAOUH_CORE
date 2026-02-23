import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
export type MessageRow = {
  id: string;
  conversation_id: string;
  company_id: string | null;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  created_at: string;
  read_at: string | null;
};
type UseRealtimeMessagesResult = {
  messages: MessageRow[];
  unreadCount: number;
  loading: boolean;
  sending: boolean;
  error: string | null;
  reload: () => Promise<void>;
  markAsRead: () => Promise<void>;
  sendMessage: (content: string, recipientId?: string | null) => Promise<boolean>;
};
function toErr(e: unknown): string {
  return e instanceof Error ? e.message : "Messaging error";
}
export function useRealtimeMessages(conversationId?: string | null): UseRealtimeMessagesResult {
  const mountedRef = useRef(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { user, companyId, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const clearState = useCallback(() => {
    if (!mountedRef.current) return;
    setMessages([]);
    setUnreadCount(0);
    setError(null);
    setLoading(false);
  }, []);
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !userId || !companyId || !conversationId) {
      if (mountedRef.current) setUnreadCount(0);
      return;
    }
    try {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("conversation_id", conversationId)
        .eq("recipient_id", userId)
        .is("read_at", null);
      if (!mountedRef.current) return;
      setUnreadCount(count ?? 0);
    } catch {
      if (!mountedRef.current) return;
      setUnreadCount(0);
    }
  }, [isAuthenticated, userId, companyId, conversationId]);
  const reload = useCallback(async () => {
    if (!isAuthenticated || !userId || !conversationId || !companyId) {
      clearState();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("id,conversation_id,company_id,sender_id,recipient_id,content,created_at,read_at")
        .eq("company_id", companyId)
        .eq("conversation_id", conversationId)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: true });
      if (!mountedRef.current) return;
      if (fetchError) {
        setMessages([]);
        setError(fetchError.message);
      } else {
        setMessages((data ?? []) as MessageRow[]);
      }
      await fetchUnreadCount();
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setMessages([]);
      setError(toErr(e));
      setUnreadCount(0);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [isAuthenticated, userId, conversationId, companyId, clearState, fetchUnreadCount]);
  const markAsRead = useCallback(async () => {
    if (!isAuthenticated || !userId || !companyId || !conversationId) {
      if (mountedRef.current) setUnreadCount(0);
      return;
    }
    try {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("company_id", companyId)
        .eq("conversation_id", conversationId)
        .eq("recipient_id", userId)
        .is("read_at", null);
      await fetchUnreadCount();
      if (!mountedRef.current) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.recipient_id === userId && m.read_at == null
            ? { ...m, read_at: new Date().toISOString() }
            : m
        )
      );
    } catch {
      if (!mountedRef.current) return;
      setUnreadCount((n) => n);
    }
  }, [isAuthenticated, userId, companyId, conversationId, fetchUnreadCount]);
  const sendMessage = useCallback(
    async (content: string, recipientId?: string | null): Promise<boolean> => {
      const text = content.trim();
      if (!text) return false;
      if (!isAuthenticated || !userId || !companyId || !conversationId) return false;
      setSending(true);
      setError(null);
      try {
        const payload = {
          conversation_id: conversationId,
          company_id: companyId,
          sender_id: userId,
          recipient_id: recipientId ?? null,
          content: text,
        };
        const { error: insertError } = await supabase.from("messages").insert(payload);
        if (insertError) throw insertError;
        await reload();
        return true;
      } catch (e: unknown) {
        if (!mountedRef.current) return false;
        setError(toErr(e));
        return false;
      } finally {
        if (!mountedRef.current) return false;
        setSending(false);
      }
    },
    [isAuthenticated, userId, companyId, conversationId, reload]
  );
  useEffect(() => {
    mountedRef.current = true;
    void reload();
    return () => {
      mountedRef.current = false;
    };
  }, [reload]);
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (!isAuthenticated || !userId || !companyId || !conversationId) return;
    const channel = supabase
      .channel(`messages:${companyId}:${conversationId}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          await reload();
          await markAsRead();
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, userId, companyId, conversationId, reload, markAsRead]);
  return useMemo(
    () => ({
      messages,
      unreadCount,
      loading,
      sending,
      error,
      reload,
      markAsRead,
      sendMessage,
    }),
    [messages, unreadCount, loading, sending, error, reload, markAsRead, sendMessage]
  );
}
