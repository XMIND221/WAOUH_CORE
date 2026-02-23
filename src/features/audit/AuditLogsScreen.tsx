// filepath: d:\WAOUH_CORE\waouh_core_app\src\features\audit\AuditLogsScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/hooks/useAuth";
type AuditLogRow = { id: string; action: string | null; created_at: string | null; actor_email: string | null };
export function AuditLogsScreen() {
  const mountedRef = useRef(true);
  const { isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadLogs = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setLogs([]); setLoading(false); setRefreshing(false); setError(null);
      return;
    }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("audit_logs")
        .select("id,action,created_at,actor_email")
        .order("created_at", { ascending: false })
        .limit(200);
      if (fetchError) {
        if (!mountedRef.current) return;
        setLogs([]);
        setError(fetchError.message);
        return;
      }
      if (!mountedRef.current) return;
      setLogs((data ?? []) as AuditLogRow[]);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Impossible de charger les logs");
      setLogs([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    mountedRef.current = true;
    void loadLogs(false);
    return () => { mountedRef.current = false; };
  }, [loadLogs]);
  if (loading && logs.length === 0) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator /></View>;
  }
  return (
    <View style={{ flex: 1 }}>
      {error ? <Text style={{ color: "red", padding: 12 }}>{error}</Text> : null}
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        onRefresh={() => void loadLogs(true)}
        refreshing={refreshing}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 24 }}>Aucun log disponible.</Text>}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
            <Text>{item.action ?? "Action"}</Text>
            <Text>{item.actor_email ?? "-"}</Text>
            <Text>{item.created_at ?? "-"}</Text>
          </View>
        )}
      />
    </View>
  );
}
