import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabsParamList } from "./types";
import { DashboardScreen } from "../features/dashboard/DashboardScreen";
import { CRMNavigator } from "../modules/crm/CRMNavigator";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { MessagingScreen } from "../features/messaging/MessagingScreen";
import { InvoicesScreen } from "../features/invoices/InvoicesScreen";
import { TimelineScreen } from "../features/timeline/TimelineScreen";
import { AuditLogsScreen } from "../features/audit/AuditLogsScreen";
import { Text } from "react-native";
const Tab = createBottomTabNavigator<MainTabsParamList>();
export function MainTabs() {
  return (
    <Tab.Navigator id="main-tabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#1f2937" },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: "Dashboard", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="CRM"
        component={CRMNavigator}
        options={{ tabBarLabel: "CRM", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👥</Text> }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagingScreen}
        options={{ tabBarLabel: "Messages", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💬</Text> }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{ tabBarLabel: "Factures", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🧾</Text> }}
      />
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{ tabBarLabel: "Timeline", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📅</Text> }}
      />
      <Tab.Screen
        name="AuditLogs"
        component={AuditLogsScreen}
        options={{ tabBarLabel: "Audit", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📋</Text> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: "Parametres", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  );
}
