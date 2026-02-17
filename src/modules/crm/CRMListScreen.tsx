import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { ERPHeader } from "../../core/components/ERPHeader";
import { Card } from "../../core/components/Card";
import { Input } from "../../core/components/Input";
import { Screen } from "../../core/layout/Screen";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { useCompanyId } from "../../hooks/useCompany";
import { CRMStackParamList } from "./CRMNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
type Nav = NativeStackNavigationProp<CRMStackParamList, "CRMList">;
async function fetchClients(companyId: string, term: string) {
  let query = supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (term) {
    query = query.ilike("name", `%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
export function CRMListScreen() {
  const companyId = useCompanyId();
  const navigation = useNavigation<Nav>();
  const [term, setTerm] = useState("");
  const query = useQuery({
    queryKey: ["clients", companyId, term],
    queryFn: () => fetchClients(companyId as string, term),
    enabled: !!companyId,
  });
  const list = useMemo(() => query.data ?? [], [query.data]);
  return (
    <Screen>
      <ERPHeader
        title="CRM"
        subtitle="Clients"
        right={
          <Pressable onPress={() => navigation.navigate("CRMCreate")}>
            <Text style={styles.link}>New</Text>
          </Pressable>
        }
      />
      <View style={styles.content}>
        <Input value={term} onChangeText={setTerm} placeholder="Search client" />
        {query.isLoading && <Text style={styles.state}>Loading...</Text>}
        {query.isError && <Text style={styles.state}>Error loading clients</Text>}
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate("CRMDetail", { clientId: item.id })}>
              <Card style={styles.card}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.muted}>{item.email ?? "no email"}</Text>
              </Card>
            </Pressable>
          )}
          ListEmptyComponent={!query.isLoading ? <Text style={styles.state}>No clients</Text> : null}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, flex: 1 },
  card: { marginBottom: 10 },
  title: { color: colors.text, fontWeight: "700" },
  muted: { color: colors.muted },
  state: { color: colors.muted },
  link: { color: colors.primary, fontWeight: "700" },
});
