import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useCompanyId, useUserId } from "../../../hooks/useCompany";
import { Activity, CreateActivityInput } from "../types";
async function fetchActivities(companyId: string, clientId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*, user:users!created_by(first_name, last_name, email)")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
async function createActivity(companyId: string, userId: string, input: CreateActivityInput): Promise<Activity> {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      company_id: companyId,
      created_by: userId,
      ...input,
    })
    .select("*, user:users!created_by(first_name, last_name, email)")
    .single();
  if (error) throw error;
  return data;
}
export function useActivities(clientId: string | null) {
  const companyId = useCompanyId();
  const userId = useUserId();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["activities", companyId, clientId],
    queryFn: () => fetchActivities(companyId!, clientId!),
    enabled: !!companyId && !!clientId,
  });
  const createMutation = useMutation({
    mutationFn: (input: CreateActivityInput) => createActivity(companyId!, userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
  return {
    activities: query.data || [],
    isLoading: query.isLoading,
    createActivity: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
