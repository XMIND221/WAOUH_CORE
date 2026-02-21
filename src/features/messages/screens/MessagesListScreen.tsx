// filepath: D:\WAOUH_CORE\waouh_core_app\src\features\messages\screens\MessagesListScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ErpLayout } from "../../../core/layout/ErpLayout";
import { colors } from "../../../core/theme/colors";
import { useConversations } from "../hooks/useConversations";
import { useTeamMembers } from "../hooks/useTeamMembers";
import { ConversationListItem } from "../components/ConversationListItem";
import { useUserId } from "../../../hooks/useCompany";
import { Conversation } from "../types";
type CreateMode = "direct" | "group";
function getConversationLabel(conversation: Conversation, userId: string | null): string {
  if (conversation.type === "group" && conversation.name) return conversation.name;
  const other = conversation.participants?.find((p) => p.user_id !== userId);
  if (other?.user) {
    const { first_name, last_name, email } = other.user;
    return `${first_name || ""} ${last_name || ""}`.trim() || email;
  }
  return "Conversation";
}
export function MessagesListScreen() {
  const navigation = useNavigation<any>();
  const currentUserId = useUserId();
  const {
    conversations,
    isLoading,
    isError,
    createConversation,
    isCreating,
    loadMore,
    hasMore,
    isLoadingMore,
  } = useConversations();
  const { data: teamMembers, isLoading: isLoadingMembers } = useTeamMembers();
  const [showNewChat, setShowNewChat] = useState(false);
  const [mode, setMode] = useState<CreateMode>("direct");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [debouncedConversationSearch, setDebouncedConversationSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedConversationSearch(conversationSearch.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [conversationSearch]);
  const availableMembers = useMemo(() => (teamMembers || []).filter((m) => !!m?.id), [teamMembers]);
  const filteredMembers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return availableMembers;
    return availableMembers.filter((m) => {
      const full = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
      const role = (m.role || "").toLowerCase();
      return full.includes(q) || role.includes(q);
    });
  }, [availableMembers, searchText]);
  const filteredConversations = useMemo(() => {
    const q = debouncedConversationSearch;
    if (!q) return conversations;
    return conversations.filter((c) => {
      const label = getConversationLabel(c, currentUserId).toLowerCase();
      const last = (c.last_message?.content || "").toLowerCase();
      return label.includes(q) || last.includes(q);
    });
  }, [conversations, debouncedConversationSearch, currentUserId]);
  const resetModal = () => {
    setShowNewChat(false);
    setMode("direct");
    setSelectedUserIds([]);
    setGroupName("");
    setSearchText("");
  };
  const toggleUser = (id: string) => {
    if (mode === "direct") {
      setSelectedUserIds((prev) => (prev[0] === id ? [] : [id]));
      return;
    }
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleCreateConversation = async () => {
    if (mode === "direct" && selectedUserIds.length !== 1) {
      Alert.alert("Erreur", "Sélectionnez un seul utilisateur");
      return;
    }
    if (mode === "group" && selectedUserIds.length < 2) {
      Alert.alert("Erreur", "Sélectionnez au moins 2 utilisateurs");
      return;
    }
    try {
      const conversation = await createConversation({
        type: mode,
        name: mode === "group" ? groupName.trim() || null : undefined,
        participant_ids: selectedUserIds,
      });
      resetModal();
      navigation.navigate("ChatScreen", { conversationId: conversation.id });
    } catch (error: any) {
      Alert.alert("Erreur", error?.message || "Impossible de créer la conversation");
    }
  };
  return (
    <ErpLayout title="Messages">
      <View style={styles.container}>
        <TouchableOpacity style={styles.newChatButton} onPress={() => setShowNewChat(true)}>
          <Text style={styles.newChatButtonText}>+ Nouvelle conversation</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          value={conversationSearch}
          onChangeText={setConversationSearch}
          placeholder="Rechercher une conversation..."
          placeholderTextColor={colors.muted}
        />
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : isError ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Impossible de charger les conversations.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationListItem
                conversation={item}
                onPress={() => navigation.navigate("ChatScreen", { conversationId: item.id })}
              />
            )}
            onEndReached={() => {
              if (hasMore && !isLoadingMore) loadMore();
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isLoadingMore ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} /> : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {debouncedConversationSearch ? "Aucun résultat" : "Aucune conversation"}
                </Text>
              </View>
            }
          />
        )}
        <Modal visible={showNewChat} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nouvelle conversation</Text>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeBtn, mode === "direct" && styles.modeBtnActive]}
                  onPress={() => {
                    setMode("direct");
                    setSelectedUserIds((prev) => (prev.length > 1 ? [] : prev));
                  }}
                >
                  <Text style={[styles.modeText, mode === "direct" && styles.modeTextActive]}>Direct</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, mode === "group" && styles.modeBtnActive]}
                  onPress={() => setMode("group")}
                >
                  <Text style={[styles.modeText, mode === "group" && styles.modeTextActive]}>Groupe</Text>
                </TouchableOpacity>
              </View>
              {mode === "group" && (
                <TextInput
                  style={styles.groupInput}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Nom du groupe (optionnel)"
                  placeholderTextColor={colors.muted}
                  maxLength={80}
                />
              )}
              <TextInput
                style={styles.groupInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Rechercher un membre..."
                placeholderTextColor={colors.muted}
              />
              {isLoadingMembers ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <FlatList
                  data={filteredMembers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const selected = selectedUserIds.includes(item.id);
                    return (
                      <TouchableOpacity
                        style={[styles.userItem, selected && styles.userItemSelected]}
                        onPress={() => toggleUser(item.id)}
                      >
                        <Text style={styles.userName}>
                          {item.first_name || ""} {item.last_name || ""}
                        </Text>
                        <Text style={styles.userRole}>{item.role}</Text>
                      </TouchableOpacity>
                    );
                  }}
                  style={styles.userList}
                  ListEmptyComponent={<Text style={styles.emptyText}>Aucun membre trouvé</Text>}
                />
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={resetModal}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateConversation} disabled={isCreating}>
                  {isCreating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createButtonText}>Créer</Text>}
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
  container: { flex: 1 },
  loader: { marginTop: 100 },
  newChatButton: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  newChatButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 16 },
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
  modalTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 12 },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeText: { color: colors.text, fontWeight: "600" },
  modeTextActive: { color: "#fff" },
  groupInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginBottom: 12,
  },
  userList: { marginBottom: 20 },
  userItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  userItemSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  userName: { fontSize: 16, fontWeight: "600", color: colors.text },
  userRole: { fontSize: 14, color: colors.muted, marginTop: 2 },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelButtonText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  createButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
