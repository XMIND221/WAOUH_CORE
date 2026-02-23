import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
type ConversationRow = {
  id: string;
  title: string | null;
  updated_at: string | null;
};
type NavigationLike = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};
export function MessagesListScreen() {
  const navigation = useNavigation<NavigationLike>();
  const mountedRef = useRef(true);
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchConversations = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated || !user?.id) {
      setItems([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("conversations")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false });
      if (!mountedRef.current) return;
      if (fetchError) {
        setItems([]);
        setError(fetchError.message);
        return;
      }
      setItems((data ?? []) as ConversationRow[]);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setItems([]);
      setError(e instanceof Error ? e.message : "Impossible de charger les messages");
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?.id]);
  useEffect(() => {
    mountedRef.current = true;
    void fetchConversations(false);
    return () => {
      mountedRef.current = false;
    };
  }, [fetchConversations]);
  const emptyText = useMemo(() => {
    if (!isAuthenticated) return "Veuillez vous connecter.";
    if (loading) return "Chargement des messages...";
    if (error) return "Aucun message disponible.";
    return "Aucune conversation.";
  }, [isAuthenticated, loading, error]);
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => void fetchConversations(true)}
        refreshing={refreshing}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => navigation.navigate("ChatScreen", { conversationId: item.id, title: item.title ?? "Conversation" })}
          >
            <Text style={styles.title}>{item.title ?? "Conversation"}</Text>
            <Text style={styles.subtitle}>{item.updated_at ?? ""}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  loader: { marginTop: 12 },
  error: { color: "#dc2626", paddingHorizontal: 16, paddingBottom: 8 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6b7280" },
  item: {
    backgroundColor: "#ffffff",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  title: { fontSize: 15, fontWeight: "600", color: "#111827" },
  subtitle: { marginTop: 4, color: "#6b7280", fontSize: 12 },
});
