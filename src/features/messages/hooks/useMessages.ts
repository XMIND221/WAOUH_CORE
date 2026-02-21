// filepath: D:\WAOUH_CORE\waouh_core_app\src\features\messages\hooks\useMessages.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useUserId } from "../../../hooks/useCompany";
import { Message, SendMessageInput } from "../types";
import { useEffect, useState } from "react";
const PAGE_SIZE = 50;
type SendInputCompat = string | SendMessageInput;
type UIMessage = Message & { pending?: boolean; failed?: boolean };
function nowIso() {
  return new Date().toISOString();
}
function sortByDateAsc(list: UIMessage[]) {
  return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}
function dedupeById(list: UIMessage[]) {
  const map = new Map<string, UIMessage>();
  for (const m of list) map.set(m.id, m);
  return Array.from(map.values());
}
async function fetchRecentMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*, user:users(id, email, first_name, last_name)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (error) throw error;
  return (data || []).reverse();
}
async function fetchOlderMessages(conversationId: string, beforeIso: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*, user:users(id, email, first_name, last_name)")
    .eq("conversation_id", conversationId)
    .lt("created_at", beforeIso)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (error) throw error;
  return (data || []).reverse();
}
async function sendMessageApi(userId: string, input: SendMessageInput): Promise<Message> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: input.conversation_id,
      user_id: userId,
      content: input.content,
      is_read: false,
    })
    .select("*, user:users(id, email, first_name, last_name)")
    .single();
  if (error) throw error;
  return data;
}
async function markAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}
export function useMessages(conversationId: string | null) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const queryKey = ["messages", conversationId] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => fetchRecentMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 15000,
  });
  useEffect(() => {
    if (!query.data) return;
    setMessages(sortByDateAsc(query.data as UIMessage[]));
    setHasMore(query.data.length >= PAGE_SIZE);
  }, [query.data]);
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat_messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const insertedId = (payload.new as { id?: string })?.id;
          if (!insertedId) return;
          const { data } = await supabase
            .from("chat_messages")
            .select("*, user:users(id, email, first_name, last_name)")
            .eq("id", insertedId)
            .single();
          if (!data) return;
          setMessages((prev) => sortByDateAsc(dedupeById([...prev, data as UIMessage])));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
  useEffect(() => {
    if (!conversationId || !userId) return;
    markAsRead(conversationId, userId).catch(() => {});
  }, [conversationId, userId]);
  const loadOlder = async () => {
    if (!conversationId || isLoadingMore || !hasMore || messages.length === 0) return;
    setIsLoadingMore(true);
    try {
      const oldest = messages[0]?.created_at;
      if (!oldest) return;
      const older = await fetchOlderMessages(conversationId, oldest);
      if (older.length === 0) {
        setHasMore(false);
        return;
      }
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const merged = [...(older as UIMessage[]).filter((m) => !seen.has(m.id)), ...prev];
        return sortByDateAsc(merged);
      });
      if (older.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };
  const sendMutation = useMutation({
    mutationFn: (input: SendMessageInput) => sendMessageApi(userId!, input),
    onMutate: async (input) => {
      if (!userId) return { tempId: "" };
      const tempId = `temp-${Date.now()}`;
      const optimistic: UIMessage = {
        id: tempId,
        conversation_id: input.conversation_id,
        user_id: userId,
        content: input.content,
        created_at: nowIso(),
        is_read: false,
        pending: true,
        failed: false,
      } as UIMessage;
      setMessages((prev) => sortByDateAsc([...prev, optimistic]));
      return { tempId };
    },
    onSuccess: (created, _vars, ctx) => {
      setMessages((prev) => {
        const replaced = prev.map((m) =>
          m.id === ctx?.tempId ? ({ ...created, pending: false, failed: false } as UIMessage) : m
        );
        return sortByDateAsc(dedupeById(replaced));
      });
    },
    onError: (_err, _vars, ctx) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === ctx?.tempId ? ({ ...m, pending: false, failed: true } as UIMessage) : m
        )
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey });
    },
  });
  const sendMessage = (input: SendInputCompat) => {
    if (!conversationId) return Promise.reject(new Error("conversationId manquant"));
    const normalized: SendMessageInput =
      typeof input === "string"
        ? { conversation_id: conversationId, content: input }
        : { conversation_id: input.conversation_id || conversationId, content: input.content };
    return sendMutation.mutateAsync(normalized);
  };
  const retryMessage = (msg: UIMessage) => {
    if (!conversationId || !msg.failed) return Promise.resolve(null);
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    return sendMutation.mutateAsync({
      conversation_id: conversationId,
      content: msg.content,
    });
  };
  return {
    messages,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    sendMessage,
    retryMessage,
    isSending: sendMutation.isPending,
    loadOlder,
    hasMore,
    isLoadingMore,
  };
}
