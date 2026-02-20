-- =====================================================
-- WAOUH CONNECT - CRM Complet
-- =====================================================
-- Table deals (si n'existe pas)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  stage TEXT NOT NULL CHECK (stage IN ('nouveau','qualification','proposition','negociation','gagne','perdu')),
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close DATE,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Table activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('appel','email','rdv','note')),
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_client ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_activities_client ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_company ON activities(company_id);
-- RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- Policies deals
DROP POLICY IF EXISTS deals_select ON deals;
CREATE POLICY deals_select ON deals
  FOR SELECT
  USING (company_id = get_user_company_id());
DROP POLICY IF EXISTS deals_insert ON deals;
CREATE POLICY deals_insert ON deals
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id());
DROP POLICY IF EXISTS deals_update ON deals;
CREATE POLICY deals_update ON deals
  FOR UPDATE
  USING (company_id = get_user_company_id());
DROP POLICY IF EXISTS deals_delete ON deals;
CREATE POLICY deals_delete ON deals
  FOR DELETE
  USING (company_id = get_user_company_id());
-- Policies activities
DROP POLICY IF EXISTS activities_select ON activities;
CREATE POLICY activities_select ON activities
  FOR SELECT
  USING (company_id = get_user_company_id());
DROP POLICY IF EXISTS activities_insert ON activities;
CREATE POLICY activities_insert ON activities
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id());
-- Triggers
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
