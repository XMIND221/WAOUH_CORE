import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { ERPHeader } from "../../core/components/ERPHeader";
import { Card } from "../../core/components/Card";
import { Screen } from "../../core/layout/Screen";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { useCompanyId } from "../../hooks/useCompany";
import { BillingStackParamList } from "./BillingNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
type Nav = NativeStackNavigationProp<BillingStackParamList, "InvoiceList">;
async function fetchInvoices(companyId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export function InvoiceListScreen() {
  const companyId = useCompanyId();
  const navigation = useNavigation<Nav>();
  const query = useQuery({
    queryKey: ["invoices", companyId],
    queryFn: () => fetchInvoices(companyId as string),
    enabled: !!companyId,
  });
  const list = useMemo(() => query.data ?? [], [query.data]);
  return (
    <Screen>
      <ERPHeader
        title="Billing"
        subtitle="Invoices"
        right={
          <Pressable onPress={() => navigation.navigate("InvoiceCreate")}>
            <Text style={styles.link}>New</Text>
          </Pressable>
        }
      />
      <View style={styles.content}>
        {query.isLoading && <Text style={styles.state}>Loading...</Text>}
        {query.isError && <Text style={styles.state}>Error loading invoices</Text>}
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: item.id })}>
              <Card style={styles.card}>
                <Text style={styles.title}>{item.number}</Text>
                <Text style={styles.muted}>Status: {item.status}</Text>
                <Text style={styles.total}>Total: {item.total}</Text>
              </Card>
            </Pressable>
          )}
          ListEmptyComponent={!query.isLoading ? <Text style={styles.state}>No invoices</Text> : null}
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
  total: { color: colors.text, fontWeight: "600" },
  state: { color: colors.muted },
  link: { color: colors.primary, fontWeight: "700" },
});
