import { useMemo } from "react";
import { Capability, useRole } from "../features/auth/hooks/useRole";
export type AppRouteName =
  | "Dashboard"
  | "CRM"
  | "Projects"
  | "Tasks"
  | "Messaging"
  | "Timeline"
  | "SecurityLogs"
  | "Finance"
  | "Settings";
export type AppMenuItem = {
  key: string;
  label: string;
  route: AppRouteName;
};
const ROUTE_CAPABILITY: Record<AppRouteName, Capability | null> = {
  Dashboard: null,
  CRM: "crm.read",
  Projects: "projects.read",
  Tasks: "tasks.read",
  Messaging: "messaging.read",
  Timeline: "timeline.read",
  SecurityLogs: "security.logs.read",
  Finance: "finance.read",
  Settings: null,
};
export function canAccessRouteByCapabilities(
  route: AppRouteName,
  can: (c: Capability) => boolean,
  role: "admin" | "manager" | "user"
): boolean {
  if (route === "Projects" && role === "user") return true;
  if (route === "Tasks" && role === "user") return true;
  const capability = ROUTE_CAPABILITY[route];
  if (!capability) return true;
  return can(capability);
}
export function useNavigationProtection() {
  const { role, can } = useRole();
  const isRouteAllowed = (route: AppRouteName) => canAccessRouteByCapabilities(route, can, role);
  const filterMenu = (items: AppMenuItem[]) => items.filter((item) => isRouteAllowed(item.route));
  const protectedInitialRoute = useMemo<AppRouteName>(() => {
    if (role === "admin") return "Dashboard";
    if (role === "manager") return "Dashboard";
    return "Timeline";
  }, [role]);
  return {
    role,
    isRouteAllowed,
    filterMenu,
    protectedInitialRoute,
  };
}
