-- Supabase Database Schema for Signova v6.0 (Idempotent - safe to run multiple times)

-- ==============================
-- contracts table
-- ==============================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID,
  name TEXT NOT NULL,
  type TEXT,
  -- Parties
  party_a TEXT,
  party_b TEXT,
  -- Financials
  amount TEXT,
  currency TEXT DEFAULT 'USD',
  -- Dates
  effective_date DATE,
  expiry_date DATE,
  -- Content
  summary TEXT,
  extracted_text TEXT,
  file_url TEXT,
  governing_law TEXT,
  -- Status / analysis
  status TEXT DEFAULT 'active',
  risk_score INTEGER,
  analysis_result JSONB,
  is_scanned BOOLEAN DEFAULT false,
  -- Reminder tracking
  reminder_90_sent BOOLEAN DEFAULT false,
  reminder_30_sent BOOLEAN DEFAULT false,
  reminder_7_sent BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add missing columns to existing contracts table (safe to run even if columns exist)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS amount TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS party_a TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS party_b TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS governing_law TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reminder_90_sent BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reminder_30_sent BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reminder_7_sent BOOLEAN DEFAULT false;

-- ==============================
-- profiles table
-- ==============================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  country TEXT,
  preferred_language TEXT DEFAULT 'EN',
  contract_types TEXT[],
  onboarding_complete BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'free',
  analyses_used INTEGER DEFAULT 0,
  analyses_reset_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS analyses_used INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS analyses_reset_date DATE;

-- ==============================
-- workspaces table
-- ==============================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================
-- workspace_members table
-- ==============================
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  invited_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(workspace_id, user_id)
);

-- ==============================
-- terminal_chats table (optional, for persistence)
-- ==============================
CREATE TABLE IF NOT EXISTS terminal_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB DEFAULT '[]',
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================
-- Row Level Security
-- ==============================
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_chats ENABLE ROW LEVEL SECURITY;

-- Contracts policies
DROP POLICY IF EXISTS "Users can view own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can insert own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON contracts;
DROP POLICY IF EXISTS "personal_contracts" ON contracts;
DROP POLICY IF EXISTS "workspace_contracts" ON contracts;
DROP POLICY IF EXISTS "delete_contracts" ON contracts;
DROP POLICY IF EXISTS "insert_contracts" ON contracts;
DROP POLICY IF EXISTS "update_contracts" ON contracts;

-- Users can see personal contracts
CREATE POLICY "personal_contracts" ON contracts
  FOR SELECT USING (user_id = auth.uid());

-- Users can see workspace contracts if they are a member
CREATE POLICY "workspace_contracts" ON contracts
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert contracts for themselves or their workspaces
CREATE POLICY "insert_contracts" ON contracts
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can update contracts if personal or in workspace
CREATE POLICY "update_contracts" ON contracts
  FOR UPDATE USING (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Only uploader or workspace admin/owner can delete
CREATE POLICY "delete_contracts" ON contracts
  FOR DELETE USING (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Workspaces policies
DROP POLICY IF EXISTS "Users can view own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Owners can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Owners can delete workspaces" ON workspaces;

CREATE POLICY "Users can view own workspaces" ON workspaces
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update workspaces" ON workspaces
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete workspaces" ON workspaces
  FOR DELETE USING (auth.uid() = owner_id);

-- Workspace members policies
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;

CREATE POLICY "Users can view workspace members" ON workspace_members
  FOR SELECT USING (auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()));
CREATE POLICY "Workspace owners can manage members" ON workspace_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- Terminal chats policies
DROP POLICY IF EXISTS "Users can view own chats" ON terminal_chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON terminal_chats;
DROP POLICY IF EXISTS "Users can update own chats" ON terminal_chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON terminal_chats;

CREATE POLICY "Users can view own chats" ON terminal_chats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON terminal_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chats" ON terminal_chats
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON terminal_chats
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================
-- Functions & Triggers
-- ==============================
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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================
-- Permissions
-- ==============================
GRANT ALL ON contracts TO authenticated;
GRANT ALL ON contracts TO service_role;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON workspaces TO authenticated;
GRANT ALL ON workspaces TO service_role;
GRANT ALL ON workspace_members TO authenticated;
GRANT ALL ON workspace_members TO service_role;
GRANT ALL ON terminal_chats TO authenticated;
GRANT ALL ON terminal_chats TO service_role;

-- ==============================
-- Set first user (cs1005.91@gmail.com) to Business plan
-- ==============================
UPDATE profiles
SET plan = 'business'
WHERE email = 'cs1005.91@gmail.com';

-- Enable pgvector extension
create extension if not exists vector;

-- Conversation History Table
create table if not exists public.conversation_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  contract_id uuid references public.contracts,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for conversation_history
alter table public.conversation_history enable row level security;
create policy "Users can view own conversation history" on public.conversation_history
  for select using (auth.uid() = user_id);
create policy "Users can insert own conversation history" on public.conversation_history
  for insert with check (auth.uid() = user_id);

-- Contract Embeddings Table (Vector Search)
create table if not exists public.contract_embeddings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  contract_id uuid references public.contracts not null,
  embedding vector(1536),
  content_summary text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for contract_embeddings
alter table public.contract_embeddings enable row level security;
create policy "Users can view own contract embeddings" on public.contract_embeddings
  for select using (auth.uid() = user_id);
create policy "Users can insert own contract embeddings" on public.contract_embeddings
  for insert with check (auth.uid() = user_id);

