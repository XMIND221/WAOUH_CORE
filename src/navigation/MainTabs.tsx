import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DashboardScreen } from "../features/dashboard/DashboardScreen";
import { ProjectsScreen } from "../features/projects/ProjectsScreen";
import { TasksScreen } from "../features/tasks/TasksScreen";
import { TeamScreen } from "../features/team/TeamScreen";
import { NotificationsScreen } from "../features/notifications/NotificationsScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { MainTabsParamList } from "./types";
import { colors } from "../core/theme/colors";
import { CRMNavigator } from "../modules/crm/CRMNavigator";
import { BillingNavigator } from "../modules/billing/BillingNavigator";
const Tabs = createBottomTabNavigator<MainTabsParamList>();
export function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="CRM" component={CRMNavigator} />
      <Tabs.Screen name="Projects" component={ProjectsScreen} />
      <Tabs.Screen name="Tasks" component={TasksScreen} />
      <Tabs.Screen name="Team" component={TeamScreen} />
      <Tabs.Screen name="Finance" component={BillingNavigator} />
      <Tabs.Screen name="Notifications" component={NotificationsScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}
