import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { AnimatedStatCard } from "./AnimatedStatCard";
import { DashboardStats } from "../types";
import { UserRole } from "../../../types/auth.types";
import { colors } from "../../../core/theme/colors";
import { formatCurrency } from "../../../core/utils/format";
interface Props {
  role: UserRole;
  stats: DashboardStats;
}
export function RoleDashboard({ role, stats }: Props) {
  return (
    <View style={styles.container}>
      {role === "super_admin" && <SuperAdminDashboard stats={stats} />}
      {role === "directeur_general" && <DirectorDashboard stats={stats} />}
      {role === "responsable_commercial" && <CommercialDashboard stats={stats} />}
      {(role === "designer" || role === "developpeur" || role === "employe") && <ProductionDashboard stats={stats} />}
      {role === "comptabilite" && <FinanceDashboard stats={stats} />}
      {role === "rh" && <RHDashboard stats={stats} />}
    </View>
  );
}
function SuperAdminDashboard({ stats }: { stats: DashboardStats }) {
  return (
    <View style={styles.grid}>
      <AnimatedStatCard label="Projets actifs" value={stats.projectsActive} accent={colors.primary} delay={0} />
      <AnimatedStatCard label="Tâches en cours" value={stats.tasksInProgress} accent={colors.info} delay={100} />
      <AnimatedStatCard label="Utilisateurs actifs" value={stats.usersActive} accent={colors.success} delay={200} />
      <AnimatedStatCard label="Clients" value={stats.clientsTotal} accent={colors.warning} delay={300} />
    </View>
  );
}
function DirectorDashboard({ stats }: { stats: DashboardStats }) {
  return (
    <View style={styles.grid}>
      <AnimatedStatCard label="Projets actifs" value={stats.projectsActive} accent={colors.primary} delay={0} />
      <AnimatedStatCard label="Tâches en cours" value={stats.tasksInProgress} accent={colors.info} delay={100} />
      <AnimatedStatCard label="Revenus totaux" value={formatCurrency(stats.revenueTotal)} accent={colors.success} delay={200} />
      <AnimatedStatCard label="Factures impayées" value={stats.invoicesOverdue} accent={colors.danger} delay={300} />
    </View>
  );
}
function CommercialDashboard({ stats }: { stats: DashboardStats }) {
  return (
    <View style={styles.grid}>
      <AnimatedStatCard label="Clients" value={stats.clientsTotal} accent={colors.primary} delay={0} />
      <AnimatedStatCard label="Factures en attente" value={stats.invoicesPending} accent={colors.warning} delay={100} />
      <AnimatedStatCard label="Factures impayées" value={stats.invoicesOverdue} accent={colors.danger} delay={200} />
      <AnimatedStatCard label="Revenus" value={formatCurrency(stats.revenueTotal)} accent={colors.success} delay={300} />
    </View>
  );
}
function ProductionDashboard({ stats }: { stats: DashboardStats }) {
  return (
    <View style={styles.grid}>
      <AnimatedStatCard label="Mes tâches" value={stats.tasksAssignedToMe} accent={colors.primary} delay={0} />
      <AnimatedStatCard label="Deadlines proches" value={stats.myDeadlinesClose} accent={colors.danger} delay={100} />
    </View>
  );
}
function FinanceDashboard({ stats }: { stats: DashboardStats }) {
  return (
    <View style={styles.grid}>
      <AnimatedStatCard label="Revenus totaux" value={formatCurrency(stats.revenueTotal)} accent={colors.success} delay={0} />
      <AnimatedStatCard label="Factures en attente" value={stats.invoicesPending} accent={colors.warning} delay={100} />
      <AnimatedStatCard label="Factures impayées" value={stats.invoicesOverdue} accent={colors.danger} delay={200} />
    </View>
  );
}
function RHDashboard({ stats }: { stats: DashboardStats }) {
  return (
    <View style={styles.grid}>
      <AnimatedStatCard label="Utilisateurs actifs" value={stats.usersActive} accent={colors.success} delay={0} />
      <AnimatedStatCard label="Tâches en cours" value={stats.tasksInProgress} accent={colors.info} delay={100} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
