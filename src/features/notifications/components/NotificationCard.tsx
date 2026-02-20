import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { Notification } from "../hooks/useNotifications";
import { colors } from "../../../core/theme/colors";
interface Props {
  notification: Notification;
  onPress: () => void;
  index: number;
}
const typeConfig: Record<string, { icon: string; color: string }> = {
  task_assigned: { icon: "✅", color: colors.info },
  task_overdue: { icon: "⏰", color: colors.danger },
  new_message: { icon: "💬", color: colors.primary },
  invoice_paid: { icon: "💰", color: colors.success },
  deal_won: { icon: "🎉", color: colors.success },
  role_changed: { icon: "🔐", color: colors.warning },
  default: { icon: "📌", color: colors.muted },
};
export function NotificationCard({ notification, onPress, index }: Props) {
  const config = typeConfig[notification.type] || typeConfig.default;
  const timeAgo = getTimeAgo(notification.created_at);
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 200, delay: index * 30 }}
    >
      <TouchableOpacity
        style={[styles.container, !notification.is_read && styles.unread]}
        onPress={onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        {!notification.is_read && <View style={styles.badge} />}
      </TouchableOpacity>
    </MotiView>
  );
}
function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
  return date.toLocaleDateString("fr-FR");
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  unread: {
    backgroundColor: colors.primary + "10",
    borderColor: colors.primary + "30",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: colors.muted,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
