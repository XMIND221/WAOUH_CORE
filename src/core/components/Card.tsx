import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme/colors";
import { shadows } from "../theme/shadows";
type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};
export function Card({ children, style }: Props) {
  return <View style={[styles.card, shadows.md, style]}>{children}</View>;
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
});
