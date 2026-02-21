// filepath: D:\WAOUH_CORE\waouh_core_app\src\features\messages\hooks\useConversations.ts
import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useCompanyId, useUserId } from "../../../hooks/useCompany";
import { Conversation, CreateConversationInput } from "../types";
const PAGE_SIZE = 20;
function getActivityDate(conv: any): number {
  const d =
    conv?.last_message?.created_at ||
    conv?.updated_at ||
    conv?.created_at ||
    "1970-01-01T00:00:00.000Z";
  return new Date(d).getTime();
}
type ConversationsPage = {
  items: Conversation[];
  hasMore: boolean;
};
async function fetchConversationsPage(
  companyId: string,
  userId: string,
  page: number
): Promise<ConversationsPage> {
  const { data: participations, error: partErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  if (partErr) throw partErr;
  if (!participations?.length) return { items: [], hasMore: false };
  const conversationIds = participations.map((p) => p.conversation_id);
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: conversations, error: convErr } = await supabase
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
    .order("created_at", { ascending: false })
    .range(from, to);
  if (convErr) throw convErr;
  if (!conversations?.length) return { items: [], hasMore: false };
  const pageIds = conversations.map((c: any) => c.id);
  const fetchCap = Math.max(200, pageIds.length * 20);
  const { data: lastMessagesRaw, error: lastErr } = await supabase
    .from("chat_messages")
    .select("id, conversation_id, user_id, content, created_at, user:users(id, email, first_name, last_name)")
    .in("conversation_id", pageIds)
    .order("created_at", { ascending: false })
    .limit(fetchCap);
  if (lastErr) throw lastErr;
  const lastByConversation = new Map<string, any>();
  for (const msg of lastMessagesRaw || []) {
    if (!lastByConversation.has(msg.conversation_id)) {
      lastByConversation.set(msg.conversation_id, msg);
      if (lastByConversation.size === pageIds.length) break;
    }
  }
  const { data: unreadRows, error: unreadErr } = await supabase
    .from("chat_messages")
    .select("id, conversation_id")
    .in("conversation_id", pageIds)
    .eq("is_read", false)
    .neq("user_id", userId);
  if (unreadErr) throw unreadErr;
  const unreadByConversation = new Map<string, number>();
  for (const row of unreadRows || []) {
    unreadByConversation.set(
      row.conversation_id,
      (unreadByConversation.get(row.conversation_id) || 0) + 1
    );
  }
  const items = (conversations as any[]).map((conv) => ({
    ...conv,
    last_message: lastByConversation.get(conv.id) || undefined,
    unread_count: unreadByConversation.get(conv.id) || 0,
  }));
  items.sort((a: any, b: any) => getActivityDate(b) - getActivityDate(a));
  return {
    items: items as Conversation[],
    hasMore: conversations.length === PAGE_SIZE,
  };
}
async function createConversation(
  companyId: string,
  userId: string,
  input: CreateConversationInput
): Promise<Conversation> {
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
  const participantIds = [...new Set([userId, ...input.participant_ids])];
  const participants = participantIds.map((uid) => ({
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
  const queryKey = ["conversations", companyId, userId] as const;
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchConversationsPage(companyId!, userId!, pageParam as number),
    enabled: !!companyId && !!userId,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
    refetchInterval: 10000,
  });
  useEffect(() => {
    if (!companyId || !userId) return;
    const channel = supabase
      .channel(`conversations:list:${companyId}:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `company_id=eq.${companyId}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants", filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, userId, queryClient]);
  const conversations = useMemo(() => {
    const flat = (query.data?.pages || []).flatMap((p) => p.items);
    const map = new Map<string, Conversation>();
    for (const c of flat) map.set(c.id, c);
    return Array.from(map.values()).sort((a: any, b: any) => getActivityDate(b) - getActivityDate(a));
  }, [query.data]);
  const createMutation = useMutation({
    mutationFn: (input: CreateConversationInput) =>
      createConversation(companyId!, userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  return {
    conversations,
    isLoading: query.isLoading,
    isError: query.isError,
    createConversation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    loadMore: () => query.fetchNextPage(),
    hasMore: !!query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
  };
}
