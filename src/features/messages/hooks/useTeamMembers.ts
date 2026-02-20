import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useCompanyId } from "../../../hooks/useCompany";
export interface TeamMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_active: boolean;
}
async function fetchTeamMembers(companyId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, role, is_active")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("first_name", { ascending: true });
  if (error) throw error;
  return data || [];
}
export function useTeamMembers() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ["team-members", companyId],
    queryFn: () => fetchTeamMembers(companyId!),
    enabled: !!companyId,
  });
}
