import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useCompanyId, useUserId } from "../../../hooks/useCompany";
import { DashboardData, DashboardStats } from "../types";
import { UserRole } from "../../../types/auth.types";
async function fetchDashboardData(
  companyId: string,
  userId: string,
  role: UserRole
): Promise<DashboardData> {
  const isSuperAdmin = role === "super_admin";
  const isDirector = role === "directeur_general";
  const isCommercial = role === "responsable_commercial";
  const isFinance = role === "comptabilite";
  const isRH = role === "rh";
  // Stats selon rôle
  const statsQueries = [];
  if (isSuperAdmin || isDirector) {
    statsQueries.push(
      supabase.from("projects").select("id", { count: "exact" }).eq("company_id", companyId).eq("status", "active"),
      supabase.from("tasks").select("id", { count: "exact" }).eq("company_id", companyId).in("status", ["in_progress", "blocked"]),
      supabase.from("users").select("id", { count: "exact" }).eq("company_id", companyId).eq("is_active", true)
    );
  }
  if (isCommercial || isSuperAdmin || isDirector) {
    statsQueries.push(
      supabase.from("clients").select("id", { count: "exact" }).eq("company_id", companyId).eq("is_deleted", false)
    );
  }
  if (isFinance || isSuperAdmin || isDirector) {
    statsQueries.push(
      supabase.from("invoices").select("id,total,status").eq("company_id", companyId)
    );
  }
  // Tasks assignées à moi (tous sauf super_admin)
  if (!isSuperAdmin) {
    statsQueries.push(
      supabase.from("tasks").select("id,deadline", { count: "exact" }).eq("company_id", companyId).eq("assigned_to", userId).in("status", ["todo", "in_progress"])
    );
  }
  const statsResults = await Promise.all(statsQueries);
  let stats: DashboardStats = {
    projectsActive: 0,
    tasksInProgress: 0,
    usersActive: 0,
    clientsTotal: 0,
    invoicesPending: 0,
    invoicesOverdue: 0,
    revenueTotal: 0,
    tasksAssignedToMe: 0,
    myDeadlinesClose: 0,
    projectsDelayed: 0,
    tasksCritical: 0,
  };
  let idx = 0;
  if (isSuperAdmin || isDirector) {
    stats.projectsActive = statsResults[idx++]?.count ?? 0;
    stats.tasksInProgress = statsResults[idx++]?.count ?? 0;
    stats.usersActive = statsResults[idx++]?.count ?? 0;
  }
  if (isCommercial || isSuperAdmin || isDirector) {
    stats.clientsTotal = statsResults[idx++]?.count ?? 0;
  }
  if (isFinance || isSuperAdmin || isDirector) {
    const invoicesData = statsResults[idx++]?.data || [];
    stats.invoicesPending = invoicesData.filter((i: any) => i.status === "pending").length;
    stats.invoicesOverdue = invoicesData.filter((i: any) => i.status === "overdue").length;
    stats.revenueTotal = invoicesData.reduce((sum: number, i: any) => sum + Number(i.total ?? 0), 0);
  }
  if (!isSuperAdmin) {
    const myTasksResult = statsResults[idx++];
    stats.tasksAssignedToMe = myTasksResult?.count ?? 0;
    const myTasks = myTasksResult?.data || [];
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    stats.myDeadlinesClose = myTasks.filter((t: any) => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      return deadline <= threeDaysLater && deadline >= now;
    }).length;
  }
  // Timeline (derniers 20 événements)
  const { data: timeline } = await supabase
    .from("timeline_events")
    .select("*, user:users(first_name, last_name, email)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(20);
  // Security logs (super_admin uniquement)
  let securityLogs: any[] = [];
  if (isSuperAdmin) {
    const { data } = await supabase
      .from("security_logs")
      .select("*, user:users(email)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10);
    securityLogs = data || [];
  }
  return {
    stats,
    timeline: timeline || [],
    securityLogs,
  };
}
export function useDashboardData(role: UserRole) {
  const companyId = useCompanyId();
  const userId = useUserId();
  return useQuery({
    queryKey: ["dashboard", companyId, userId, role],
    queryFn: () => fetchDashboardData(companyId!, userId!, role),
    enabled: !!companyId && !!userId,
    refetchInterval: 30000, // Refetch toutes les 30s
    staleTime: 20000,
  });
}
