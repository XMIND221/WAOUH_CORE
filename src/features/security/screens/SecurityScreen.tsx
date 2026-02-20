import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { ErpLayout } from "../../../core/layout/ErpLayout";
import { colors } from "../../../core/theme/colors";
import { supabase } from "../../../lib/supabase";
import { useCompanyId } from "../../../hooks/useCompany";
import { withRouteGuard } from "../../../core/middleware/routeGuard";
interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  user?: {
    email: string;
  };
  metadata: Record<string, any> | null;
}
function SecurityScreenComponent() {
  const companyId = useCompanyId();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchSecurityLogs();
  }, [companyId]);
  const fetchSecurityLogs = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // Logs des dernières 24h
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*, user:users!user_id(email)")
        .eq("company_id", companyId)
        .gte("created_at", yesterday)
        .in("action", ["login_failed", "user_role_changed", "permission_changed", "user_deleted"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching security logs:", error);
    } finally {
      setLoading(false);
    }
  };
  const renderLog = ({ item }: { item: AuditLog }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.action}>{item.action}</Text>
        <Text style={styles.time}>
          {new Date(item.created_at).toLocaleString("fr-FR")}
        </Text>
      </View>
      <Text style={styles.user}>
        Par: {item.user?.email || "Système"}
      </Text>
      <Text style={styles.entity}>
        Type: {item.entity_type}
      </Text>
      {item.metadata && (
        <Text style={styles.metadata}>
          Détails: {JSON.stringify(item.metadata, null, 2)}
        </Text>
      )}
    </View>
  );
  if (loading) {
    return (
      <ErpLayout title="Sécurité">
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </ErpLayout>
    );
  }
  return (
    <ErpLayout title="Sécurité">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Événements de sécurité (24h)</Text>
          <Text style={styles.headerCount}>{logs.length} événements</Text>
        </View>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderLog}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun événement de sécurité</Text>
            </View>
          }
        />
      </View>
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 100,
  },
  header: {
    padding: 16,
    backgroundColor: colors.danger + "20",
    borderBottomWidth: 1,
    borderBottomColor: colors.danger,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.danger,
    marginBottom: 4,
  },
  headerCount: {
    fontSize: 14,
    color: colors.text,
  },
  list: {
    padding: 16,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  action: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.danger,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: colors.muted,
  },
  user: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  entity: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metadata: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: "monospace",
    marginTop: 8,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
  },
});
export const SecurityScreen = withRouteGuard(SecurityScreenComponent, {
  allowedRoles: ["super_admin"],
  redirectTo: "Dashboard",
});
