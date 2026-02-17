import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ERPHeader } from "../../core/components/ERPHeader";
import { Card } from "../../core/components/Card";
import { Screen } from "../../core/layout/Screen";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { logAudit, logTimeline } from "../../services/logging";
import { useCompanyId, useUserId } from "../../hooks/useCompany";
import { BillingStackParamList } from "./BillingNavigator";
type Route = RouteProp<BillingStackParamList, "InvoiceDetail">;
async function fetchInvoice(companyId: string, invoiceId: string) {
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("company_id", companyId)
    .eq("invoice_id", invoiceId);
  return { invoice, items: items ?? [] };
}
export function InvoiceDetailScreen() {
  const companyId = useCompanyId();
  const userId = useUserId();
  const route = useRoute<Route>();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["invoice", companyId, route.params.invoiceId],
    queryFn: () => fetchInvoice(companyId as string, route.params.invoiceId),
    enabled: !!companyId,
  });
  const updateStatus = useMutation({
    mutationFn: async (status: "sent" | "paid") => {
      const { error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("company_id", companyId)
        .eq("id", route.params.invoiceId);
      if (error) throw error;
      await logTimeline({
        companyId: companyId as string,
        userId,
        entityType: "invoice",
        entityId: route.params.invoiceId,
        action: "invoice_status_changed",
        metadata: { status },
      });
      await logAudit({
        companyId: companyId as string,
        userId,
        action: "update",
        entity: "invoice",
        entityId: route.params.invoiceId,
        metadata: { status },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", companyId] });
      qc.invalidateQueries({ queryKey: ["invoice", companyId, route.params.invoiceId] });
    },
  });
  return (
    <Screen>
      <ERPHeader title="Invoice Detail" subtitle="Billing" />
      {query.isLoading && <Text style={styles.state}>Loading...</Text>}
      {query.isError && <Text style={styles.state}>Error loading invoice</Text>}
      {query.data && (
        <Card>
          <Text style={styles.title}>{query.data.invoice.number}</Text>
          <Text style={styles.muted}>Status: {query.data.invoice.status}</Text>
          <Text style={styles.total}>Total: {query.data.invoice.total}</Text>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {query.data.items.map((i) => (
              <Text key={i.id} style={styles.muted}>
                {i.description} - {i.quantity} x {i.unit_price}
              </Text>
            ))}
          </View>
          <View style={styles.row}>
            <Pressable onPress={() => updateStatus.mutate("sent")}>
              <Text style={styles.link}>Mark sent</Text>
            </Pressable>
            <Pressable onPress={() => updateStatus.mutate("paid")}>
              <Text style={styles.link}>Mark paid</Text>
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
  total: { color: colors.text, fontWeight: "700", marginTop: 6 },
  section: { marginTop: 12 },
  sectionTitle: { color: colors.text, fontWeight: "700", marginBottom: 6 },
  row: { flexDirection: "row", gap: 16, marginTop: 12 },
  link: { color: colors.primary, fontWeight: "700" },
  state: { color: colors.muted, padding: 16 },
});
