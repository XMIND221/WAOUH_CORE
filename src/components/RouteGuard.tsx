import React, { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRole } from "../contexts/RoleContext";
import { UserRole } from "../types/auth.types";
interface RouteGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
  fallback?: ReactNode;
}
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallback,
}) => {
  const { role, hasPermission, isLoading } = useRole();
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.errorText}>Accès non autorisé</Text>
        <Text style={styles.subText}>Vous n'avez pas les permissions nécessaires</Text>
      </View>
    );
  }
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.errorText}>Accès non autorisé</Text>
        <Text style={styles.subText}>Permission requise : {requiredPermission}</Text>
      </View>
    );
  }
  return <>{children}</>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
