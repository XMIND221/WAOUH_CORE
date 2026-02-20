import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { ErpLayout } from "../../../core/layout/ErpLayout";
import { colors } from "../../../core/theme/colors";
import { useClients, ClientInput } from "../hooks/useClients";
import { PrimaryButton } from "../../../core/components/PrimaryButton";
interface Props {
  route: {
    params: {
      clientId: string;
    };
  };
  navigation: any;
}
export function ClientDetailsScreen({ route, navigation }: Props) {
  const { clientId } = route.params;
  const { getClient, updateClient, deleteClient, isDeleting } = useClients();
  const client = getClient(clientId);
  if (!client) {
    return (
      <ErpLayout title="Client">
        <ActivityIndicator size="large" color={colors.primary} />
      </ErpLayout>
    );
  }
  const handleDelete = async () => {
    Alert.alert(
      "Confirmation",
      "Supprimer ce client ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClient(clientId);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  };
  return (
    <ErpLayout title={client.name}>
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{client.email || "N/A"}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Téléphone</Text>
          <Text style={styles.value}>{client.phone || "N/A"}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Statut</Text>
          <Text style={styles.value}>{client.status}</Text>
        </View>
        <View style={styles.actions}>
          <PrimaryButton
            label={isDeleting ? "Suppression..." : "Supprimer"}
            onPress={handleDelete}
            disabled={isDeleting}
          />
        </View>
      </View>
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  actions: {
    marginTop: 30,
  },
});
