-- Script SQL pour créer toutes les tables nécessaires dans Supabase
-- Table timeline_events
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_timeline_events_company ON timeline_events(company_id);
CREATE INDEX idx_timeline_events_created_at ON timeline_events(created_at DESC);
-- Table security_logs
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'failed_login', 'password_change', 'pin_change', 'unauthorized_access')),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_security_logs_company ON security_logs(company_id);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);
-- Table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'invoice', 'message', 'user', 'settings', 'other')),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
-- Table invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue')) DEFAULT 'draft',
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
-- Storage bucket pour les pièces jointes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;
-- Row Level Security (RLS) Policies
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- Policies pour timeline_events
CREATE POLICY "Users can view timeline events of their company"
  ON timeline_events FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert timeline events for their company"
  ON timeline_events FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));
-- Policies pour security_logs
CREATE POLICY "Admins can view all security logs"
  ON security_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND company_id = security_logs.company_id 
      AND role = 'admin'
    )
  );
CREATE POLICY "System can insert security logs"
  ON security_logs FOR INSERT
  WITH CHECK (true);
-- Policies pour audit_logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND company_id = audit_logs.company_id 
      AND role = 'admin'
    )
  );
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
-- Policies pour invoices
CREATE POLICY "Users can view invoices of their company"
  ON invoices FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Admins and managers can manage invoices"
  ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND company_id = invoices.company_id 
      AND role IN ('admin', 'manager')
    )
  );
-- Storage policy pour message-attachments
CREATE POLICY "Users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'message-attachments' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments' AND auth.uid() IS NOT NULL);