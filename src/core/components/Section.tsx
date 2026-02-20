import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { typography } from "../theme/typography";
import { colors } from "../theme/colors";
type Props = {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
};
export function Section({ title, right, children }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.section, styles.title]}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.text },
});
