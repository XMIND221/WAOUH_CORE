import React from "react";
import { ScrollView, View, StyleSheet, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ERPHeader } from "../../core/components/ERPHeader";
import { StatCard } from "../../core/components/StatCard";
import { Screen } from "../../core/layout/Screen";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { useCompanyId } from "../../hooks/useCompany";
async function fetchDashboardMetrics(companyId: string) {
  const [employees, clients, invoices, unpaid, timeline] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("is_deleted", false),
    supabase.from("invoices").select("*", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("invoices").select("*", { count: "exact", head: true }).eq("company_id", companyId).neq("status", "paid"),
    supabase.from("timeline_events").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(10),
  ]);
  if (employees.error || clients.error || invoices.error || unpaid.error || timeline.error) {
    throw new Error("failed");
  }
  return {
    employees: employees.count ?? 0,
    clients: clients.count ?? 0,
    invoices: invoices.count ?? 0,
    unpaid: unpaid.count ?? 0,
    timeline: timeline.data ?? [],
  };
}
export function DashboardScreen() {
  const companyId = useCompanyId();
  const query = useQuery({
    queryKey: ["dashboard", companyId],
    queryFn: () => fetchDashboardMetrics(companyId as string),
    enabled: !!companyId,
  });
  return (
    <Screen>
      <ERPHeader title="Dashboard" subtitle="Live metrics" />
      <ScrollView contentContainerStyle={styles.content}>
        {query.isLoading && <Text style={styles.stateText}>Loading...</Text>}
        {query.isError && <Text style={styles.stateText}>Error loading data</Text>}
        {query.data && (
          <>
            <View style={styles.grid}>
              <StatCard label="Employees" value={query.data.employees} />
              <StatCard label="Clients" value={query.data.clients} accent={colors.success} />
              <StatCard label="Invoices" value={query.data.invoices} accent={colors.info} />
              <StatCard label="Unpaid" value={query.data.unpaid} accent={colors.warning} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Latest timeline</Text>
              {query.data.timeline.length === 0 ? (
                <Text style={styles.stateText}>No events</Text>
              ) : (
                query.data.timeline.map((item: any) => (
                  <View key={item.id} style={styles.eventRow}>
                    <Text style={styles.eventAction}>{item.action}</Text>
                    <Text style={styles.eventMeta}>{item.entity_type}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  grid: { gap: 12 },
  stateText: { color: colors.muted },
  section: { gap: 8 },
  sectionTitle: { color: colors.text, fontWeight: "700" },
  eventRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  eventAction: { color: colors.text, fontWeight: "600" },
  eventMeta: { color: colors.muted },
});
