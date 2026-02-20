import React, { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, TextInput, Alert } from "react-native";
import { useInvoices, Invoice } from "./useInvoices";
import { ProtectedRoute } from "../../components/ProtectedRoute";
const statusColors: Record<Invoice["status"], string> = {
  draft: "#6b7280",
  sent: "#3b82f6",
  paid: "#10b981",
  overdue: "#ef4444",
};
const statusLabels: Record<Invoice["status"], string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  overdue: "En retard",
};
export function InvoicesScreen() {
  const { invoices, isLoading, createInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    invoice_number: "",
    amount: "",
    due_date: "",
    status: "draft" as Invoice["status"],
  });
  const resetForm = () => {
    setShowForm(false);
    setEditingInvoice(null);
    setFormData({
      client_id: "",
      invoice_number: "",
      amount: "",
      due_date: "",
      status: "draft",
    });
  };
  const validateForm = () => {
    if (!formData.invoice_number.trim()) return "Numéro de facture requis.";
    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) return "Montant invalide.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.due_date)) return "Date invalide (YYYY-MM-DD).";
    return null;
  };
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert("Validation", validationError);
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, payload);
        Alert.alert("Succès", "Facture mise à jour");
      } else {
        await createInvoice(payload);
        Alert.alert("Succès", "Facture créée");
      }
      resetForm();
    } catch (error: any) {
      Alert.alert("Erreur", error?.message ?? "Opération impossible");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      client_id: invoice.client_id,
      invoice_number: invoice.invoice_number,
      amount: invoice.amount.toString(),
      due_date: invoice.due_date,
      status: invoice.status,
    });
    setShowForm(true);
  };
  const handleDelete = (id: string) => {
    Alert.alert("Supprimer la facture", "Êtes-vous sûr ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteInvoice(id);
          } catch (error: any) {
            Alert.alert("Erreur", error?.message ?? "Suppression impossible");
          }
        },
      },
    ]);
  };
  return (
    <ProtectedRoute permission="manage_invoices">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Facturation</Text>
          <Pressable onPress={() => setShowForm(!showForm)} style={styles.buttonAdd}>
            <Text style={styles.buttonText}>{showForm ? "Annuler" : "+ Nouvelle facture"}</Text>
          </Pressable>
        </View>
        {showForm && (
          <View style={styles.form}>
            <TextInput
              value={formData.invoice_number}
              onChangeText={(text) => setFormData({ ...formData, invoice_number: text })}
              style={styles.input}
              placeholder="Numéro de facture"
            />
            <TextInput
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              style={styles.input}
              placeholder="Montant"
              keyboardType="numeric"
            />
            <TextInput
              value={formData.due_date}
              onChangeText={(text) => setFormData({ ...formData, due_date: text })}
              style={styles.input}
              placeholder="Date d'échéance (YYYY-MM-DD)"
            />
            <Pressable onPress={handleSubmit} disabled={isSubmitting} style={[styles.buttonSubmit, isSubmitting && styles.buttonDisabled]}>
              <Text style={styles.buttonText}>{isSubmitting ? "Envoi..." : editingInvoice ? "Mettre à jour" : "Créer"}</Text>
            </Pressable>
          </View>
        )}
        {isLoading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
        ) : (
          <FlatList
            data={invoices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.invoiceCard}>
                <View style={styles.invoiceHeader}>
                  <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
                    <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
                  </View>
                </View>
                <Text style={styles.clientName}>{item.client_name}</Text>
                <Text style={styles.amount}>{item.amount.toFixed(2)} €</Text>
                <Text style={styles.dueDate}>Échéance : {new Date(item.due_date).toLocaleDateString("fr-FR")}</Text>
                <View style={styles.actions}>
                  <Pressable onPress={() => handleEdit(item)} style={styles.buttonEdit}>
                    <Text style={styles.buttonText}>Modifier</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.id)} style={styles.buttonDelete}>
                    <Text style={styles.buttonText}>Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucune facture</Text>}
          />
        )}
      </View>
    </ProtectedRoute>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  buttonAdd: { backgroundColor: "#3b82f6", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  form: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  buttonSubmit: { backgroundColor: "#10b981", padding: 12, borderRadius: 8, alignItems: "center" },
  buttonDisabled: { opacity: 0.65 },
  loader: { flex: 1, justifyContent: "center" },
  invoiceCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12 },
  invoiceHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  invoiceNumber: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  clientName: { fontSize: 14, color: "#6b7280", marginBottom: 4 },
  amount: { fontSize: 20, fontWeight: "bold", color: "#10b981", marginBottom: 4 },
  dueDate: { fontSize: 12, color: "#9ca3af", marginBottom: 12 },
  actions: { flexDirection: "row", gap: 8 },
  buttonEdit: { backgroundColor: "#3b82f6", flex: 1, padding: 8, borderRadius: 6, alignItems: "center" },
  buttonDelete: { backgroundColor: "#ef4444", flex: 1, padding: 8, borderRadius: 6, alignItems: "center" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
});