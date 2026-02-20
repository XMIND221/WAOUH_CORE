import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
type Props = {
  label: string;
  value: string | number;
  accent?: string;
};
export function StatCard({ label, value, accent = colors.primary }: Props) {
  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <Text style={[typography.small, styles.label]}>{label}</Text>
      <Text style={[typography.section, { color: accent }]}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  label: { color: colors.muted, marginBottom: 6 },
});
