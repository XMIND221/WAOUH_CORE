import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { usePinStore } from "../../store/pinStore";
export function PinSettingsScreen() {
  const { isPinEnabled, enablePin, disablePin } = usePinStore();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const handleEnablePin = async () => {
    if (newPin.length !== 4) {
      Alert.alert("Erreur", "Le PIN doit contenir 4 chiffres");
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert("Erreur", "Les PINs ne correspondent pas");
      return;
    }
    await enablePin(newPin);
    Alert.alert("Succès", "PIN activé avec succès");
    setNewPin("");
    setConfirmPin("");
  };
  const handleDisablePin = async () => {
    Alert.alert(
      "Désactiver le PIN",
      "Êtes-vous sûr de vouloir désactiver le PIN ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Désactiver", onPress: async () => await disablePin() },
      ]
    );
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Sécurité PIN</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Statut : {isPinEnabled ? "✅ Activé" : "❌ Désactivé"}</Text>
        {!isPinEnabled ? (
          <>
            <TextInput
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              style={styles.input}
              placeholder="Nouveau PIN (4 chiffres)"
            />
            <TextInput
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              style={styles.input}
              placeholder="Confirmer le PIN"
            />
            <Pressable onPress={handleEnablePin} style={styles.buttonEnable}>
              <Text style={styles.buttonText}>Activer le PIN</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={handleDisablePin} style={styles.buttonDisable}>
            <Text style={styles.buttonText}>Désactiver le PIN</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonEnable: { backgroundColor: "#10b981", padding: 12, borderRadius: 8, alignItems: "center" },
  buttonDisable: { backgroundColor: "#ef4444", padding: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});