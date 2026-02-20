import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, TextInput } from "react-native";
import { useAuditLogs, AuditLog } from "./useAuditLogs";
import { ProtectedRoute } from "../../components/ProtectedRoute";
const entityTypeColors: Record<AuditLog["entity_type"], string> = {
  client: "#3b82f6",
  invoice: "#10b981",
  message: "#8b5cf6",
  user: "#f59e0b",
  settings: "#6b7280",
  other: "#ec4899",
};
const entityTypeLabels: Record<AuditLog["entity_type"], string> = {
  client: "Client",
  invoice: "Facture",
  message: "Message",
  user: "Utilisateur",
  settings: "Paramètres",
  other: "Autre",
};
export function AuditLogsScreen() {
  const [filters, setFilters] = useState<{
    entityType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  const { logs, isLoading, stats, refetch } = useAuditLogs(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }
  return (
    <ProtectedRoute permission="view_security_logs">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 Audit Logs</Text>
          <Pressable onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
            <Text style={styles.filterButtonText}>🔍 Filtres</Text>
          </Pressable>
        </View>
        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          {Object.entries(stats.byEntityType).slice(0, 3).map(([type, count]) => (
            <View key={type} style={styles.statCard}>
              <Text style={styles.statValue}>{count}</Text>
              <Text style={styles.statLabel}>{entityTypeLabels[type as AuditLog["entity_type"]]}</Text>
            </View>
          ))}
        </View>
        {/* Filtres */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <Text style={styles.filtersTitle}>Filtrer par :</Text>
            <View style={styles.filterRow}>
              {Object.entries(entityTypeLabels).map(([type, label]) => (
                <Pressable
                  key={type}
                  onPress={() => setFilters({ ...filters, entityType: type })}
                  style={[
                    styles.filterChip,
                    filters.entityType === type && styles.filterChipActive,
                  ]}
                >
                  <Text style={styles.filterChipText}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => {
                setFilters({});
                refetch();
              }}
              style={styles.clearFiltersButton}
            >
              <Text style={styles.clearFiltersText}>Réinitialiser</Text>
            </Pressable>
          </View>
        )}
        {/* Liste des logs */}
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedLog(item)}
              style={[
                styles.logCard,
                { borderLeftColor: entityTypeColors[item.entity_type] },
              ]}
            >
              <View style={styles.logHeader}>
                <View style={[styles.entityBadge, { backgroundColor: entityTypeColors[item.entity_type] }]}>
                  <Text style={styles.entityBadgeText}>{entityTypeLabels[item.entity_type]}</Text>
                </View>
                <Text style={styles.logTime}>
                  {new Date(item.created_at).toLocaleString("fr-FR")}
                </Text>
              </View>
              <Text style={styles.logAction}>{item.action}</Text>
              <Text style={styles.logUser}>Par : {item.user_email}</Text>
              {item.entity_id && (
                <Text style={styles.logEntityId}>ID: {item.entity_id.substring(0, 8)}</Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun log d'audit</Text>
          }
        />
        {/* Modal détails */}
        {selectedLog && (
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Détails du log</Text>
              <Text style={styles.modalLabel}>Action : {selectedLog.action}</Text>
              <Text style={styles.modalLabel}>Type : {entityTypeLabels[selectedLog.entity_type]}</Text>
              <Text style={styles.modalLabel}>Utilisateur : {selectedLog.user_email}</Text>
              <Text style={styles.modalLabel}>
                Date : {new Date(selectedLog.created_at).toLocaleString("fr-FR")}
              </Text>
              {selectedLog.old_values && (
                <>
                  <Text style={styles.modalLabel}>Anciennes valeurs :</Text>
                  <Text style={styles.modalValue}>{JSON.stringify(selectedLog.old_values, null, 2)}</Text>
                </>
              )}
              {selectedLog.new_values && (
                <>
                  <Text style={styles.modalLabel}>Nouvelles valeurs :</Text>
                  <Text style={styles.modalValue}>{JSON.stringify(selectedLog.new_values, null, 2)}</Text>
                </>
              )}
              <Pressable onPress={() => setSelectedLog(null)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>Fermer</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ProtectedRoute>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  filterButton: { backgroundColor: "#3b82f6", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  filterButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  statsContainer: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 12, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  filtersPanel: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 20 },
  filtersTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  filterChip: { backgroundColor: "#e5e7eb", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  filterChipActive: { backgroundColor: "#3b82f6" },
  filterChipText: { fontSize: 14, color: "#374151" },
  clearFiltersButton: { backgroundColor: "#ef4444", padding: 8, borderRadius: 8, alignItems: "center" },
  clearFiltersText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  logCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  logHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  entityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  entityBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  logTime: { fontSize: 12, color: "#6b7280" },
  logAction: { fontSize: 16, fontWeight: "600", marginBottom: 4, color: "#1f2937" },
  logUser: { fontSize: 14, color: "#6b7280", marginBottom: 2 },
  logEntityId: { fontSize: 12, color: "#9ca3af" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { backgroundColor: "#fff", padding: 24, borderRadius: 12, maxWidth: 500, width: "90%" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 8 },
  modalValue: { fontSize: 12, color: "#6b7280", backgroundColor: "#f3f4f6", padding: 8, borderRadius: 6, marginTop: 4 },
  modalCloseButton: { backgroundColor: "#3b82f6", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 16 },
  modalCloseText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});