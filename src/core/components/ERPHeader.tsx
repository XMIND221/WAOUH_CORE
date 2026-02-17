import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};
export function ERPHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={[typography.h1, styles.title]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: colors.text },
  subtitle: { color: colors.muted, marginTop: 4 },
});
