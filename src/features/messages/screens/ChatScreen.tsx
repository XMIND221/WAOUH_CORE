import React, { useState, useRef, useEffect } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { colors } from "../../../core/theme/colors";
import { useMessages } from "../hooks/useMessages";
import { useUserId } from "../../../hooks/useCompany";
import { MessageBubble } from "../components/MessageBubble";
interface Props {
  route: { params: { conversationId: string } };
}
export function ChatScreen({ route }: Props) {
  const { conversationId } = route.params;
  const userId = useUserId();
  const { messages, sendMessage, isSending, isLoading, isError, loadOlder, hasMore, isLoadingMore, retryMessage } = useMessages(conversationId);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setInputText("");
    try {
      await sendMessage({ conversation_id: conversationId, content: text });
    } catch {
      setInputText(text);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : isError ? (
        <View style={styles.center}><Text style={styles.infoText}>Impossible de charger les messages.</Text></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MessageBubble message={item} isMe={item.user_id === userId} index={index} retryDisabled={isSending} onRetry={(m) => { if (isSending) return; void retryMessage(m as any).then(() => Alert.alert("Succès", "Message renvoyé")).catch(() => Alert.alert("Erreur", "Échec du renvoi")); }} />
          )}
          ListHeaderComponent={
            hasMore ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadOlder} disabled={isLoadingMore}>
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Charger les anciens messages</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 ? styles.messagesListEmpty : undefined,
          ]}
          ListEmptyComponent={<Text style={styles.infoText}>Aucun message pour le moment.</Text>}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Écrivez un message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          <Text style={styles.sendButtonText}>{isSending ? "..." : "Envoyer"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  infoText: { color: colors.muted, fontSize: 15 },
  messagesList: { paddingVertical: 16 },
  messagesListEmpty: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  loadMoreBtn: { alignItems: "center", paddingVertical: 10 },
  loadMoreText: { color: colors.primary, fontWeight: "600" },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { backgroundColor: colors.muted },
  sendButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});








