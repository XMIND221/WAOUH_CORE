import React from "react";
import { FlatList, StyleSheet, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ERPHeader } from "../../core/components/ERPHeader";
import { Card } from "../../core/components/Card";
import { Screen } from "../../core/layout/Screen";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { useCompanyId } from "../../hooks/useCompany";
async function fetchNotifications(companyId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export function NotificationsScreen() {
  const companyId = useCompanyId();
  const query = useQuery({
    queryKey: ["notifications", companyId],
    queryFn: () => fetchNotifications(companyId as string),
    enabled: !!companyId,
  });
  return (
    <Screen>
      <ERPHeader title="Notifications" subtitle="In-app" />
      {query.isLoading && <Text style={styles.state}>Loading...</Text>}
      {query.isError && <Text style={styles.state}>Error loading notifications</Text>}
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.muted}>{item.body}</Text>
          </Card>
        )}
        ListEmptyComponent={!query.isLoading ? <Text style={styles.state}>No notifications</Text> : null}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: { margin: 12 },
  title: { color: colors.text, fontWeight: "700" },
  muted: { color: colors.muted },
  state: { color: colors.muted, padding: 16 },
});
