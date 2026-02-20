import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CRMListScreen } from "./screens/CRMListScreen";
import { CreateClientScreen } from "./screens/CreateClientScreen";
import { ClientDetailsScreen } from "./screens/ClientDetailsScreen";
export type CRMStackParamList = {
  CRMList: undefined;
  CreateClient: undefined;
  ClientDetails: { clientId: string };
};
const Stack = createNativeStackNavigator<CRMStackParamList>();
export function CRMNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CRMList" component={CRMListScreen} />
      <Stack.Screen name="CreateClient" component={CreateClientScreen} />
      <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
    </Stack.Navigator>
  );
}
