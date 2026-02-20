import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Deal } from "../types";
import { colors } from "../../../core/theme/colors";
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}
interface Props {
  deal: Deal;
}
export function DealCard({ deal }: Props) {
  const clientName = deal.client?.name || "Client inconnu";
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{deal.title}</Text>
      <Text style={styles.client}>{clientName}</Text>
      <Text style={styles.amount}>{formatCurrency(Number(deal.amount))}</Text>
      <Text style={styles.probability}>{deal.probability}% de chance</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  client: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 6,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
    marginBottom: 4,
  },
  probability: {
    fontSize: 12,
    color: colors.info,
  },
});
