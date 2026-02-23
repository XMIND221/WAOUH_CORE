// filepath: d:\WAOUH_CORE\waouh_core_app\src\features\messages\screens\ChatScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useAuth } from "../../auth/hooks/useAuth";
import { MessageRow, useRealtimeMessages } from "../hooks/useRealtimeMessages";
type ChatRouteParams = {
  conversationId: string;
  title?: string;
  recipientId?: string | null;
};
type ChatRoute = RouteProp<{ ChatScreen: ChatRouteParams }, "ChatScreen">;
export function ChatScreen() {
  const route = useRoute<ChatRoute>();
  const { user, isAuthenticated } = useAuth();
  const conversationId = route.params?.conversationId ?? "";
  const title = route.params?.title ?? "Conversation";
  const recipientId = route.params?.recipientId ?? null;
  const { messages, unreadCount, loading, sending, error, sendMessage, markAsRead } =
    useRealtimeMessages(conversationId);
  const listRef = useRef<FlatList<MessageRow> | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const [text, setText] = useState<string>("");
  useEffect(() => {
    void markAsRead();
  }, [markAsRead, messages.length]);
  useEffect(() => {
    const lastId = messages.length > 0 ? messages[messages.length - 1].id : null;
    if (!lastId) return;
    if (lastMessageIdRef.current === lastId) return;
    lastMessageIdRef.current = lastId;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);
  const onSend = async () => {
    const ok = await sendMessage(text, recipientId);
    if (ok) setText("");
  };
  const emptyText = useMemo(() => {
    if (!isAuthenticated) return "Veuillez vous connecter.";
    if (loading) return "Chargement des messages...";
    return "Aucun message.";
  }, [isAuthenticated, loading]);
  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text>Veuillez vous connecter.</Text>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      </View>
      {loading ? <ActivityIndicator size="small" style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={messages.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
              <Text style={[styles.messageText, mine ? styles.messageTextMine : styles.messageTextOther]}>
                {item.content}
              </Text>
              <Text style={styles.meta}>
                {item.created_at ? new Date(item.created_at).toLocaleTimeString() : ""}
              </Text>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Écrire un message..."
          style={styles.input}
          editable={!sending}
          multiline
        />
        <Pressable style={[styles.sendBtn, sending ? styles.sendBtnDisabled : null]} onPress={onSend} disabled={sending}>
          <Text style={styles.sendBtnText}>{sending ? "..." : "Envoyer"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    height: 56,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  loader: { marginTop: 10 },
  error: { color: "#dc2626", paddingHorizontal: 12, paddingTop: 6 },
  listContent: { padding: 12, paddingBottom: 8 },
  emptyContainer: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#6b7280" },
  bubble: {
    maxWidth: "85%",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  bubbleMine: { backgroundColor: "#2563eb", alignSelf: "flex-end" },
  bubbleOther: { backgroundColor: "#ffffff", alignSelf: "flex-start", borderWidth: 1, borderColor: "#e5e7eb" },
  messageText: { fontSize: 14 },
  messageTextMine: { color: "#ffffff" },
  messageTextOther: { color: "#111827" },
  meta: { marginTop: 4, fontSize: 10, color: "#9ca3af" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    padding: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  sendBtn: {
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: "#fff", fontWeight: "700" },
});
