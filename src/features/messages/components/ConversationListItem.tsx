import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Conversation } from "../types";
import { colors } from "../../../core/theme/colors";
import { useUserId } from "../../../hooks/useCompany";
interface Props {
  conversation: Conversation;
  onPress: () => void;
}
export function ConversationListItem({ conversation, onPress }: Props) {
  const userId = useUserId();
  const displayName = getConversationName(conversation, userId);
  const lastMessageText = conversation.last_message?.content || "Aucun message";
  const hasUnread = (conversation.unread_count || 0) > 0;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{displayName}</Text>
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conversation.unread_count}</Text>
            </View>
          )}
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessageText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
function getConversationName(conversation: Conversation, userId: string | null): string {
  if (conversation.type === "group" && conversation.name) {
    return conversation.name;
  }
  // Direct: show other person's name
  const otherParticipant = conversation.participants?.find((p) => p.user_id !== userId);
  if (otherParticipant?.user) {
    const { first_name, last_name, email } = otherParticipant.user;
    return `${first_name || ""} ${last_name || ""}`.trim() || email;
  }
  return "Conversation";
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  lastMessage: {
    fontSize: 14,
    color: colors.muted,
  },
});
