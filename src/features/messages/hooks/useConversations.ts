import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useCompanyId, useUserId } from "../../../hooks/useCompany";
import { Conversation, CreateConversationInput } from "../types";
async function fetchConversations(companyId: string, userId: string): Promise<Conversation[]> {
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  if (!participations || participations.length === 0) return [];
  const conversationIds = participations.map((p) => p.conversation_id);
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(`
      *,
      participants:conversation_participants(
        id,
        user_id,
        is_admin,
        user:users(id, email, first_name, last_name, role)
      )
    `)
    .eq("company_id", companyId)
    .in("id", conversationIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // Fetch last message for each
  const withLastMessage = await Promise.all(
    (conversations || []).map(async (conv) => {
      const { data: lastMsg } = await supabase
        .from("chat_messages")
        .select("*, user:users(id, email, first_name, last_name)")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      // Count unread
      const { count } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("is_read", false)
        .neq("user_id", userId);
      return {
        ...conv,
        last_message: lastMsg || undefined,
        unread_count: count || 0,
      };
    })
  );
  return withLastMessage;
}
async function createConversation(
  companyId: string,
  userId: string,
  input: CreateConversationInput
): Promise<Conversation> {
  // Create conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      company_id: companyId,
      type: input.type,
      name: input.name || null,
      created_by: userId,
    })
    .select()
    .single();
  if (convError || !conversation) throw convError;
  // Add participants (including creator)
  const participantIds = [...new Set([userId, ...input.participant_ids])];
  const participants = participantIds.map((uid, index) => ({
    conversation_id: conversation.id,
    user_id: uid,
    is_admin: uid === userId,
  }));
  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert(participants);
  if (partError) throw partError;
  return conversation;
}
export function useConversations() {
  const companyId = useCompanyId();
  const userId = useUserId();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["conversations", companyId, userId],
    queryFn: () => fetchConversations(companyId!, userId!),
    enabled: !!companyId && !!userId,
    refetchInterval: 10000,
  });
  const createMutation = useMutation({
    mutationFn: (input: CreateConversationInput) =>
      createConversation(companyId!, userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  return {
    conversations: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    createConversation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
