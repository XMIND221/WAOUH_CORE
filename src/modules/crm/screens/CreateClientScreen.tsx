import React from "react";
import { StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ErpLayout } from "../../../core/layout/ErpLayout";
import { ClientForm } from "../components/ClientForm";
import { ClientInput, useClients } from "../hooks/useClients";
import { CRMStackParamList } from "../CRMNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
type Nav = NativeStackNavigationProp<CRMStackParamList, "CreateClient">;
export function CreateClientScreen() {
  const navigation = useNavigation<Nav>();
  const { createClient, isCreating } = useClients();
  const handleCreateClient = async (input: ClientInput) => {
    try {
      await createClient(input);
      Alert.alert("Succes", `Client "${input.name}" cree avec succes`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur inattendue");
    }
  };
  return (
    <ErpLayout title="New Client">
      <ScrollView style={styles.container}>
        <ClientForm
          submitLabel="Create client"
          isSubmitting={isCreating}
          onSubmit={handleCreateClient}
        />
      </ScrollView>
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});