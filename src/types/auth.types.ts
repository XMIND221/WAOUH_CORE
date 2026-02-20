export type UserRole =
  | "super_admin"
  | "directeur_general"
  | "responsable_commercial"
  | "designer"
  | "developpeur"
  | "comptabilite"
  | "rh"
  | "employe"
  | "admin"
  | "manager"
  | "user";
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role: UserRole;
  company_id?: string;
  is_active?: boolean;
  must_change_password?: boolean;
  created_at?: string;
}