import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../theme/colors";
interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}
export function PrimaryButton({ label, onPress, disabled = false, loading = false }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.6,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
