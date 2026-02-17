import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
type Props = { children: React.ReactNode };
export function Screen({ children }: Props) {
  return <View style={styles.container}>{children}</View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
