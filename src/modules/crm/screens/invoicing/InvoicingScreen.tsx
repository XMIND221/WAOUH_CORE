import React from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { ErpLayout } from "../../../../core/layout/ErpLayout";
import { colors } from "../../../../core/theme/colors";
import { useInvoicing } from "../../hooks/useInvoicing";
import { Invoice, InvoiceStatus } from "../../types";
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}
const statusColors: Record<InvoiceStatus, string> = {
  brouillon: colors.muted,
  envoyee: colors.info,
  payee: colors.success,
  annulee: colors.danger,
};
export function InvoicingScreen() {
  const { invoices, isLoading, updateStatus } = useInvoicing();
  const handleChangeStatus = (invoiceId: string, currentStatus: InvoiceStatus) => {
    const statuses: InvoiceStatus[] = ["brouillon", "envoyee", "payee", "annulee"];
    const options = statuses
      .filter((s) => s !== currentStatus)
      .map((status) => ({
        text: status.charAt(0).toUpperCase() + status.slice(1),
        onPress: () => updateStatus({ id: invoiceId, status }),
      }));
    Alert.alert("Changer le statut", "", [{ text: "Annuler", style: "cancel" }, ...options]);
  };
  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleChangeStatus(item.id, item.status)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.number}>{item.number}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[item.status] }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.client}>{item.client?.name || "Client inconnu"}</Text>
      <Text style={styles.amount}>{formatCurrency(Number(item.amount))}</Text>
      {item.due_date && (
        <Text style={styles.date}>Échéance: {new Date(item.due_date).toLocaleDateString()}</Text>
      )}
    </TouchableOpacity>
  );
  if (isLoading) {
    return (
      <ErpLayout title="Facturation">
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </ErpLayout>
    );
  }
  return (
    <ErpLayout title="Facturation">
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoice}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune facture</Text>
          </View>
        }
      />
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  loader: {
    marginTop: 100,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  number: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  client: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 8,
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.success,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
  },
});
