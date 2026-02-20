import React from "react";
import { View, Text } from "react-native";
import { useAuthStore, UserRole } from "../../store/authStore";
interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}
interface RouteGuardOptions {
  allowedRoles?: UserRole[];
  redirectTo?: string;
}
export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { userProfile, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Chargement...</Text>
      </View>
    );
  }
  if (!userProfile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Non autorise</Text>
      </View>
    );
  }
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Acces refuse</Text>
      </View>
    );
  }
  return <>{children}</>;
}
export function withRouteGuard<T extends object>(
  Component: React.ComponentType<T>,
  options?: RouteGuardOptions
) {
  return function GuardedComponent(props: T) {
    const { userProfile, isLoading } = useAuthStore();
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Chargement...</Text>
        </View>
      );
    }
    if (!userProfile) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Non autorise</Text>
        </View>
      );
    }
    if (options?.allowedRoles && !options.allowedRoles.includes(userProfile.role)) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Acces refuse</Text>
        </View>
      );
    }
    return <Component {...props} />;
  };
}