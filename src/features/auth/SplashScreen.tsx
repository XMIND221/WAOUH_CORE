import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../core/theme/colors";
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WAOUH CORE</Text>
      <Text style={styles.subtitle}>Chargement...</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.surface },
  title: { fontSize: 28, fontWeight: "700", color: colors.primary },
  subtitle: { marginTop: 6, color: colors.muted },
});
