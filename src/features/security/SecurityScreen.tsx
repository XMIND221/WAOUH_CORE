import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { useSecurityLogs, SecurityLog } from "./useSecurityLogs";
const actionLabels: Record<SecurityLog["action"], string> = {
  login: "🔓 Connexion",
  logout: "🔒 Déconnexion",
  failed_login: "❌ Tentative de connexion échouée",
  password_change: "🔑 Changement de mot de passe",
  pin_change: "📱 Changement de PIN",
  unauthorized_access: "⚠️ Accès non autorisé",
};
export function SecurityScreen() {
  const { logs, isLoading } = useSecurityLogs();
  const [filter, setFilter] = useState<SecurityLog["action"] | "all">("all");
  const filteredLogs = filter === "all" ? logs : logs.filter((log) => log.action === filter);
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 Security Logs</Text>
      <View style={styles.filterContainer}>
        <Pressable
          onPress={() => setFilter("all")}
          style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
        >
          <Text style={styles.filterText}>Tous</Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter("login")}
          style={[styles.filterButton, filter === "login" && styles.filterButtonActive]}
        >
          <Text style={styles.filterText}>Connexions</Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter("failed_login")}
          style={[styles.filterButton, filter === "failed_login" && styles.filterButtonActive]}
        >
          <Text style={styles.filterText}>Échecs</Text>
        </Pressable>
      </View>
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.logCard,
              !item.success && styles.logCardDanger,
            ]}
          >
            <View style={styles.logHeader}>
              <Text style={styles.logAction}>{actionLabels[item.action]}</Text>
              <Text style={styles.logTime}>
                {new Date(item.created_at).toLocaleString("fr-FR")}
              </Text>
            </View>
            <Text style={styles.logUser}>{item.user_email}</Text>
            {item.ip_address && (
              <Text style={styles.logDetails}>IP: {item.ip_address}</Text>
            )}
            {item.user_agent && (
              <Text style={styles.logDetails} numberOfLines={1}>
                {item.user_agent}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun log de sécurité</Text>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  filterContainer: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterButton: { backgroundColor: "#e5e7eb", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  filterButtonActive: { backgroundColor: "#3b82f6" },
  filterText: { color: "#374151", fontSize: 14, fontWeight: "600" },
  logCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  logCardDanger: { borderLeftColor: "#ef4444" },
  logHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  logAction: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  logTime: { fontSize: 12, color: "#6b7280" },
  logUser: { fontSize: 14, color: "#374151", marginBottom: 4 },
  logDetails: { fontSize: 12, color: "#9ca3af" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
});