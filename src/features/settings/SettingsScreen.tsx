import React from "react";
import { ScrollView, StyleSheet, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ERPHeader } from "../../core/components/ERPHeader";
import { Card } from "../../core/components/Card";
import { Button } from "../../core/components/Button";
import { Screen } from "../../core/layout/Screen";
import { useAuthStore } from "../../store/authStore";
import { colors } from "../../core/theme/colors";
import { RootStackParamList } from "../../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
type Nav = NativeStackNavigationProp<RootStackParamList, "MainTabs">;
export function SettingsScreen() {
  const { signOut } = useAuthStore();
  const navigation = useNavigation<Nav>();
  return (
    <Screen>
      <ERPHeader title="Settings" subtitle="Preferences" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Pressable onPress={() => navigation.navigate("Timeline")}>
            <Text style={styles.link}>Timeline</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Audit")}>
            <Text style={styles.link}>Audit Logs</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Security")}>
            <Text style={styles.link}>Security Logs</Text>
          </Pressable>
        </Card>
        <Card>
          <Button label="Logout" onPress={signOut} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  link: { color: colors.primary, fontWeight: "700", marginBottom: 8 },
});
