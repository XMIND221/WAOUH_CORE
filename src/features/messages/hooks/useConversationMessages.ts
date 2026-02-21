// filepath: D:\WAOUH_CORE\waouh_core_app\src\features\messages\hooks\useConversationMessages.ts
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useUserId } from "../../../hooks/useCompany";
function nowIso() {
  return new Date().toISOString();
}
type AnyMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  pending?: boolean;
  failed?: boolean;
  user?: any;
};
type AnyQueryData = any;
type SendInput = string | { content: string; conversation_id?: string };
function appendMessage(oldData: AnyQueryData, msg: AnyMessage) {
  if (!oldData) return [msg];
  if (Array.isArray(oldData)) return [...oldData, msg];
  if (oldData?.pages && Array.isArray(oldData.pages)) {
    const pages = [...oldData.pages];
    if (!pages.length) return { ...oldData, pages: [[msg]] };
    const first = pages[0];
    if (Array.isArray(first)) pages[0] = [...first, msg];
    else if (first?.items && Array.isArray(first.items)) pages[0] = { ...first, items: [...first.items, msg] };
    return { ...oldData, pages };
  }
  return oldData;
}
function replaceTempMessage(oldData: AnyQueryData, tempId: string, saved: AnyMessage) {
  if (!oldData) return oldData;
  if (Array.isArray(oldData)) {
    return oldData.map((m) => (m.id === tempId ? saved : m));
  }
  if (oldData?.pages && Array.isArray(oldData.pages)) {
    const pages = oldData.pages.map((p: any) => {
      if (Array.isArray(p)) return p.map((m: any) => (m.id === tempId ? saved : m));
      if (p?.items && Array.isArray(p.items)) {
        return { ...p, items: p.items.map((m: any) => (m.id === tempId ? saved : m)) };
      }
      return p;
    });
    return { ...oldData, pages };
  }
  return oldData;
}
async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*, user:users(id, email, first_name, last_name)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}
export function useConversationMessages(conversationId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const queryKey = ["messages", conversationId] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
  });
  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId, queryClient]);
  const sendMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          content,
          is_read: false,
        })
        .select("*, user:users(id, email, first_name, last_name)")
        .single();
      if (error) throw error;
      return data as AnyMessage;
    },
    onMutate: async ({ content }) => {
      if (!userId) return { previous: undefined, tempId: "" };
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      const tempId = `temp-${Date.now()}`;
      const optimistic: AnyMessage = {
        id: tempId,
        conversation_id: conversationId,
        user_id: userId,
        content,
        created_at: nowIso(),
        is_read: false,
        pending: true,
      };
      queryClient.setQueryData(queryKey, (old: AnyQueryData) => appendMessage(old, optimistic));
      return { previous, tempId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(queryKey, ctx.previous);
      else queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: (saved, _vars, ctx) => {
      if (!ctx?.tempId) return;
      queryClient.setQueryData(queryKey, (old: AnyQueryData) =>
        replaceTempMessage(old, ctx.tempId, { ...saved, pending: false, failed: false })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  const sendMessage = (input: SendInput) => {
    const content = typeof input === "string" ? input : input.content;
    return sendMutation.mutateAsync({ content });
  };
  return {
    messages: (query.data as AnyMessage[]) || [],
    isLoading: query.isLoading,
    isError: query.isError,
    sendMessage,
    isSending: sendMutation.isPending,
    // Compat API (attendu par ChatScreen actuel)
    loadOlder: async () => {},
    hasMore: false,
    isLoadingMore: false,
  };
}
export const useMessages = useConversationMessages;
export const useChatMessages = useConversationMessages;
