// filepath: D:\WAOUH_CORE\waouh_core_app\src\features\messages\components\MessageBubble.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../../core/theme/colors";
import { Message } from "../types";
type UIMessage = Message & { pending?: boolean; failed?: boolean };
interface Props {
  message: UIMessage;
  isOwn?: boolean;
  isMe?: boolean;
  index?: number;
  onRetry?: (message: UIMessage) => void;
  retryDisabled?: boolean;
}
function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
export function MessageBubble({ message, isOwn, isMe, onRetry, retryDisabled }: Props) {
  const mine = typeof isOwn === "boolean" ? isOwn : !!isMe;
  const status = message.failed ? "Échec" : message.pending ? "Envoi..." : "";
  return (
    <View style={[styles.row, mine ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, mine ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.content, mine ? styles.contentOwn : styles.contentOther]}>
          {message.content}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.time, mine ? styles.timeOwn : styles.timeOther]}>
            {formatTime(message.created_at)}
          </Text>
          {!!status && (
            <Text style={[styles.status, message.failed ? styles.statusFailed : styles.statusPending]}>
              {status}
            </Text>
          )}
        </View>
        {message.failed && !!onRetry && (
          <TouchableOpacity disabled={!!retryDisabled} onPress={() => onRetry(message)}>
            <Text style={[styles.retryText, retryDisabled && styles.retryTextDisabled]}>
              {retryDisabled ? "Renvoi..." : "Renvoyer"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: 12,
    flexDirection: "row",
  },
  rowOwn: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleOwn: { backgroundColor: colors.primary },
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  content: { fontSize: 15 },
  contentOwn: { color: "#fff" },
  contentOther: { color: colors.text },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  time: { fontSize: 11 },
  timeOwn: { color: "rgba(255,255,255,0.85)" },
  timeOther: { color: colors.muted },
  status: { fontSize: 11, fontWeight: "600" },
  statusPending: { color: "#f59e0b" },
  statusFailed: { color: colors.danger },
  retryText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: colors.danger,
    textAlign: "right",
  },
  retryTextDisabled: {
    opacity: 0.6,
  },
});
