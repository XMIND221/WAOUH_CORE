import { ChatScreen } from "../features/messages/screens/ChatScreen";
import { MessagesListScreen } from "../features/messages/screens/MessagesListScreen";
import React, { useEffect } from "react";
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
    let alive = true;
    const run = async () => {
      try {
        await Promise.resolve(bootstrap());
      } catch (e) {
        console.error("[RootNavigator] bootstrap failed:", e);
      } finally {
        if (alive) useAuthStore.setState({ isLoading: false });
      }
    };
    const timeout = setTimeout(() => {
      if (alive) {
        console.warn("[RootNavigator] bootstrap timeout -> force stop loading");
        useAuthStore.setState({ isLoading: false });
      }
    }, 7000);
    run();
    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [bootstrap]);
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
          <Stack.Navigator id="root-app-stack" screenOptions={{ headerShown: false }}>
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
                <Stack.Screen
                  name="Messages"
                  component={MessagesListScreen}
                  options={{ headerShown: true, title: "Messages" }}
                />
                <Stack.Screen
                  name="ChatScreen"
                  component={ChatScreen}
                  options={{ headerShown: true, title: "Conversation" }}
                />
                <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ headerShown: true, title: "Factures" }} />
                <Stack.Screen name="Timeline" component={TimelineScreen} options={{ headerShown: true, title: "Timeline" }} />
                <Stack.Screen name="AuditLogs" component={AuditLogsScreen} options={{ headerShown: true, title: "Audit Logs" }} />
              </>
            )}
          </Stack.Navigator>
        </RoleProvider>
      ) : (
        <Stack.Navigator id="root-guest-stack" screenOptions={{ headerShown: false }}>
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
