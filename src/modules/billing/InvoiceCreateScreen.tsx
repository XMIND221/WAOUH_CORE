import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ERPHeader } from "../../core/components/ERPHeader";
import { Button } from "../../core/components/Button";
import { Input } from "../../core/components/Input";
import { Screen } from "../../core/layout/Screen";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { logAudit, logTimeline } from "../../services/logging";
import { useCompanyId, useUserId } from "../../hooks/useCompany";
import { BillingStackParamList } from "./BillingNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
type Nav = NativeStackNavigationProp<BillingStackParamList, "InvoiceCreate">;
type Item = { description: string; quantity: string; unitPrice: string };
async function fetchClients(companyId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("id,name")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
export function InvoiceCreateScreen() {
  const companyId = useCompanyId();
  const userId = useUserId();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const [number, setNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: "1", unitPrice: "0" }]);
  const clientsQuery = useQuery({
    queryKey: ["clients", companyId, "forInvoice"],
    queryFn: () => fetchClients(companyId as string),
    enabled: !!companyId,
  });
  const total = useMemo(() => {
    return items.reduce((sum, i) => {
      const q = Number(i.quantity || 0);
      const p = Number(i.unitPrice || 0);
      return sum + q * p;
    }, 0);
  }, [items]);
  const mutation = useMutation({
    mutationFn: async () => {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert({
          company_id: companyId,
          client_id: clientId,
          number,
          total,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      const payload = items.map((i) => ({
        company_id: companyId,
        invoice_id: invoice.id,
        description: i.description,
        quantity: Number(i.quantity || 0),
        unit_price: Number(i.unitPrice || 0),
        total: Number(i.quantity || 0) * Number(i.unitPrice || 0),
      }));
      const { error: itemsError } = await supabase.from("invoice_items").insert(payload);
      if (itemsError) throw itemsError;
      await logTimeline({
        companyId: companyId as string,
        userId,
        entityType: "invoice",
        entityId: invoice.id,
        action: "invoice_created",
      });
      await logAudit({
        companyId: companyId as string,
        userId,
        action: "create",
        entity: "invoice",
        entityId: invoice.id,
      });
      return invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", companyId] });
      navigation.goBack();
    },
  });
  const updateItem = (idx: number, key: keyof Item, value: string) => {
    setItems((prev) => prev.map((i, index) => (index === idx ? { ...i, [key]: value } : i)));
  };
  return (
    <Screen>
      <ERPHeader title="New Invoice" subtitle="Billing" />
      <Text style={styles.label}>Invoice number</Text>
      <Input value={number} onChangeText={setNumber} placeholder="INV-2026-001" />
      <Text style={styles.label}>Client ID</Text>
      <Input value={clientId} onChangeText={setClientId} placeholder="Select client id" />
      {clientsQuery.data && clientsQuery.data.length > 0 && (
        <View style={styles.clientList}>
          {clientsQuery.data.map((c) => (
            <Pressable key={c.id} onPress={() => setClientId(c.id)}>
              <Text style={styles.clientItem}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={styles.label}>Items</Text>
      {items.map((item, idx) => (
        <View key={idx} style={styles.itemRow}>
          <Input value={item.description} onChangeText={(v) => updateItem(idx, "description", v)} placeholder="Description" />
          <Input value={item.quantity} onChangeText={(v) => updateItem(idx, "quantity", v)} keyboardType="numeric" />
          <Input value={item.unitPrice} onChangeText={(v) => updateItem(idx, "unitPrice", v)} keyboardType="numeric" />
        </View>
      ))}
      <Pressable onPress={() => setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "0" }])}>
        <Text style={styles.link}>Add item</Text>
      </Pressable>
      <Text style={styles.total}>Total: {total}</Text>
      <Button label={mutation.isPending ? "Saving..." : "Create"} onPress={() => mutation.mutate()} />
      {mutation.isError && <Text style={styles.error}>Error creating invoice</Text>}
    </Screen>
  );
}
const styles = StyleSheet.create({
  label: { marginTop: 12, marginBottom: 6, color: colors.muted },
  itemRow: { gap: 8, marginBottom: 10 },
  link: { color: colors.primary, fontWeight: "700", marginTop: 8 },
  total: { marginTop: 10, color: colors.text, fontWeight: "700" },
  error: { color: colors.danger, marginTop: 10 },
  clientList: { backgroundColor: colors.surface, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  clientItem: { color: colors.text, paddingVertical: 4 },
});

