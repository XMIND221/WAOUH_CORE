import { supabase } from "./../supabase";
export async function setCompanyContext(companyId: string | null) {
  if (!companyId) return;
  const { error } = await supabase.rpc("set_waouh_company_id", { p_company_id: companyId });
  if (error) throw error;
}
