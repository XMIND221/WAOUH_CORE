import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, ActivityIndicator, Linking } from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { useInternalMessages } from "./useInternalMessages";
import { AttachmentUploader } from "./AttachmentUploader";
export function MessagingScreen() {
  const { userProfile } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const { messages, isLoading: isLoadingMessages, unreadCount, markAsRead } = useInternalMessages(selected?.id);
  useEffect(() => {
    if (!userProfile?.company_id) return;
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("*, conversation_participants!inner(user_id)")
        .eq("company_id", userProfile.company_id);
      if (!error && data) {
        setConversations(data);
      }
      setIsLoadingConversations(false);
    };
    fetchConversations();
  }, [userProfile?.company_id]);
  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || !selected || !userProfile) return;
    const { error } = await supabase.from("internal_messages").insert({
      conversation_id: selected.id,
      sender_id: userProfile.id,
      content: input.trim(),
      attachments: attachments.length > 0 ? attachments : null,
      read: false,
    });
    if (!error) {
      setInput("");
      setAttachments([]);
    }
  };
  const handleAttachmentUpload = (url: string) => {
    setAttachments([...attachments, url]);
  };
  if (!userProfile) {
    return (
      <View style={styles.container}>
        <Text>Chargement du profil...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Conversations {unreadCount > 0 && `(${unreadCount})`}</Text>
        {isLoadingConversations ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : conversations.length === 0 ? (
          <Text style={styles.emptyText}>Aucune conversation</Text>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelected(item)}
                style={[
                  styles.conversationItem,
                  selected?.id === item.id && styles.conversationItemActive,
                ]}
              >
                <Text style={styles.conversationName}>
                  {item.name || ("Conversation " + item.id.substring(0, 8))}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>
      <View style={styles.chatArea}>
        {selected ? (
          <>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>
                {selected.name || ("Conversation " + selected.id.substring(0, 8))}
              </Text>
            </View>
            {isLoadingMessages ? (
              <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
            ) : (
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                renderItem={({ item }) => {
                  const isMyMessage = item.sender_id === userProfile.id;
                  return (
                    <View
                      style={[
                        styles.messageBubble,
                        isMyMessage ? styles.myMessage : styles.otherMessage,
                      ]}
                    >
                      <Text style={styles.messageSender}>{item.sender_email}</Text>
                      <Text style={styles.messageText}>{item.content}</Text>
                      {item.attachments && item.attachments.length > 0 && (
                        <View style={styles.attachmentsContainer}>
                          {item.attachments.map((url, idx) => (
                            <Pressable
                              key={idx}
                              onPress={() => Linking.openURL(url)}
                              style={styles.attachmentButton}
                            >
                              <Text style={styles.attachmentText}>📎 Fichier {idx + 1}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                      <Text style={styles.messageTime}>
                        {new Date(item.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  );
                }}
              />
            )}
            <View style={styles.inputContainer}>
              <AttachmentUploader onUploadComplete={handleAttachmentUpload} />
              <TextInput
                value={input}
                onChangeText={setInput}
                style={styles.input}
                placeholder="Tapez votre message..."
                multiline
                onSubmitEditing={sendMessage}
              />
              <Pressable onPress={sendMessage} style={styles.sendButton}>
                <Text style={styles.sendButtonText}>Envoyer</Text>
              </Pressable>
            </View>
            {attachments.length > 0 && (
              <View style={styles.attachmentsPreview}>
                {attachments.map((url, idx) => (
                  <Text key={idx} style={styles.attachmentPreviewText}>📎 Fichier {idx + 1}</Text>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              Sélectionnez une conversation pour commencer
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#fff" },
  sidebar: { width: 300, borderRightWidth: 1, borderColor: "#e5e7eb", padding: 12, backgroundColor: "#f9fafb" },
  sidebarTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  conversationItem: { padding: 12, borderRadius: 8, marginBottom: 4, backgroundColor: "#fff" },
  conversationItemActive: { backgroundColor: "#eff6ff" },
  conversationName: { fontSize: 14, color: "#374151" },
  emptyText: { fontSize: 14, color: "#9ca3af", textAlign: "center", marginTop: 20 },
  chatArea: { flex: 1, padding: 16 },
  chatHeader: { borderBottomWidth: 1, borderColor: "#e5e7eb", paddingBottom: 12, marginBottom: 12 },
  chatTitle: { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  messagesList: { flex: 1, marginBottom: 12 },
  messageBubble: { marginBottom: 8, padding: 10, borderRadius: 12, maxWidth: "70%" },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#3b82f6" },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#f3f4f6" },
  messageSender: { fontSize: 11, fontWeight: "600", color: "#6b7280", marginBottom: 4 },
  messageText: { fontSize: 14, color: "#1f2937" },
  messageTime: { fontSize: 11, color: "#6b7280", marginTop: 4 },
  attachmentsContainer: { marginTop: 8 },
  attachmentButton: { backgroundColor: "#e5e7eb", padding: 6, borderRadius: 4, marginBottom: 4 },
  attachmentText: { fontSize: 12, color: "#374151" },
  inputContainer: { flexDirection: "row", gap: 8, borderTopWidth: 1, borderColor: "#e5e7eb", paddingTop: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: { backgroundColor: "#3b82f6", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  sendButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  emptyChat: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyChatText: { fontSize: 16, color: "#9ca3af" },
  loader: { flex: 1, justifyContent: "center" },
  attachmentsPreview: { marginTop: 8, padding: 8, backgroundColor: "#f3f4f6", borderRadius: 6 },
  attachmentPreviewText: { fontSize: 12, color: "#6b7280" },
});