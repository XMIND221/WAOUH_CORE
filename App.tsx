import "react-native-gesture-handler";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RootNavigator from "./src/navigation/RootNavigator";
import { AppProviders } from "./src/core/layout/AppProviders";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 20000,
    },
  },
});
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </QueryClientProvider>
  );
}