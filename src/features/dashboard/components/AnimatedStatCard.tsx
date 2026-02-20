import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { colors } from "../../../core/theme/colors";
import { typography } from "../../../core/theme/typography";
interface Props {
  label: string;
  value: string | number;
  accent?: string;
  delay?: number;
  icon?: string;
}
export function AnimatedStatCard({ label, value, accent = colors.primary, delay = 0, icon }: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay }}
      style={[styles.card, { borderLeftColor: accent }]}
    >
      <View style={styles.content}>
        <Text style={[typography.small, styles.label]}>{label}</Text>
        <Text style={[typography.section, { color: accent, fontSize: 28, fontWeight: "700" }]}>
          {value}
        </Text>
      </View>
    </MotiView>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    minHeight: 90,
  },
  content: {
    gap: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
