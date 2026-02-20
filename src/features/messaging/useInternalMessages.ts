import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
export interface InternalMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_email?: string;
  content: string;
  read: boolean;
  attachments?: string[];
  created_at: string;
}
export function useInternalMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userProfile } = useAuthStore();
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setIsLoading(true);
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("internal_messages")
        .select("*, user_profiles!internal_messages_sender_id_fkey(email)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (!error && data) {
        const formattedMessages = data.map(msg => ({
          ...msg,
          sender_email: msg.user_profiles?.email || "Unknown",
        }));
        setMessages(formattedMessages);
        // Compter les messages non lus
        const unread = formattedMessages.filter(
          m => !m.read && m.sender_id !== userProfile?.id
        ).length;
        setUnreadCount(unread);
      }
      setIsLoading(false);
    };
    fetchMessages();
    // Subscription temps réel
    const channel = supabase
      .channel("messages:" + conversationId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "internal_messages",
          filter: "conversation_id=eq." + conversationId,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userProfile?.id]);
  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from("internal_messages")
      .update({ read: true })
      .eq("id", messageId);
    if (!error) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };
  return { messages, isLoading, unreadCount, markAsRead };
}