import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { Client, ClientStatus } from "../types";
import { colors } from "../../../core/theme/colors";
interface Props {
  client: Client;
  onPress: () => void;
  index: number;
}
const statusColors: Record<ClientStatus, string> = {
  prospect: colors.warning,
  lead: colors.info,
  client: colors.success,
  actif: colors.success,
  inactif: colors.muted,
};
export function ClientCard({ client, onPress, index }: Props) {
  const assignedName = client.assigned_user
    ? `${client.assigned_user.first_name || ""} ${client.assigned_user.last_name || ""}`.trim() ||
      client.assigned_user.email
    : "Non assigné";
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300, delay: index * 50 }}
    >
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.header}>
          <Text style={styles.name}>{client.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[client.status] }]}>
            <Text style={styles.statusText}>{client.status}</Text>
          </View>
        </View>
        {client.email && <Text style={styles.detail}>📧 {client.email}</Text>}
        {client.phone && <Text style={styles.detail}>📞 {client.phone}</Text>}
        <Text style={styles.assigned}>👤 {assignedName}</Text>
      </TouchableOpacity>
    </MotiView>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  assigned: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
  },
});
