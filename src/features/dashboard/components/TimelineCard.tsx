import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { colors } from "../../../core/theme/colors";
import { TimelineEvent } from "../types";
interface Props {
  event: TimelineEvent;
  index: number;
}
const actionLabels: Record<string, string> = {
  created: "Créé",
  updated: "Modifié",
  deleted: "Supprimé",
  completed: "Terminé",
  sent: "Envoyé",
  paid: "Payé",
};
const entityLabels: Record<string, string> = {
  project: "Projet",
  task: "Tâche",
  client: "Client",
  invoice: "Facture",
  user: "Utilisateur",
};
export function TimelineCard({ event, index }: Props) {
  const action = actionLabels[event.action] || event.action;
  const entity = entityLabels[event.entity_type] || event.entity_type;
  const userName = event.user
    ? `${event.user.first_name || ""} ${event.user.last_name || ""}`.trim() || event.user.email
    : "Système";
  const timeAgo = getTimeAgo(event.created_at);
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 300, delay: index * 50 }}
      style={styles.card}
    >
      <View style={styles.dot} />
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.userName}>{userName}</Text>
          {" · "}
          <Text style={styles.action}>{action}</Text>
          {" · "}
          <Text>{entity}</Text>
        </Text>
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
  return `Il y a ${Math.floor(seconds / 86400)}j`;
}
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  userName: {
    fontWeight: "600",
    color: colors.text,
  },
  action: {
    color: colors.primary,
    fontWeight: "500",
  },
  time: {
    fontSize: 12,
    color: colors.muted,
  },
});
