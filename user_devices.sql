CREATE TABLE IF NOT EXISTS user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  push_token text not null,
  platform text not null,
  created_at timestamptz default now(),
  UNIQUE(user_id, push_token)
);
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_devices_select ON user_devices
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_devices_insert ON user_devices
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_devices_delete ON user_devices
  FOR DELETE USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_company ON user_devices(company_id);
