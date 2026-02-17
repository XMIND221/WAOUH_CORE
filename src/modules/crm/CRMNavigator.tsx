import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CRMListScreen } from "./CRMListScreen";
import { CRMCreateScreen } from "./CRMCreateScreen";
import { CRMDetailScreen } from "./CRMDetailScreen";
import { CRMEditScreen } from "./CRMEditScreen";
export type CRMStackParamList = {
  CRMList: undefined;
  CRMCreate: undefined;
  CRMDetail: { clientId: string };
  CRMEdit: { clientId: string };
};
const Stack = createNativeStackNavigator<CRMStackParamList>();
export function CRMNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CRMList" component={CRMListScreen} />
      <Stack.Screen name="CRMCreate" component={CRMCreateScreen} />
      <Stack.Screen name="CRMDetail" component={CRMDetailScreen} />
      <Stack.Screen name="CRMEdit" component={CRMEditScreen} />
    </Stack.Navigator>
  );
}
