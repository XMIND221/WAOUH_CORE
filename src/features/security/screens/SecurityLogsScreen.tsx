import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SecurityLogItem, useSecurityLogs } from "../hooks/useSecurityLogs";
function formatRelativeTime(input: string | null): string {
  if (!input) return "à l’instant";
  const date = new Date(input);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (Number.isNaN(diffMs) || diffMs < 60 * 1000) return "à l’instant";
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < hour) {
    const n = Math.floor(diffMs / minute);
    return n <= 1 ? "il y a 1 minute" : `il y a ${n} minutes`;
  }
  if (diffMs < day) {
    const n = Math.floor(diffMs / hour);
    return n <= 1 ? "il y a 1 heure" : `il y a ${n} heures`;
  }
  const n = Math.floor(diffMs / day);
  return n <= 1 ? "il y a 1 jour" : `il y a ${n} jours`;
}
function getEventLabel(item: SecurityLogItem): string {
  return item.event_type || item.action || "SECURITY_EVENT";
}
export function SecurityLogsScreen() {
  const { items, loading, refreshing, loadingMore, error, reload, loadMore } = useSecurityLogs();
  const emptyText = useMemo(() => {
    if (loading) return "Chargement des logs de sécurité...";
    if (error) return "Aucun log de sécurité disponible.";
    return "Aucun log de sécurité.";
  }, [loading, error]);
  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => void reload()}
        refreshing={refreshing}
        onEndReachedThreshold={0.35}
        onEndReached={() => void loadMore()}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.content}
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const actor = item.actor_name || item.actor_email || "Utilisateur inconnu";
          const eventLabel = getEventLabel(item);
          const status = item.status ? ` • ${item.status}` : "";
          const message = item.message || "";
          const when = formatRelativeTime(item.created_at);
          return (
            <View style={styles.card}>
              <Text style={styles.title}>
                <Text style={styles.actor}>{actor}</Text>
                <Text>{` • ${eventLabel}${status}`}</Text>
              </Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}
              <Text style={styles.time}>{when}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 12, paddingBottom: 20 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  emptyText: { color: "#6b7280", textAlign: "center" },
  error: { color: "#dc2626", paddingHorizontal: 12, paddingTop: 10 },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  title: { color: "#111827", fontSize: 14 },
  actor: { fontWeight: "700" },
  message: { marginTop: 6, color: "#374151", fontSize: 13 },
  time: { marginTop: 6, color: "#6b7280", fontSize: 12 },
  footer: { paddingVertical: 12 },
});
