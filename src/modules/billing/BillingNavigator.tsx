import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { InvoiceListScreen } from "./InvoiceListScreen";
import { InvoiceCreateScreen } from "./InvoiceCreateScreen";
import { InvoiceDetailScreen } from "./InvoiceDetailScreen";
export type BillingStackParamList = {
  InvoiceList: undefined;
  InvoiceCreate: undefined;
  InvoiceDetail: { invoiceId: string };
};
const Stack = createNativeStackNavigator<BillingStackParamList>();
export function BillingNavigator() {
  return (
    <Stack.Navigator id="billing-stack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InvoiceList" component={InvoiceListScreen} />
      <Stack.Screen name="InvoiceCreate" component={InvoiceCreateScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
    </Stack.Navigator>
  );
}

