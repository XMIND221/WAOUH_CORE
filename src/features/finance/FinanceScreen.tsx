import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { ERPHeader } from "../../core/components/ERPHeader";
import { Card } from "../../core/components/Card";
import { Screen } from "../../core/layout/Screen";
import { typography } from "../../core/theme/typography";
import { formatCurrency } from "../../core/utils/format";
export function FinanceScreen() {
  return (
    <Screen>
      <ERPHeader title="Finance" subtitle="Facturation et revenus" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={typography.h3}>Chiffre d'affaires</Text>
          <Text>{formatCurrency(450000)}</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({ content: { padding: 16, gap: 12 } });
