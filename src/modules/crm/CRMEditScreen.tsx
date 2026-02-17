import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ERPHeader } from "../../core/components/ERPHeader";
import { Button } from "../../core/components/Button";
import { Input } from "../../core/components/Input";
import { Screen } from "../../core/layout/Screen";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { logAudit, logTimeline } from "../../services/logging";
import { useCompanyId, useUserId } from "../../hooks/useCompany";
import { CRMStackParamList } from "./CRMNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
type Route = RouteProp<CRMStackParamList, "CRMEdit">;
type Nav = NativeStackNavigationProp<CRMStackParamList, "CRMEdit">;
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
export function CRMEditScreen() {
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (query.data) {
      setName(query.data.name ?? "");
      setEmail(query.data.email ?? "");
    }
  }, [query.data]);
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clients")
        .update({ name, email })
        .eq("company_id", companyId)
        .eq("id", route.params.clientId);
      if (error) throw error;
      await logTimeline({
        companyId: companyId as string,
        userId,
        entityType: "client",
        entityId: route.params.clientId,
        action: "client_updated",
      });
      await logAudit({
        companyId: companyId as string,
        userId,
        action: "update",
        entity: "client",
        entityId: route.params.clientId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", companyId] });
      qc.invalidateQueries({ queryKey: ["client", companyId, route.params.clientId] });
      navigation.goBack();
    },
  });
  if (query.isLoading) {
    return (
      <Screen>
        <Text style={styles.state}>Loading...</Text>
      </Screen>
    );
  }
  if (query.isError || !query.data) {
    return (
      <Screen>
        <Text style={styles.state}>Error loading client</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <ERPHeader title="Edit Client" subtitle="CRM" />
      <Text style={styles.label}>Name</Text>
      <Input value={name} onChangeText={setName} />
      <Text style={styles.label}>Email</Text>
      <Input value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Button label={mutation.isLoading ? "Saving..." : "Save"} onPress={() => mutation.mutate()} />
      {mutation.isError && <Text style={styles.error}>Error updating client</Text>}
    </Screen>
  );
}
const styles = StyleSheet.create({
  label: { marginTop: 12, marginBottom: 6, color: colors.muted },
  state: { color: colors.muted, padding: 16 },
  error: { color: colors.danger, marginTop: 10 },
});
