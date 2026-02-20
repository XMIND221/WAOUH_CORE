import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
export interface Invoice {
  id: string;
  client_id: string;
  client_name?: string;
  invoice_number: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string;
  created_at: string;
}
export function useInvoices() {
  const { userProfile } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!userProfile?.company_id) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }
    fetchInvoices();
  }, [userProfile?.company_id]);
  const fetchInvoices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*, clients(name)")
      .eq("company_id", userProfile?.company_id)
      .order("created_at", { ascending: false });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    const formattedInvoices = (data ?? []).map((inv: any) => ({
      ...inv,
      client_name: inv.clients?.name || "Client inconnu",
    }));
    setInvoices(formattedInvoices);
    setIsLoading(false);
  };
  const createInvoice = async (invoice: Partial<Invoice>) => {
    if (!userProfile?.company_id) throw new Error("Aucune entreprise associée.");
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        ...invoice,
        company_id: userProfile.company_id,
      })
      .select()
      .single();
    if (error) throw error;
    await fetchInvoices();
    return data;
  };
  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const { error } = await supabase.from("invoices").update(updates).eq("id", id);
    if (error) throw error;
    await fetchInvoices();
  };
  const deleteInvoice = async (id: string) => {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) throw error;
    await fetchInvoices();
  };
  return {
    invoices,
    isLoading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refetch: fetchInvoices,
  };
}