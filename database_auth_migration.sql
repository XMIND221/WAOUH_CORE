-- =====================================================
-- WAOUH CONNECT - Auth & RBAC Migration
-- =====================================================
-- Ajouter colonnes manquantes dans users
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
-- Modifier la contrainte de rôle
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN (
    'super_admin',
    'directeur_general',
    'responsable_commercial',
    'designer',
    'comptabilite',
    'rh',
    'developpeur',
    'employe'
  )
);
-- Index de performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
-- Créer l'entreprise WAOUH CONNECT
INSERT INTO companies (id, name, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'WAOUH CONNECT',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
-- Afficher l'ID de l'entreprise créée
SELECT id, name FROM companies WHERE name = 'WAOUH CONNECT';
-- INSTRUCTIONS POUR CRÉER LES UTILISATEURS:
-- 
-- 1. Récupérer l'ID de l'entreprise ci-dessus
-- 2. Aller dans Supabase Dashboard > Authentication > Users
-- 3. Créer les utilisateurs:
--    - Email: momo@waouh.com | Password: InitialPassword123!
--    - Email: elhadj@waouh.com | Password: InitialPassword123!
-- 4. Récupérer l'UUID de chaque utilisateur créé
-- 5. Insérer dans la table users:
/*
INSERT INTO users (id, email, company_id, role, is_active, must_change_password, first_name, last_name)
VALUES 
  ('UUID_DE_MOMO', 'momo@waouh.com', 'UUID_DE_LA_COMPANY', 'super_admin', true, true, 'Momo', 'Ndiaye'),
  ('UUID_DE_ELHADJ', 'elhadj@waouh.com', 'UUID_DE_LA_COMPANY', 'directeur_general', true, true, 'Elhadj Mamadou', 'Ndiaye');
*/
