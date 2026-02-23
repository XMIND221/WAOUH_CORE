// filepath: d:\WAOUH_CORE\waouh_core_app\src\features\messages\screens\MessagesListScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
type ConversationRow = { id: string; title: string | null; updated_at: string | null };
export function MessagesListScreen() {
  const mountedRef = useRef(true);
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchConversations = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated || !user?.id) {
      setItems([]); setLoading(false); setRefreshing(false); setError(null);
      return;
    }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("conversations")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false });
      if (fetchError) throw fetchError;
      if (!mountedRef.current) return;
      setItems((data ?? []) as ConversationRow[]);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Unable to load messages");
      setItems([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?.id]);
  useEffect(() => {
    mountedRef.current = true;
    void fetchConversations(false);
    return () => { mountedRef.current = false; };
  }, [fetchConversations]);
  if (loading && items.length === 0) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator /></View>;
  }
  return (
    <View style={{ flex: 1 }}>
      {error ? <Text style={{ color: "red", padding: 12 }}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => void fetchConversations(true)}
        refreshing={refreshing}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 24 }}>Aucune conversation.</Text>}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
            <Text>{item.title ?? "Conversation"}</Text>
            <Text>{item.updated_at ?? ""}</Text>
          </View>
        )}
      />
    </View>
  );
}
