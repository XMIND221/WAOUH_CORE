import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { colors } from "../../core/theme/colors";
import { useAuthStore } from "../../store/authStore";
export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuthStore();
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Email et mot de passe requis");
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      Alert.alert("Erreur de connexion", err.message || "Email ou mot de passe incorrect");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WAOUH CORE</Text>
      <Text style={styles.subtitle}>ERP interne</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, marginBottom: 4, textAlign: "center" },
  subtitle: { color: colors.muted, marginBottom: 32, textAlign: "center", fontSize: 16 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    color: colors.text,
    fontSize: 16,
  },
  button: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});