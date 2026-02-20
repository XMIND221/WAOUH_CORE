import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { ErpLayout } from "../../../../core/layout/ErpLayout";
import { colors } from "../../../../core/theme/colors";
import { useDeals } from "../../hooks/useDeals";
import { DealCard } from "../../components/DealCard";
import { DealStage, Deal } from "../../types";
const stages: { key: DealStage; label: string; color: string }[] = [
  { key: "nouveau", label: "Nouveau", color: colors.muted },
  { key: "qualification", label: "Qualification", color: colors.info },
  { key: "proposition", label: "Proposition", color: colors.warning },
  { key: "negociation", label: "Négociation", color: colors.primary },
  { key: "gagne", label: "Gagné", color: colors.success },
  { key: "perdu", label: "Perdu", color: colors.danger },
];
export function PipelineScreen() {
  const { deals, isLoading } = useDeals();
  if (isLoading) {
    return (
      <ErpLayout title="Pipeline Commercial">
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </ErpLayout>
    );
  }
  return (
    <ErpLayout title="Pipeline Commercial">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.pipeline}>
          {stages.map((stage) => {
            const stageDeals = deals.filter((d: Deal) => d.stage === stage.key);
            const total = stageDeals.reduce((sum: number, d: Deal) => sum + Number(d.amount), 0);
            return (
              <View key={stage.key} style={styles.column}>
                <View style={[styles.header, { backgroundColor: stage.color }]}>
                  <Text style={styles.headerTitle}>{stage.label}</Text>
                  <Text style={styles.headerCount}>{stageDeals.length}</Text>
                </View>
                <ScrollView style={styles.deals}>
                  {stageDeals.map((deal: Deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  loader: {
    marginTop: 100,
  },
  pipeline: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  column: {
    width: 280,
    backgroundColor: colors.bg,
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headerCount: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  deals: {
    padding: 12,
    maxHeight: 600,
  },
});
