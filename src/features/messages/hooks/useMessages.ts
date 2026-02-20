import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useUserId } from "../../../hooks/useCompany";
import { Message, SendMessageInput } from "../types";
import { useEffect, useState } from "react";
async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*, user:users(id, email, first_name, last_name)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return data || [];
}
async function sendMessage(userId: string, input: SendMessageInput): Promise<Message> {
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
  await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("user_id", userId)
    .eq("is_read", false);
}
export function useMessages(conversationId: string | null) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
  });
  useEffect(() => {
    if (query.data) {
      setMessages(query.data);
    }
  }, [query.data]);
  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch avec user info
          const { data } = await supabase
            .from("chat_messages")
            .select("*, user:users(id, email, first_name, last_name)")
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);
  // Mark as read when opening
  useEffect(() => {
    if (conversationId && userId) {
      markAsRead(conversationId, userId);
    }
  }, [conversationId, userId]);
  const sendMutation = useMutation({
    mutationFn: (input: SendMessageInput) => sendMessage(userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  return {
    messages,
    isLoading: query.isLoading,
    isError: query.isError,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  };
}
