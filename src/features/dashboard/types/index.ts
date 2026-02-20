import { UserRole } from "../../../types/auth.types";
export interface DashboardStats {
  projectsActive: number;
  tasksInProgress: number;
  usersActive: number;
  clientsTotal: number;
  invoicesPending: number;
  invoicesOverdue: number;
  revenueTotal: number;
  tasksAssignedToMe: number;
  myDeadlinesClose: number;
  projectsDelayed: number;
  tasksCritical: number;
}
export interface TimelineEvent {
  id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}
export interface SecurityLog {
  id: string;
  event: string;
  status: string;
  created_at: string;
  user?: {
    email: string;
  } | null;
}
export interface DashboardData {
  stats: DashboardStats;
  timeline: TimelineEvent[];
  securityLogs: SecurityLog[];
}
export interface DashboardConfig {
  role: UserRole;
  showGlobalStats: boolean;
  showTimeline: boolean;
  showSecurityLogs: boolean;
  showMyTasks: boolean;
  showFinancials: boolean;
  showClients: boolean;
}
