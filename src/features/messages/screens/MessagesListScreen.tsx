import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Alert } from "react-native";
import { ErpLayout } from "../../../core/layout/ErpLayout";
import { colors } from "../../../core/theme/colors";
import { useConversations } from "../hooks/useConversations";
import { useTeamMembers } from "../hooks/useTeamMembers";
import { ConversationListItem } from "../components/ConversationListItem";
import { useNavigation } from "@react-navigation/native";
export function MessagesListScreen() {
  const navigation = useNavigation();
  const { conversations, isLoading, createConversation, isCreating } = useConversations();
  const { data: teamMembers } = useTeamMembers();
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const handleCreateDirectChat = async () => {
    if (!selectedUserId) {
      Alert.alert("Erreur", "Sélectionnez un utilisateur");
      return;
    }
    try {
      const conversation = await createConversation({
        type: "direct",
        participant_ids: [selectedUserId],
      });
      setShowNewChat(false);
      setSelectedUserId(null);
      // @ts-ignore
      navigation.navigate("ChatScreen", { conversationId: conversation.id });
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };
  if (isLoading) {
    return (
      <ErpLayout title="Messages">
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </ErpLayout>
    );
  }
  return (
    <ErpLayout title="Messages">
      <View style={styles.container}>
        <TouchableOpacity style={styles.newChatButton} onPress={() => setShowNewChat(true)}>
          <Text style={styles.newChatButtonText}>+ Nouvelle conversation</Text>
        </TouchableOpacity>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationListItem
              conversation={item}
              onPress={() => {
                // @ts-ignore
                navigation.navigate("ChatScreen", { conversationId: item.id });
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune conversation</Text>
            </View>
          }
        />
        <Modal visible={showNewChat} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nouvelle conversation</Text>
              <FlatList
                data={teamMembers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.userItem,
                      selectedUserId === item.id && styles.userItemSelected,
                    ]}
                    onPress={() => setSelectedUserId(item.id)}
                  >
                    <Text style={styles.userName}>
                      {item.first_name} {item.last_name}
                    </Text>
                    <Text style={styles.userRole}>{item.role}</Text>
                  </TouchableOpacity>
                )}
                style={styles.userList}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowNewChat(false);
                    setSelectedUserId(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateDirectChat}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.createButtonText}>Créer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 100,
  },
  newChatButton: {
    margin: 16,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  newChatButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 20,
  },
  userList: {
    marginBottom: 20,
  },
  userItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  userItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  userRole: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
