import { supabase } from "./supabase";
export async function fetchByCompany<T>(table: string, companyId: string) {
  const { data, error } = await supabase.from(table).select("*").eq("company_id", companyId);
  if (error) throw error;
  return data as T[];
}
