import React from "react";
import { Text, View } from "react-native";
import { AppRole, Capability, useRole } from "../hooks/useRole";
type GuardBaseProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};
type RoleGuardProps = GuardBaseProps & {
  allow: AppRole[];
};
type CapabilityGuardProps = GuardBaseProps & {
  capability: Capability;
};
const DefaultDenied = () => (
  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
    <Text>Accès refusé.</Text>
  </View>
);
export function RoleGuard({ allow, children, fallback }: RoleGuardProps) {
  const { role } = useRole();
  if (!allow.includes(role)) return <>{fallback ?? <DefaultDenied />}</>;
  return <>{children}</>;
}
export function CapabilityGuard({ capability, children, fallback }: CapabilityGuardProps) {
  const { can } = useRole();
  if (!can(capability)) return <>{fallback ?? <DefaultDenied />}</>;
  return <>{children}</>;
}
export function usePageAccess(required: Capability | Capability[]) {
  const { can, canAll } = useRole();
  const allowed = Array.isArray(required) ? canAll(required) : can(required);
  return { allowed };
}
