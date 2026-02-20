import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { usePermissions, Permission } from "../hooks/usePermissions";
interface ProtectedRouteProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
export function ProtectedRoute({ permission, children, fallback }: ProtectedRouteProps) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(permission)) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.title}>🚫 Accès refusé</Text>
        <Text style={styles.message}>
          Vous n'avez pas la permission d'accéder à cette fonctionnalité.
        </Text>
      </View>
    );
  }
  return <>{children}</>;
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8, color: "#ef4444" },
  message: { fontSize: 16, color: "#6b7280", textAlign: "center" },
});