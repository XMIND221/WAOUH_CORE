CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT "sales",
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT "sales",
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT "planning",
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT "todo",
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE crm_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT "lead",
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  number TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT "draft",
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  event TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON crm_clients
FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'admin_global' FROM users WHERE id = auth.uid()), false);
$$;
CREATE OR REPLACE FUNCTION has_company_access(cid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin()
  OR EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.company_id = cid);
$$;
CREATE POLICY "companies_read" ON companies FOR SELECT
USING (has_company_access(id));
CREATE POLICY "users_read" ON users FOR SELECT
USING (id = auth.uid() OR is_admin());
CREATE POLICY "memberships_read" ON memberships FOR SELECT
USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "projects_rw" ON projects FOR ALL
USING (has_company_access(company_id))
WITH CHECK (has_company_access(company_id));
CREATE POLICY "tasks_rw" ON tasks FOR ALL
USING (has_company_access(company_id))
WITH CHECK (has_company_access(company_id));
CREATE POLICY "clients_rw" ON crm_clients FOR ALL
USING (has_company_access(company_id))
WITH CHECK (has_company_access(company_id));
CREATE POLICY "invoices_rw" ON invoices FOR ALL
USING (has_company_access(company_id))
WITH CHECK (has_company_access(company_id));
CREATE POLICY "audit_read" ON audit_logs FOR SELECT
USING (has_company_access(company_id));
CREATE POLICY "notifications_rw" ON notifications FOR ALL
USING (has_company_access(company_id))
WITH CHECK (has_company_access(company_id));
CREATE POLICY "security_read" ON security_logs FOR SELECT
USING (has_company_access(company_id));
INSERT INTO companies (name, slug) VALUES ('WAOUH AGENCE', 'waouh-agence');
