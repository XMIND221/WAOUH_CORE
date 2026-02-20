import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useCompanyId } from "../../../hooks/useCompany";
import { Invoice, CreateInvoiceInput, InvoiceStatus } from "../types";
async function fetchInvoices(companyId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, client:clients(name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
async function createInvoice(companyId: string, input: CreateInvoiceInput): Promise<Invoice> {
  const count = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count.count || 0) + 1).padStart(4, "0")}`;
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      company_id: companyId,
      number: invoiceNumber,
      status: "brouillon" as InvoiceStatus,
      ...input,
    })
    .select("*, client:clients(name)")
    .single();
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    entity_type: "invoice",
    entity_id: data.id,
    action: "created",
  });
  return data;
}
async function updateInvoiceStatus(id: string, companyId: string, status: InvoiceStatus): Promise<Invoice> {
  const { data, error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*, client:clients(name)")
    .single();
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    entity_type: "invoice",
    entity_id: id,
    action: "status_changed",
    changes: { status },
  });
  return data;
}
export function useInvoicing() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["invoices", companyId],
    queryFn: () => fetchInvoices(companyId!),
    enabled: !!companyId,
  });
  const createMutation = useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(companyId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      updateInvoiceStatus(id, companyId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
  return {
    invoices: query.data || [],
    isLoading: query.isLoading,
    createInvoice: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
