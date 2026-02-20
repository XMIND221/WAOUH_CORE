// TODO: Extension WAOUH CORE - voir cahier des charges Enterprise
import React from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { ErpLayout } from "../../core/layout/ErpLayout";
import { colors } from "../../core/theme/colors";
import { useNotifications } from "./hooks/useNotifications";
import { NotificationCard } from "./components/NotificationCard";
export function NotificationsScreen() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const handlePress = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };
  if (isLoading) {
    return (
      <ErpLayout title="Notifications">
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </ErpLayout>
    );
  }
  return (
    <ErpLayout title="Notifications">
      <View style={styles.container}>
        {unreadCount > 0 && (
          <View style={styles.header}>
            <Text style={styles.headerText}>{unreadCount} non lue(s)</Text>
            <TouchableOpacity onPress={() => markAllAsRead()}>
              <Text style={styles.markAllButton}>Tout marquer comme lu</Text>
            </TouchableOpacity>
          </View>
        )}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <NotificationCard
              notification={item}
              onPress={() => handlePress(item.id, item.is_read)}
              index={index}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune notification</Text>
            </View>
          }
        />
      </View>
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  markAllButton: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
  list: {
    padding: 16,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
  },
});
