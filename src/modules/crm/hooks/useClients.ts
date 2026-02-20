import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useCompanyId } from "../../../hooks/useCompany";
import { Client, CreateClientInput, ClientStatus } from "../types";
export type { Client, CreateClientInput, ClientStatus };
export type ClientRow = Client;
export type ClientInput = CreateClientInput;
async function fetchClients(
  companyId: string, 
  filters?: { status?: ClientStatus | "all"; search?: string }
): Promise<Client[]> {
  let query = supabase
    .from("clients")
    .select("*, assigned_user:users!assigned_to(first_name, last_name, email)")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
async function createClient(companyId: string, input: CreateClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      company_id: companyId,
      ...input,
      is_deleted: false,
    })
    .select("*, assigned_user:users!assigned_to(first_name, last_name, email)")
    .single();
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    entity_type: "client",
    entity_id: data.id,
    action: "created",
    changes: input,
  });
  return data;
}
async function updateClient(id: string, companyId: string, input: Partial<CreateClientInput>): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(input)
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*, assigned_user:users!assigned_to(first_name, last_name, email)")
    .single();
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    entity_type: "client",
    entity_id: id,
    action: "updated",
    changes: input,
  });
  return data;
}
async function deleteClient(id: string, companyId: string): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    entity_type: "client",
    entity_id: id,
    action: "deleted",
  });
}
export function useClients(filters?: { status?: ClientStatus | "all"; search?: string }) {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["clients", companyId, filters],
    queryFn: () => fetchClients(companyId!, filters),
    enabled: !!companyId,
  });
  const createMutation = useMutation({
    mutationFn: (input: CreateClientInput) => createClient(companyId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateClientInput> }) =>
      updateClient(id, companyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClient(id, companyId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
  const getClient = (clientId: string) => {
    return query.data?.find((c) => c.id === clientId) || null;
  };
  return {
    clients: query.data || [],
    refetch: query.refetch,
    isLoading: query.isLoading,
    isError: query.isError,
    getClient,
    createClient: createMutation.mutateAsync,
    updateClient: updateMutation,
    deleteClient: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

