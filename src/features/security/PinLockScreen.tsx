import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { usePinStore } from "../../store/pinStore";
export function PinLockScreen() {
  const [pin, setPin] = useState("");
  const { verifyPin } = usePinStore();
  const handleUnlock = async () => {
    if (pin.length !== 4) {
      Alert.alert("Erreur", "Le PIN doit contenir 4 chiffres");
      return;
    }
    const isValid = await verifyPin(pin);
    if (!isValid) {
      Alert.alert("Erreur", "PIN incorrect");
      setPin("");
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 Application verrouillée</Text>
      <Text style={styles.subtitle}>Entrez votre PIN pour déverrouiller</Text>
      <TextInput
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
        style={styles.input}
        placeholder="****"
        autoFocus
      />
      <Pressable onPress={handleUnlock} style={styles.button}>
        <Text style={styles.buttonText}>Déverrouiller</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1f2937", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#d1d5db", marginBottom: 32 },
  input: {
    width: 200,
    height: 60,
    fontSize: 32,
    textAlign: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 24,
  },
  button: { backgroundColor: "#3b82f6", paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});