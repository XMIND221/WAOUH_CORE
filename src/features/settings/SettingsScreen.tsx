import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { PinSettingsScreen } from "../security/PinSettingsScreen";
export function SettingsScreen() {
  const { userProfile, logout } = useAuthStore();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPinSettings, setShowPinSettings] = useState(false);
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      Alert.alert("Erreur", error.message);
    } else {
      Alert.alert("Succès", "Mot de passe changé avec succès");
      setNewPassword("");
      setConfirmPassword("");
    }
  };
  if (showPinSettings) {
    return (
      <View style={styles.container}>
        <Pressable onPress={() => setShowPinSettings(false)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </Pressable>
        <PinSettingsScreen />
      </View>
    );
  }
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚙️ Paramètres</Text>
      {/* Profil */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Profil</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{userProfile?.email}</Text>
          <Text style={styles.label}>Nom complet</Text>
          <Text style={styles.value}>{userProfile?.full_name || "Non renseigné"}</Text>
          <Text style={styles.label}>Rôle</Text>
          <Text style={styles.value}>{userProfile?.role || "user"}</Text>
        </View>
      </View>
      {/* Sécurité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Sécurité</Text>
        <View style={styles.card}>
          <Pressable onPress={() => setShowPinSettings(true)} style={styles.settingButton}>
            <Text style={styles.settingButtonText}>🔐 Gérer le PIN</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Text style={styles.label}>Changer le mot de passe</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={styles.input}
            placeholder="Nouveau mot de passe"
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            placeholder="Confirmer le mot de passe"
          />
          <Pressable onPress={handleChangePassword} style={styles.buttonPrimary}>
            <Text style={styles.buttonText}>Changer le mot de passe</Text>
          </Pressable>
        </View>
      </View>
      {/* Déconnexion */}
      <View style={styles.section}>
        <Pressable onPress={logout} style={styles.buttonDanger}>
          <Text style={styles.buttonText}>🚪 Déconnexion</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  backButton: { marginBottom: 16 },
  backButtonText: { fontSize: 16, color: "#3b82f6" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#374151" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
  label: { fontSize: 14, fontWeight: "600", color: "#6b7280", marginBottom: 4, marginTop: 12 },
  value: { fontSize: 16, color: "#1f2937" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  settingButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  settingButtonText: { fontSize: 16, color: "#374151" },
  arrow: { fontSize: 24, color: "#9ca3af" },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 12 },
  buttonPrimary: { backgroundColor: "#3b82f6", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  buttonDanger: { backgroundColor: "#ef4444", padding: 16, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});