// Types pour l'ERP
export interface Client {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
}
export interface Invoice {
  id: string;
  company_id: string;
  client_id: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  created_at: string;
  updated_at: string;
}
export interface Project {
  id: string;
  company_id: string;
  name: string;
  status: "planning" | "active" | "completed";
  created_at: string;
  updated_at: string;
}
