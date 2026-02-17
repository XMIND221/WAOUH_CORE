import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { MainTabs } from "./MainTabs";
import { LoginScreen } from "../features/auth/LoginScreen";
import { SplashScreen } from "../features/auth/SplashScreen";
import { useAuthStore } from "../store/authStore";
import { TimelineScreen } from "../modules/timeline/TimelineScreen";
import { AuditScreen } from "../modules/audit/AuditScreen";
import { SecurityScreen } from "../modules/security/SecurityScreen";
const Stack = createNativeStackNavigator<RootStackParamList>();
export default function RootNavigator() {
  const { session, isLoading, bootstrap } = useAuthStore();
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : session ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Timeline" component={TimelineScreen} />
            <Stack.Screen name="Audit" component={AuditScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
