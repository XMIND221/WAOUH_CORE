-- =====================================================
-- WAOUH CONNECT - Optimisation Index & Sécurité
-- =====================================================
-- Ajouter colonnes audit_logs si manquantes
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
-- Index pour audit_logs (performance)
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_action ON audit_logs(company_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
-- Index pour timeline_events
CREATE INDEX IF NOT EXISTS idx_timeline_company_created ON timeline_events(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_user ON timeline_events(user_id);
-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
-- Index pour security_logs
CREATE INDEX IF NOT EXISTS idx_security_logs_company ON security_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event ON security_logs(event);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs(created_at DESC);
-- Optimisation clients
CREATE INDEX IF NOT EXISTS idx_clients_company_status ON clients(company_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_clients_assigned ON clients(assigned_to) WHERE is_deleted = false;
-- Optimisation deals
CREATE INDEX IF NOT EXISTS idx_deals_company_stage ON deals(company_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_assigned ON deals(assigned_to);
-- Optimisation tasks
CREATE INDEX IF NOT EXISTS idx_tasks_company_status ON tasks(company_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline) WHERE status IN ('todo', 'in_progress');
-- Optimisation invoices
CREATE INDEX IF NOT EXISTS idx_invoices_company_status ON invoices(company_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
