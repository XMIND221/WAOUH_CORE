export type ClientStatus = 'prospect' | 'lead' | 'client' | 'actif' | 'inactif';
export type DealStage = 'nouveau' | 'qualification' | 'proposition' | 'negociation' | 'gagne' | 'perdu';
export type InvoiceStatus = 'brouillon' | 'envoyee' | 'payee' | 'annulee';
export type ActivityType = 'appel' | 'email' | 'rdv' | 'note';
export interface Client {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: ClientStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}
export interface Deal {
  id: string;
  company_id: string;
  client_id: string;
  title: string;
  amount: number;
  stage: DealStage;
  probability: number;
  expected_close: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  assigned_user?: {
    first_name: string | null;
    last_name: string | null;
  };
}
export interface Invoice {
  id: string;
  company_id: string;
  client_id: string;
  deal_id: string | null;
  number: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string | null;
  created_at: string;
  client?: {
    name: string;
  };
}
export interface Activity {
  id: string;
  company_id: string;
  client_id: string;
  type: ActivityType;
  description: string;
  created_by: string;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}
export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: ClientStatus;
  assigned_to?: string;
}
export interface CreateDealInput {
  client_id: string;
  title: string;
  amount: number;
  stage: DealStage;
  probability: number;
  expected_close?: string;
  assigned_to?: string;
}
export interface CreateInvoiceInput {
  client_id: string;
  deal_id?: string;
  amount: number;
  due_date?: string;
}
export interface CreateActivityInput {
  client_id: string;
  type: ActivityType;
  description: string;
}
