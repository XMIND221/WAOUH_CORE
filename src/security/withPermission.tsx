import React from "react";
import { View, Text } from "react-native";
import { useRole } from "./RoleContext";
interface WithPermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
export function WithPermission({ permission, children, fallback }: WithPermissionProps) {
  const { hasPermission } = useRole();
  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : (
      <View style={{ padding: 16, alignItems: "center" }}>
        <Text style={{ color: "#ef4444" }}>Accès refusé</Text>
      </View>
    );
  }
  return <>{children}</>;
}
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  permission: string
) {
  return function ProtectedComponent(props: T) {
    const { hasPermission } = useRole();
    if (!hasPermission(permission)) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#ef4444" }}>Accès refusé</Text>
        </View>
      );
    }
    return <Component {...props} />;
  };
}