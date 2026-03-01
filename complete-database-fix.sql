-- COMPLETE DATABASE FIX - Run this in Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/zbslohpnealxxpfeylal/sql/new

-- ── 1. Fix profiles table (if columns missing) ────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS analyses_used INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS analyses_reset_date TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'EN';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contract_types TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- ── 2. Fix workspaces table ──────────────────────────────────────────────
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- ── 3. Fix workspace_members table ───────────────────────────────────────
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- ── 4. Fix contracts table (ensure all columns exist) ────────────────────
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE IF EXISTS contracts DROP COLUMN IF EXISTS title; -- Remove if exists (we use 'name')
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
ALTER TABLE IF EXISTS contracts DROP COLUMN IF EXISTS contract_value; -- Remove if exists (we use 'amount')
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS party_a TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS party_b TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS governing_law TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS risk_score INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS analysis_result JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_scanned BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reminder_90_sent BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reminder_30_sent BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reminder_7_sent BOOLEAN DEFAULT false;

-- ── 5. RLS Policies for profiles ─────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ── 6. RLS Policies for contracts ────────────────────────────────────────
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can insert own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON contracts;
CREATE POLICY "Users can view own contracts" ON contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contracts" ON contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contracts" ON contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contracts" ON contracts FOR DELETE USING (auth.uid() = user_id);

-- ── 7. RLS Policies for workspaces ───────────────────────────────────────
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can update own workspaces" ON workspaces;
CREATE POLICY "Users can view workspaces" ON workspaces FOR SELECT USING (true);
CREATE POLICY "Users can create workspaces" ON workspaces FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own workspaces" ON workspaces FOR UPDATE USING (auth.uid() = owner_id);

-- ── 8. RLS Policies for workspace_members ────────────────────────────────
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can add workspace members" ON workspace_members;
CREATE POLICY "Users can view workspace members" ON workspace_members FOR SELECT USING (true);
CREATE POLICY "Users can add workspace members" ON workspace_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 9. Auto-create profile on signup ─────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, plan)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 10. Set Business plan for your account ───────────────────────────────
UPDATE profiles SET plan = 'business' WHERE email = 'cs1005.91@gmail.com';

-- ── 11. Verify everything ────────────────────────────────────────────────
SELECT 'Profile columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;

SELECT 'Contract columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'contracts' ORDER BY ordinal_position;

SELECT 'Workspace columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'workspaces' ORDER BY ordinal_position;

SELECT 'Your profile:' as info;
SELECT email, plan, analyses_used FROM profiles WHERE email = 'cs1005.91@gmail.com';
