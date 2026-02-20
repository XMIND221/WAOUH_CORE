import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, TextInput } from "react-native";
import { colors } from "../../../core/theme/colors";
import { ClientInput, ClientStatus } from "../hooks/useClients";
type Props = {
  initial?: ClientInput;
  onSubmit: (input: ClientInput) => void;
  submitLabel: string;
  isSubmitting?: boolean;
};
const statuses: ClientStatus[] = ["prospect", "lead", "client"];
export const ClientForm = React.memo(function ClientForm({ initial, onSubmit, submitLabel, isSubmitting }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [status, setStatus] = useState<ClientStatus>(initial?.status ?? "prospect");
  const [error, setError] = useState("");
  const canSubmit = useMemo(() => name.trim().length > 1, [name]);
  const handleSubmit = () => {
    if (!canSubmit) {
      setError("Name is required");
      return;
    }
    setError("");
    onSubmit({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      status,
    });
  };
  return (
    <View style={styles.form}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Client name" />
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" />
      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" />
      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {statuses.map((s) => {
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
              <Text style={[styles.statusText, active ? styles.statusTextActive : null]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.submit} onPress={handleSubmit}>
        <Text style={styles.submitText}>{isSubmitting ? "Saving..." : submitLabel}</Text>
      </Pressable>
    </View>
  );
});
const styles = StyleSheet.create({
  form: { gap: 12 },
  label: { color: colors.muted },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    color: colors.text,
  },
  statusRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statusChip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  statusActive: { backgroundColor: "#E0E7FF", borderColor: "#C7D2FE" },
  statusHover: { opacity: 0.9 },
  statusText: { color: colors.text, textTransform: "capitalize" },
  statusTextActive: { color: colors.primary, fontWeight: "700" },
  error: { color: colors.danger },
  submit: { backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  submitText: { color: colors.surface, fontWeight: "700" },
});

