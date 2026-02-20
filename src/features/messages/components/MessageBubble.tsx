import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { Message } from "../types";
import { colors } from "../../../core/theme/colors";
interface Props {
  message: Message;
  isMe: boolean;
  index: number;
}
export function MessageBubble({ message, isMe, index }: Props) {
  const senderName = message.user
    ? `${message.user.first_name || ""} ${message.user.last_name || ""}`.trim() || message.user.email
    : "Inconnu";
  const time = new Date(message.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300, delay: index * 30 }}
      style={[styles.container, isMe ? styles.containerMe : styles.containerOther]}
    >
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {!isMe && <Text style={styles.senderName}>{senderName}</Text>}
        <Text style={[styles.content, isMe ? styles.contentMe : styles.contentOther]}>
          {message.content}
        </Text>
        <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>{time}</Text>
      </View>
    </MotiView>
  );
}
const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  containerMe: {
    alignItems: "flex-end",
  },
  containerOther: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
  },
  contentMe: {
    color: "#fff",
  },
  contentOther: {
    color: colors.text,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
  },
  timeMe: {
    color: "rgba(255,255,255,0.7)",
  },
  timeOther: {
    color: colors.muted,
  },
});
