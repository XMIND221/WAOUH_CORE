import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme/colors";
type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  style?: ViewStyle;
};
export function Button({ label, onPress, variant = "primary", style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        variant === "primary" ? styles.primary : styles.outline,
        style,
      ]}
    >
      <Text style={variant === "primary" ? styles.primaryText : styles.outlineText}>
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "transparent",
  },
  primaryText: {
    color: "#FFF",
    fontWeight: "700",
  },
  outlineText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
