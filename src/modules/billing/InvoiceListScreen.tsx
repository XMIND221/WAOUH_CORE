import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View, Modal, Pressable } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "../../core/components/Input";
import { DataTable } from "../../core/components/DataTable";
import { Section } from "../../core/components/Section";
import { PrimaryButton } from "../../core/components/PrimaryButton";
import { ErpLayout } from "../../core/layout/ErpLayout";
import { colors } from "../../core/theme/colors";
import { supabase } from "../../services/supabase";
import { useCompanyId, useUserId } from "../../hooks/useCompany";
import { logAudit, logTimeline } from "../../services/logging";
import { formatCurrency } from "../../core/utils/format";
type InvoiceRow = {
  id: string;
  number: string;
  total: number;
  status: string;
  created_at: string;
  client: { name: string } | null;
};
type ClientRow = { id: string; name: string };
async function fetchInvoices(companyId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("id,number,total,status,created_at,client:clients(name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as InvoiceRow[]) ?? [];
}
async function fetchClients(companyId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("id,name")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ClientRow[];
}
function statusColor(status: string) {
  if (status === "paid") return colors.success;
  if (status === "overdue") return colors.danger;
  if (status === "sent") return colors.info;
  return colors.warning;
}
export function InvoiceListScreen() {
  const companyId = useCompanyId();
  const userId = useUserId();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [total, setTotal] = useState("0");
  const [status, setStatus] = useState("draft");
  const invoicesQuery = useQuery({
    queryKey: ["invoices", companyId],
    queryFn: () => fetchInvoices(companyId as string),
    enabled: !!companyId,
  });
  const clientsQuery = useQuery({
    queryKey: ["clients", companyId, "invoice"],
    queryFn: () => fetchClients(companyId as string),
    enabled: !!companyId && modalOpen,
  });
  const list = useMemo(() => invoicesQuery.data ?? [], [invoicesQuery.data]);
  const createInvoice = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          company_id: companyId,
          client_id: clientId,
          number,
          total: Number(total || 0),
          status,
        })
        .select()
        .single();
      if (error) throw error;
      await logTimeline({
        companyId: companyId as string,
        userId,
        entityType: "invoice",
        entityId: data.id,
        action: "invoice_created",
      });
      await logAudit({
        companyId: companyId as string,
        userId,
        entity: "invoice",
        action: "create"
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", companyId] });
      setModalOpen(false);
      setNumber("");
      setClientId("");
      setTotal("0");
      setStatus("draft");
    },
  });
  return (
    <ErpLayout title="Invoices">
      <Section title="Invoices" right={<PrimaryButton label="Create invoice" onPress={() => setModalOpen(true)} />}>
        {invoicesQuery.isPending && <Text style={styles.state}>Loading...</Text>}
        {invoicesQuery.isError && <Text style={styles.state}>Error loading invoices</Text>}
        <DataTable<InvoiceRow>
          columns={[
            { key: "number", label: "Number" },
            { key: "client", label: "Client", render: (row) => <Text>{row.client?.name ?? "Unknown"}</Text> },
            { key: "total", label: "Amount", align: "right", render: (row) => <Text>{formatCurrency(Number(row.total ?? 0))}</Text> },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <Text style={[styles.statusBadge, { backgroundColor: statusColor(row.status) }]}>
                  {row.status}
                </Text>
              ),
            },
          ]}
          data={list}
          emptyText="No invoices"
        />
      </Section>
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create invoice</Text>
            <Input value={number} onChangeText={setNumber} placeholder="Invoice number" />
            <Input value={total} onChangeText={setTotal} placeholder="Total" keyboardType="numeric" />
            <Input value={status} onChangeText={setStatus} placeholder="Status (draft/sent/paid/overdue)" />
            <Text style={styles.label}>Client</Text>
            <View style={styles.clientList}>
              {clientsQuery.data?.map((c) => (
                <Pressable key={c.id} onPress={() => setClientId(c.id)}>
                  <Text style={[styles.clientItem, clientId === c.id ? styles.clientItemActive : null]}>{c.name}</Text>
                </Pressable>
              ))}
              {!clientsQuery.isPending && (clientsQuery.data?.length ?? 0) === 0 && (
                <Text style={styles.state}>No clients</Text>
              )}
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)}>
                <Text style={styles.link}>Cancel</Text>
              </Pressable>
              <PrimaryButton label={createInvoice.isPending ? "Saving..." : "Create"} onPress={() => createInvoice.mutate()} />
            </View>
            {createInvoice.isError && <Text style={styles.state}>Error creating invoice</Text>}
          </View>
        </View>
      </Modal>
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  state: { color: colors.muted },
  statusBadge: {
    color: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    textTransform: "capitalize",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  modal: { width: 440, maxWidth: "90%", backgroundColor: colors.surface, padding: 16, borderRadius: 16, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  modalActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: colors.primary, fontWeight: "700" },
  label: { color: colors.muted },
  clientList: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 8, gap: 6 },
  clientItem: { color: colors.text },
  clientItemActive: { color: colors.primary, fontWeight: "700" },
});




