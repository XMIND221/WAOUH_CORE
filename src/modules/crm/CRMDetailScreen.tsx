import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ERPHeader } from "../../core/components/ERPHeader";
import { Card } from "../../core/components/Card";
import { Screen } from "../../core/layout/Screen";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { logAudit, logTimeline } from "../../services/logging";
import { useCompanyId, useUserId } from "../../hooks/useCompany";
import { CRMStackParamList } from "./CRMNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
type Route = RouteProp<CRMStackParamList, "CRMDetail">;
type Nav = NativeStackNavigationProp<CRMStackParamList, "CRMDetail">;
async function fetchClient(companyId: string, clientId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", clientId)
    .single();
  if (error) throw error;
  return data;
}
export function CRMDetailScreen() {
  const companyId = useCompanyId();
  const userId = useUserId();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["client", companyId, route.params.clientId],
    queryFn: () => fetchClient(companyId as string, route.params.clientId),
    enabled: !!companyId,
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clients")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("company_id", companyId)
        .eq("id", route.params.clientId);
      if (error) throw error;
      await logTimeline({
        companyId: companyId as string,
        userId,
        entityType: "client",
        entityId: route.params.clientId,
        action: "client_deleted",
      });
      await logAudit({
        companyId: companyId as string,
        userId,
        action: "delete",
        entity: "client",
        entityId: route.params.clientId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", companyId] });
      navigation.goBack();
    },
  });
  return (
    <Screen>
      <ERPHeader title="Client Detail" subtitle="CRM" />
      {query.isLoading && <Text style={styles.state}>Loading...</Text>}
      {query.isError && <Text style={styles.state}>Error loading client</Text>}
      {query.data && (
        <Card>
          <Text style={styles.title}>{query.data.name}</Text>
          <Text style={styles.muted}>{query.data.email ?? "no email"}</Text>
          <View style={styles.row}>
            <Pressable onPress={() => navigation.navigate("CRMEdit", { clientId: query.data.id })}>
              <Text style={styles.link}>Edit</Text>
            </Pressable>
            <Pressable onPress={() => del.mutate()}>
              <Text style={styles.danger}>Delete</Text>
            </Pressable>
          </View>
        </Card>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { color: colors.text, fontWeight: "700", marginBottom: 6 },
  muted: { color: colors.muted },
  state: { color: colors.muted, padding: 16 },
  row: { flexDirection: "row", gap: 16, marginTop: 12 },
  link: { color: colors.primary, fontWeight: "700" },
  danger: { color: colors.danger, fontWeight: "700" },
});
