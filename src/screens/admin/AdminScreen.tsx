import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { RouteGuard } from "../../components/RouteGuard";
import { UserProfile, UserRole } from "../../types/auth.types";
export const AdminScreen: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: !currentStatus })
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, is_active: !currentStatus } : user
        )
      );
      Alert.alert("Succès", `Utilisateur ${!currentStatus ? "activé" : "désactivé"}`);
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      Alert.alert("Succès", "Rôle modifié");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };
  const renderUser = ({ item }: { item: UserProfile }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>Rôle: {item.role}</Text>
      </View>
      <View style={styles.userActions}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Actif</Text>
          <Switch
            value={item.is_active}
            onValueChange={() => toggleUserStatus(item.id, item.is_active ?? false)}
          />
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            Alert.alert(
              "Modifier le rôle",
              `Utilisateur: ${item.email}`,
              [
                { text: "Annuler", style: "cancel" },
                { text: "Super Admin", onPress: () => updateUserRole(item.id, "super_admin") },
                { text: "Directeur Général", onPress: () => updateUserRole(item.id, "directeur_general") },
                { text: "Resp. Commercial", onPress: () => updateUserRole(item.id, "responsable_commercial") },
                { text: "Designer", onPress: () => updateUserRole(item.id, "designer") },
                { text: "Comptabilité", onPress: () => updateUserRole(item.id, "comptabilite") },
                { text: "RH", onPress: () => updateUserRole(item.id, "rh") },
                { text: "Développeur", onPress: () => updateUserRole(item.id, "developpeur") },
                { text: "Employé", onPress: () => updateUserRole(item.id, "employe") },
              ]
            );
          }}
        >
          <Text style={styles.editButtonText}>Modifier rôle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  return (
    <RouteGuard allowedRoles={["super_admin"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Administration</Text>
        <Text style={styles.subtitle}>Gestion des utilisateurs</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </RouteGuard>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  loader: {
    marginTop: 100,
  },
  list: {
    padding: 20,
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  userInfo: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
  },
  userActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  editButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
