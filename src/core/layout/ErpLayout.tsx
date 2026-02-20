import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
export interface ErpLayoutProps {
  title: string;
  children: React.ReactNode;
}
const navItems = [
  { key: "Dashboard", label: "🏠 Dashboard", route: "Dashboard" },
  { key: "CRM", label: "👥 CRM", route: "CRM" },
  { key: "Messages", label: "💬 Messages", route: "Messages" },
  { key: "Invoices", label: "🧾 Factures", route: "Invoices" },
  { key: "Timeline", label: "📅 Timeline", route: "Timeline" },
  { key: "AuditLogs", label: "📋 Audit Logs", route: "AuditLogs" },
  { key: "Settings", label: "⚙️ Paramètres", route: "Settings" },
];
export function ErpLayout({ title, children }: ErpLayoutProps) {
  const navigation = useNavigation<any>();
  const { userProfile, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = Platform.OS === "web";
  const Sidebar = () => (
    <View style={styles.sidebar}>
      <Text style={styles.sidebarTitle}>WAOUH CORE</Text>
      {navItems.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => {
            navigation.navigate(item.route);
            setMenuOpen(false);
          }}
          style={styles.menuItem}
        >
          <Text style={styles.menuText}>{item.label}</Text>
        </Pressable>
      ))}
      <Pressable onPress={logout} style={styles.logoutSidebar}>
        <Text style={styles.logoutSidebarText}>🚪 Déconnexion</Text>
      </Pressable>
    </View>
  );
  return (
    <View style={styles.container}>
      {/* Sidebar desktop */}
      {isDesktop && <Sidebar />}
      {/* Menu mobile modal */}
      {!isDesktop && (
        <Modal visible={menuOpen} transparent animationType="slide">
          <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
            <View style={styles.mobileMenu}>
              <Sidebar />
            </View>
          </Pressable>
        </Modal>
      )}
      <View style={styles.main}>
        <View style={styles.header}>
          {!isDesktop && (
            <Pressable onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
              <Text style={styles.menuBtnText}>☰</Text>
            </Pressable>
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userProfile?.email}
            </Text>
            {isDesktop && (
              <Pressable onPress={logout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            )}
          </View>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#f9fafb" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", flexDirection: "row" },
  mobileMenu: { width: 280 },
  sidebar: { width: 240, backgroundColor: "#1f2937", padding: 16 },
  sidebarTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 24 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 6, marginBottom: 4 },
  menuText: { color: "#d1d5db", fontSize: 14 },
  logoutSidebar: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 8 },
  logoutSidebarText: { color: "#ef4444", fontSize: 14 },
  main: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
  },
  menuBtn: { padding: 4 },
  menuBtnText: { fontSize: 24, color: "#1f2937" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: 200 },
  userEmail: { fontSize: 12, color: "#6b7280", flexShrink: 1 },
  logoutButton: { backgroundColor: "#ef4444", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  logoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
});