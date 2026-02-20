import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Input } from "../../../core/components/Input";
import { Section } from "../../../core/components/Section";
import { PrimaryButton } from "../../../core/components/PrimaryButton";
import { ErpLayout } from "../../../core/layout/ErpLayout";
import { colors } from "../../../core/theme/colors";
import { CRMStackParamList } from "../CRMNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Client, ClientStatus } from "../types";
import { useClients } from "../hooks/useClients";
import { ClientCard } from "../components/ClientCard";
type Nav = NativeStackNavigationProp<CRMStackParamList, "CRMList">;
const statusOptions: Array<ClientStatus | "all"> = ["all", "prospect", "lead", "client", "actif", "inactif"];
export function CRMListScreen() {
  const navigation = useNavigation<Nav>();
  const [status, setStatus] = useState<ClientStatus | "all">("all");
  const [search, setSearch] = useState("");
  const { clients, isLoading, isError } = useClients({ status, search });
  return (
    <ErpLayout title="CRM">
      <Section
        title="Clients"
        right={
          <PrimaryButton label="New client" onPress={() => navigation.navigate("CreateClient")} />
        }
      >
        <View style={styles.filters}>
          <Input value={search} onChangeText={setSearch} placeholder="Search by name" />
          <View style={styles.statusRow}>
            {statusOptions.map((s) => {
              const active = status === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStatus(s)}
                  style={({ pressed }) => [
                    styles.statusChip,
                    active ? styles.statusActive : null,
                    pressed ? styles.statusHover : null,
                  ]}
                >
                  <Text style={[styles.statusText, active ? styles.statusTextActive : null]}>
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Erreur de chargement</Text>
          </View>
        )}
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        {!isLoading && !isError && clients.length === 0 && (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Aucun client</Text>
          </View>
        )}
        {!isLoading && !isError && clients.map((client: Client, index: number) => (
          <ClientCard
            key={client.id}
            client={client}
            index={index}
            onPress={() => navigation.navigate("ClientDetails", { clientId: client.id })}
          />
        ))}
      </Section>
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  filters: { gap: 12, marginBottom: 16 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusHover: { opacity: 0.7 },
  statusText: { fontSize: 13, color: colors.text },
  statusTextActive: { color: "#fff", fontWeight: "600" },
  errorBox: { padding: 16, backgroundColor: "#fee2e2", borderRadius: 8 },
  errorText: { color: "#dc2626" },
  centerContainer: { padding: 40, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 16 },
});