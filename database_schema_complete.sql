-- =====================================================
-- WAOUH CORE - Complete ERP Schema
-- Multi-tenant SaaS with RLS
-- =====================================================
-- Drop existing objects (reset script)
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.get_user_company_id();
-- Drop policies
DROP POLICY IF EXISTS companies_select ON companies;
DROP POLICY IF EXISTS companies_update ON companies;
DROP POLICY IF EXISTS clients_select ON clients;
DROP POLICY IF EXISTS clients_insert ON clients;
DROP POLICY IF EXISTS clients_update ON clients;
DROP POLICY IF EXISTS clients_delete ON clients;
DROP POLICY IF EXISTS projects_select ON projects;
DROP POLICY IF EXISTS projects_insert ON projects;
DROP POLICY IF EXISTS projects_update ON projects;
DROP POLICY IF EXISTS projects_delete ON projects;
DROP POLICY IF EXISTS invoices_select ON invoices;
DROP POLICY IF EXISTS invoices_insert ON invoices;
DROP POLICY IF EXISTS invoices_update ON invoices;
DROP POLICY IF EXISTS invoices_delete ON invoices;
DROP POLICY IF EXISTS invoice_items_select ON invoice_items;
DROP POLICY IF EXISTS invoice_items_insert ON invoice_items;
DROP POLICY IF EXISTS invoice_items_update ON invoice_items;
DROP POLICY IF EXISTS invoice_items_delete ON invoice_items;
DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_insert ON tasks;
DROP POLICY IF EXISTS tasks_update ON tasks;
DROP POLICY IF EXISTS tasks_delete ON tasks;
DROP POLICY IF EXISTS notifications_select ON notifications;
DROP POLICY IF EXISTS notifications_insert ON notifications;
DROP POLICY IF EXISTS notifications_update ON notifications;
DROP POLICY IF EXISTS notifications_delete ON notifications;
DROP POLICY IF EXISTS timeline_select ON timeline_events;
DROP POLICY IF EXISTS timeline_insert ON timeline_events;
-- =====================================================
-- FUNCTIONS
-- =====================================================
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Get current user's company_id (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;
-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- CRITICAL: Disable RLS on users to avoid infinite recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Enable RLS on multi-tenant tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
-- Disable RLS on logs
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs DISABLE ROW LEVEL SECURITY;
-- =====================================================
-- RLS POLICIES
-- =====================================================
-- COMPANIES
CREATE POLICY companies_select ON companies
  FOR SELECT
  USING (id = public.get_user_company_id());
CREATE POLICY companies_update ON companies
  FOR UPDATE
  USING (
    id = public.get_user_company_id() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin_global', 'admin_company')
    )
  );
-- CLIENTS
CREATE POLICY clients_select ON clients
  FOR SELECT
  USING (company_id = public.get_user_company_id());
CREATE POLICY clients_insert ON clients
  FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY clients_update ON clients
  FOR UPDATE
  USING (company_id = public.get_user_company_id());
CREATE POLICY clients_delete ON clients
  FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin_global', 'admin_company')
    )
  );
-- PROJECTS
CREATE POLICY projects_select ON projects
  FOR SELECT
  USING (company_id = public.get_user_company_id());
CREATE POLICY projects_insert ON projects
  FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY projects_update ON projects
  FOR UPDATE
  USING (company_id = public.get_user_company_id());
CREATE POLICY projects_delete ON projects
  FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin_global', 'admin_company')
    )
  );
-- INVOICES
CREATE POLICY invoices_select ON invoices
  FOR SELECT
  USING (company_id = public.get_user_company_id());
CREATE POLICY invoices_insert ON invoices
  FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY invoices_update ON invoices
  FOR UPDATE
  USING (company_id = public.get_user_company_id());
CREATE POLICY invoices_delete ON invoices
  FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin_global', 'admin_company')
    )
  );
-- TASKS
CREATE POLICY tasks_select ON tasks
  FOR SELECT
  USING (company_id = public.get_user_company_id());
CREATE POLICY tasks_insert ON tasks
  FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY tasks_update ON tasks
  FOR UPDATE
  USING (company_id = public.get_user_company_id());
CREATE POLICY tasks_delete ON tasks
  FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin_global', 'admin_company')
    )
  );
-- NOTIFICATIONS
CREATE POLICY notifications_select ON notifications
  FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY notifications_insert ON notifications
  FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY notifications_update ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY notifications_delete ON notifications
  FOR DELETE
  USING (user_id = auth.uid());
-- TIMELINE_EVENTS
CREATE POLICY timeline_select ON timeline_events
  FOR SELECT
  USING (company_id = public.get_user_company_id());
CREATE POLICY timeline_insert ON timeline_events
  FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());
