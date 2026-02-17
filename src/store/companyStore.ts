import { create } from "zustand";
import { supabase } from "../services/supabase";
type CompanyState = {
  company: any | null;
  loadCompany: (companyId: string) => Promise<void>;
};
export const useCompanyStore = create<CompanyState>((set) => ({
  company: null,
  loadCompany: async (companyId) => {
    const { data } = await supabase.from("companies").select("*").eq("id", companyId).single();
    set({ company: data ?? null });
  },
}));
