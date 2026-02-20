import React, { useEffect } from "react";
import { MessagingScreen } from "../features/messaging/MessagingScreen";
import { InvoicesScreen } from "../features/invoices/InvoicesScreen";
import { TimelineScreen } from "../features/timeline/TimelineScreen";
import { AuditLogsScreen } from "../features/audit/AuditLogsScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { MainTabs } from "./MainTabs";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { ChangePasswordScreen } from "../screens/auth/ChangePasswordScreen";
import { AdminScreen } from "../screens/admin/AdminScreen";
import { useAuthStore } from "../store/authStore";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { RoleProvider } from "../contexts/RoleContext";
const Stack = createNativeStackNavigator<RootStackParamList>();
export default function RootNavigator() {
  const { user, isLoading, bootstrap, userProfile } = useAuthStore();
  useEffect(() => {
    bootstrap();
  }, []);
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }
  return (
    <NavigationContainer>
      {user ? (
        <RoleProvider>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {userProfile?.must_change_password ? (
              <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen
                  name="Admin"
                  component={AdminScreen}
                  options={{ headerShown: true, title: "Administration" }}
                />
                <Stack.Screen name="Messages" component={MessagingScreen} options={{ headerShown: true, title: "Messages" }} />
                <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ headerShown: true, title: "Factures" }} />
                <Stack.Screen name="Timeline" component={TimelineScreen} options={{ headerShown: true, title: "Timeline" }} />
                <Stack.Screen name="AuditLogs" component={AuditLogsScreen} options={{ headerShown: true, title: "Audit Logs" }} />
              </>
            )}
          </Stack.Navigator>
        </RoleProvider>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
});