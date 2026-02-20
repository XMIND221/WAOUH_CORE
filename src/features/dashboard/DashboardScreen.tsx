import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { ErpLayout } from "../../core/layout/ErpLayout";
import { colors } from "../../core/theme/colors";
import { Section } from "../../core/components/Section";
import { useDashboardData } from "./hooks/useDashboardData";
import { useRealtimeTimeline } from "./hooks/useRealtimeTimeline";
import { RoleDashboard } from "./components/RoleDashboard";
import { TimelineCard } from "./components/TimelineCard";
import { useAuthStore } from "../../store/authStore";
import { UserRole } from "../../types/auth.types";
export function DashboardScreen() {
  const userProfile = useAuthStore((s) => s.userProfile);
  const companyId = useAuthStore((s) => s.companyId);
  const role = (userProfile?.role || "employe") as UserRole;
  const { data, isLoading, isError } = useDashboardData(role);
  const liveTimeline = useRealtimeTimeline(data?.timeline || []);
  const showTimeline = role === "super_admin" || role === "directeur_general";
  // Pas encore de companyId = afficher profil basique
  if (!companyId) {
    return (
      <ErpLayout title="Dashboard">
        <View style={styles.welcome}>
          <Text style={styles.welcomeText}>👋 Bienvenue {userProfile?.full_name || userProfile?.email}</Text>
          <Text style={styles.welcomeRole}>Rôle : {userProfile?.role}</Text>
          <Text style={styles.welcomeInfo}>Aucune entreprise associée à ce compte.</Text>
        </View>
      </ErpLayout>
    );
  }
  if (isLoading) {
    return (
      <ErpLayout title="Dashboard">
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </ErpLayout>
    );
  }
  if (isError || !data) {
    return (
      <ErpLayout title="Dashboard">
        <View style={styles.welcome}>
          <Text style={styles.welcomeText}>👋 Bienvenue {userProfile?.full_name || userProfile?.email}</Text>
          <Text style={styles.welcomeRole}>Rôle : {userProfile?.role}</Text>
          <Text style={styles.errorText}>Erreur de chargement des données</Text>
        </View>
      </ErpLayout>
    );
  }
  return (
    <ErpLayout title="Dashboard">
      <ScrollView showsVerticalScrollIndicator={false}>
        <RoleDashboard role={role} stats={data.stats} />
        {showTimeline && liveTimeline.length > 0 && (
          <Section title="Activité en temps réel">
            <View style={styles.timeline}>
              {liveTimeline.map((event, index) => (
                <TimelineCard key={event.id} event={event} index={index} />
              ))}
            </View>
          </Section>
        )}
        {role === "super_admin" && data.securityLogs.length > 0 && (
          <Section title="Logs sécurité">
            <View style={styles.logs}>
              {data.securityLogs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <Text style={styles.logEvent}>{log.event}</Text>
                  <Text style={styles.logTime}>
                    {new Date(log.created_at).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        )}
      </ScrollView>
    </ErpLayout>
  );
}
const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  loadingText: { marginTop: 12, color: colors.muted },
  welcome: { padding: 24, alignItems: "center", gap: 12 },
  welcomeText: { fontSize: 22, fontWeight: "bold", color: colors.text, textAlign: "center" },
  welcomeRole: { fontSize: 16, color: colors.primary, fontWeight: "600" },
  welcomeInfo: { fontSize: 14, color: colors.muted, textAlign: "center" },
  errorText: { color: colors.danger, textAlign: "center" },
  timeline: { gap: 4 },
  logs: { gap: 12 },
  logItem: { padding: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  logEvent: { fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 4 },
  logTime: { fontSize: 12, color: colors.muted },
});