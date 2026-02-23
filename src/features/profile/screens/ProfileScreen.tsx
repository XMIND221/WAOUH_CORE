import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useProfile } from "../hooks/useProfile";
function formatDate(input: string | null): string {
  if (!input) return "N/A";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString();
}
export function ProfileScreen() {
  const { profile, securityActivity, loading, saving, pinSaving, error, updateProfile, changePin, refresh } = useProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  useEffect(() => {
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setAvatarUrl(profile?.avatarUrl ?? "");
  }, [profile?.firstName, profile?.lastName, profile?.avatarUrl]);
  const canSave = useMemo(() => {
    return firstName.trim().length > 0 && lastName.trim().length > 0 && !saving;
  }, [firstName, lastName, saving]);
  const handleSave = async () => {
    await updateProfile({
      firstName,
      lastName,
      avatarUrl: avatarUrl.trim() || null,
    });
  };
  const handlePinChange = async () => {
    setPinMessage(null);
    const res = await changePin(currentPin, newPin, confirmPin);
    setPinMessage(res.message);
    if (res.ok) {
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    }
  };
  if (loading && !profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" />
      </View>
    );
  }
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.card}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.line}><Text style={styles.bold}>Nom complet:</Text> {profile?.fullName ?? "N/A"}</Text>
        <Text style={styles.line}><Text style={styles.bold}>Rôle:</Text> {profile?.role ?? "user"}</Text>
        <Text style={styles.line}><Text style={styles.bold}>Entreprise:</Text> {profile?.companyName ?? "N/A"}</Text>
        <Text style={styles.line}><Text style={styles.bold}>Statut:</Text> {profile?.accountStatus ?? "active"}</Text>
        <Text style={styles.line}><Text style={styles.bold}>Dernière connexion:</Text> {formatDate(profile?.lastLoginAt ?? null)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Modifier le profil</Text>
        <Text style={styles.label}>Prénom</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
        <Text style={styles.label}>Nom</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
        <Text style={styles.label}>Avatar URL (optionnel)</Text>
        <TextInput style={styles.input} value={avatarUrl} onChangeText={setAvatarUrl} autoCapitalize="none" />
        <Pressable style={[styles.button, !canSave && styles.buttonDisabled]} disabled={!canSave} onPress={handleSave}>
          <Text style={styles.buttonText}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Sécurité</Text>
        <Text style={styles.line}>
          <Text style={styles.bold}>Dernière activité sécurité:</Text>{" "}
          {securityActivity ? `${securityActivity.label} (${formatDate(securityActivity.createdAt)})` : "N/A"}
        </Text>
        <Text style={styles.label}>PIN actuel</Text>
        <TextInput style={styles.input} value={currentPin} onChangeText={setCurrentPin} secureTextEntry keyboardType="number-pad" />
        <Text style={styles.label}>Nouveau PIN</Text>
        <TextInput style={styles.input} value={newPin} onChangeText={setNewPin} secureTextEntry keyboardType="number-pad" />
        <Text style={styles.label}>Confirmer PIN</Text>
        <TextInput style={styles.input} value={confirmPin} onChangeText={setConfirmPin} secureTextEntry keyboardType="number-pad" />
        <Pressable style={[styles.button, pinSaving && styles.buttonDisabled]} disabled={pinSaving} onPress={handlePinChange}>
          <Text style={styles.buttonText}>{pinSaving ? "Mise à jour..." : "Changer le PIN"}</Text>
        </Pressable>
        {!!pinMessage && <Text style={styles.info}>{pinMessage}</Text>}
      </View>
      <Pressable style={styles.secondaryButton} onPress={() => void refresh()}>
        <Text style={styles.secondaryButtonText}>Rafraîchir</Text>
      </Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 12, paddingBottom: 24 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 },
  line: { color: "#374151", marginBottom: 6 },
  bold: { fontWeight: "700", color: "#111827" },
  label: { fontSize: 13, color: "#374151", marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: "#111827",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#111827", fontWeight: "700" },
  error: { color: "#dc2626", marginBottom: 10 },
  info: { marginTop: 8, color: "#374151" },
});
