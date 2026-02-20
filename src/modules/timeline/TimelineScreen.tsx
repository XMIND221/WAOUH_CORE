import React from "react";
import { FlatList, StyleSheet, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../core/components/Card";
import { ErpLayout } from "../../core/layout/ErpLayout";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { useCompanyId } from "../../hooks/useCompany";
async function fetchTimeline(companyId: string) {
  const { data, error } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export function TimelineScreen() {
  const companyId = useCompanyId();
  const query = useQuery({
    queryKey: ["timeline", companyId],
    queryFn: () => fetchTimeline(companyId as string),
    enabled: !!companyId,
  });
  return (
    <ErpLayout title="Timeline">
      {query.isLoading && <Text style={styles.state}>Loading...</Text>}
      {query.isError && <Text style={styles.state}>Error loading timeline</Text>}
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.action}</Text>
            <Text style={styles.muted}>{item.entity_type}</Text>
          </Card>
        )}
        ListEmptyComponent={!query.isLoading ? <Text style={styles.state}>No events</Text> : null}
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
