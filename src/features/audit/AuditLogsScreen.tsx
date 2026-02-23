import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/hooks/useAuth";
type AuditLogRow = {
  id: string;
  action: string | null;
  created_at: string | null;
  actor_email: string | null;
};
export function AuditLogsScreen() {
  const mountedRef = useRef(true);
  const { isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loadLogs = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setLogs([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("audit_logs")
        .select("id,action,created_at,actor_email")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!mountedRef.current) return;
      if (fetchError) {
        setLogs([]);
        setError(fetchError.message);
        return;
      }
      setLogs((data ?? []) as AuditLogRow[]);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setLogs([]);
      setError(e instanceof Error ? e.message : "Impossible de charger les logs");
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    mountedRef.current = true;
    void loadLogs(false);
    return () => {
      mountedRef.current = false;
    };
  }, [loadLogs]);
  const emptyText = useMemo(() => {
    if (!isAuthenticated) return "Veuillez vous connecter.";
    if (loading) return "Chargement des logs...";
    if (error) return "Aucun log disponible.";
    return "Aucun log disponible.";
  }, [isAuthenticated, loading, error]);
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        onRefresh={() => void loadLogs(true)}
        refreshing={refreshing}
        contentContainerStyle={logs.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.action}>{item.action ?? "Action"}</Text>
            <Text style={styles.meta}>{item.actor_email ?? "-"}</Text>
            <Text style={styles.meta}>{item.created_at ?? "-"}</Text>
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  loader: { marginTop: 12 },
  error: { color: "#dc2626", paddingHorizontal: 16, paddingBottom: 8 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6b7280" },
  item: {
    backgroundColor: "#ffffff",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  action: { fontSize: 14, fontWeight: "600", color: "#111827" },
  meta: { marginTop: 4, color: "#6b7280", fontSize: 12 },
});
