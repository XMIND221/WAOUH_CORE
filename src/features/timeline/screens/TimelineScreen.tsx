import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useTimeline } from "../hooks/useTimeline";
function formatRelativeTime(input: string | null): string {
  if (!input) return "à l’instant";
  const date = new Date(input);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (Number.isNaN(diffMs)) return "à l’instant";
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return "à l’instant";
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
export function TimelineScreen() {
  const { items, loading, refreshing, loadingMore, error, reload, loadMore } = useTimeline();
  const emptyText = useMemo(() => {
    if (loading) return "Chargement de la timeline...";
    if (error) return "Aucune activité disponible.";
    return "Aucune activité pour le moment.";
  }, [loading, error]);
  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => void reload()}
        refreshing={refreshing}
        onEndReachedThreshold={0.4}
        onEndReached={() => void loadMore()}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const actor = item.actor_name || item.actor_email || "Utilisateur inconnu";
          const action = item.action || "Action";
          const entityType = item.entity_type || "élément";
          const relative = formatRelativeTime(item.created_at);
          return (
            <View style={styles.card}>
              <Text style={styles.title}>
                <Text style={styles.actor}>{actor}</Text>
                <Text>{` • ${action} • ${entityType}`}</Text>
              </Text>
              <Text style={styles.time}>{relative}</Text>
            </View>
          );
        }}
      />
      {loading && !refreshing && items.length === 0 ? (
        <View style={styles.initialLoader}>
          <ActivityIndicator size="small" />
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  listContent: { padding: 12, paddingBottom: 20 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  emptyText: { color: "#6b7280", textAlign: "center" },
  error: { color: "#dc2626", paddingHorizontal: 12, paddingTop: 10 },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  title: { color: "#111827", fontSize: 14 },
  actor: { fontWeight: "700" },
  time: { marginTop: 6, color: "#6b7280", fontSize: 12 },
  footerLoader: { paddingVertical: 12 },
  initialLoader: { position: "absolute", left: 0, right: 0, top: 12, alignItems: "center" },
});
