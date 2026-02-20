import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { TimelineEvent } from "../types";
import { colors } from "../../../core/theme/colors";
interface Props {
  event: TimelineEvent;
  index: number;
}
const eventConfig: Record<string, { icon: string; color: string; label: string }> = {
  project_created: { icon: "📁", color: colors.primary, label: "Projet créé" },
  task_created: { icon: "✅", color: colors.info, label: "Tâche créée" },
  task_status_changed: { icon: "🔄", color: colors.warning, label: "Statut tâche changé" },
  client_created: { icon: "👤", color: colors.success, label: "Client créé" },
  deal_created: { icon: "💰", color: colors.success, label: "Deal créé" },
  deal_stage_changed: { icon: "📊", color: colors.info, label: "Stage deal changé" },
  invoice_created: { icon: "🧾", color: colors.primary, label: "Facture créée" },
  invoice_paid: { icon: "✅", color: colors.success, label: "Facture payée" },
  user_added: { icon: "➕", color: colors.info, label: "Utilisateur ajouté" },
  user_role_changed: { icon: "🔐", color: colors.warning, label: "Rôle modifié" },
  security_event: { icon: "🛡️", color: colors.danger, label: "Événement sécurité" },
};
export function TimelineEventCard({ event, index }: Props) {
  const config = eventConfig[event.action] || { icon: "📌", color: colors.muted, label: event.action };
  const userName = event.user
    ? `${event.user.first_name || ""} ${event.user.last_name || ""}`.trim() || event.user.email
    : "Système";
  const timeAgo = getTimeAgo(event.created_at);
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 300, delay: index * 30 }}
      style={styles.container}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.action}>{config.label}</Text>
        <Text style={styles.user}>Par {userName}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
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
  if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
  return date.toLocaleDateString("fr-FR");
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  action: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  user: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
