import React from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useTimeline } from "./useTimeline";
export function TimelineScreen() {
  const { events, isLoading } = useTimeline();
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Timeline des activités</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventUser}>{item.user_email}</Text>
              <Text style={styles.eventTime}>
                {new Date(item.created_at).toLocaleString("fr-FR")}
              </Text>
            </View>
            <Text style={styles.eventAction}>{item.action}</Text>
            <Text style={styles.eventType}>
              {item.entity_type} {item.entity_id && `#${item.entity_id.substring(0, 8)}`}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucune activité récente</Text>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  eventCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  eventHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  eventUser: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
  eventTime: { fontSize: 12, color: "#6b7280" },
  eventAction: { fontSize: 16, marginBottom: 4, color: "#374151" },
  eventType: { fontSize: 12, color: "#9ca3af" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
});