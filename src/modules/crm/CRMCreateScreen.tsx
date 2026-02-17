import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
type Nav = NativeStackNavigationProp<CRMStackParamList, "CRMCreate">;
export function CRMCreateScreen() {
  const companyId = useCompanyId();
  const userId = useUserId();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ company_id: companyId, name, email })
        .select()
        .single();
      if (error) throw error;
      await logTimeline({
        companyId: companyId as string,
        userId,
        entityType: "client",
        entityId: data.id,
        action: "client_created",
      });
      await logAudit({
        companyId: companyId as string,
        userId,
        action: "create",
        entity: "client",
        entityId: data.id,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", companyId] });
      navigation.goBack();
    },
  });
  return (
    <Screen>
      <ERPHeader title="New Client" subtitle="CRM" />
      <Text style={styles.label}>Name</Text>
      <Input value={name} onChangeText={setName} placeholder="Client name" />
      <Text style={styles.label}>Email</Text>
      <Input value={email} onChangeText={setEmail} placeholder="client@email.com" keyboardType="email-address" />
      <Button label={mutation.isLoading ? "Saving..." : "Create"} onPress={() => mutation.mutate()} />
      {mutation.isError && <Text style={styles.error}>Error creating client</Text>}
    </Screen>
  );
}
const styles = StyleSheet.create({
  label: { marginTop: 12, marginBottom: 6, color: colors.muted },
  error: { color: colors.danger, marginTop: 10 },
});
