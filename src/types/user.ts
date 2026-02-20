export type UserRole = "admin" | "manager" | "user";
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  company_id?: string;
  created_at?: string;
}