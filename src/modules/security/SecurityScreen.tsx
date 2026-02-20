import React from "react";
import { FlatList, StyleSheet, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../core/components/Card";
import { ErpLayout } from "../../core/layout/ErpLayout";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { useCompanyId } from "../../hooks/useCompany";
async function fetchSecurity(companyId: string) {
  const { data, error } = await supabase
    .from("security_logs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export function SecurityScreen() {
  const companyId = useCompanyId();
  const query = useQuery({
    queryKey: ["security", companyId],
    queryFn: () => fetchSecurity(companyId as string),
    enabled: !!companyId,
  });
  return (
    <ErpLayout title="Security Logs">
      {query.isLoading && <Text style={styles.state}>Loading...</Text>}
      {query.isError && <Text style={styles.state}>Error loading logs</Text>}
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.event}</Text>
            <Text style={styles.muted}>{item.status}</Text>
          </Card>
        )}
        ListEmptyComponent={!query.isLoading ? <Text style={styles.state}>No logs</Text> : null}
      />
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  title: { color: colors.text, fontWeight: "700" },
  muted: { color: colors.muted },
  state: { color: colors.muted },
});
