import "react-native-gesture-handler";
import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { AppProviders } from "./src/core/layout/AppProviders";
export default function App() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
