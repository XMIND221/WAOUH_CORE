import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useCompanyId } from "../../../hooks/useCompany";
import { Deal, CreateDealInput, DealStage } from "../types";
async function fetchDeals(companyId: string): Promise<Deal[]> {
  const { data, error } = await supabase
    .from("deals")
    .select(`
      *,
      client:clients(id, name, email),
      assigned_user:users!assigned_to(first_name, last_name)
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
async function createDeal(companyId: string, input: CreateDealInput): Promise<Deal> {
  const { data, error } = await supabase
    .from("deals")
    .insert({ company_id: companyId, ...input })
    .select(`
      *,
      client:clients(id, name, email),
      assigned_user:users!assigned_to(first_name, last_name)
    `)
    .single();
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    entity_type: "deal",
    entity_id: data.id,
    action: "created",
  });
  return data;
}
async function updateDealStage(id: string, companyId: string, stage: DealStage): Promise<Deal> {
  const { data, error } = await supabase
    .from("deals")
    .update({ stage })
    .eq("id", id)
    .eq("company_id", companyId)
    .select(`
      *,
      client:clients(id, name, email),
      assigned_user:users!assigned_to(first_name, last_name)
    `)
    .single();
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    entity_type: "deal",
    entity_id: id,
    action: "stage_changed",
    changes: { stage },
  });
  return data;
}
export function useDeals() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["deals", companyId],
    queryFn: () => fetchDeals(companyId!),
    enabled: !!companyId,
  });
  const createMutation = useMutation({
    mutationFn: (input: CreateDealInput) => createDeal(companyId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      updateDealStage(id, companyId!, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
  return {
    deals: query.data || [],
    isLoading: query.isLoading,
    createDeal: createMutation.mutateAsync,
    updateStage: updateStageMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
