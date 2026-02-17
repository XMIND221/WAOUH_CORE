import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { ERPHeader } from "../../core/components/ERPHeader";
import { Card } from "../../core/components/Card";
import { Screen } from "../../core/layout/Screen";
import { typography } from "../../core/theme/typography";
export function AuditScreen() {
  return (
    <Screen>
      <ERPHeader title="Audit" subtitle="Logs et securite" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={typography.h3}>Dernieres actions</Text>
          <Text>System ready</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({ content: { padding: 16, gap: 12 } });
