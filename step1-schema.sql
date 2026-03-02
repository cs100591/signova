-- 1. Update workspace_members
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Fix constraints if role isn't restricted
-- ALTER TABLE workspace_members ADD CONSTRAINT role_check CHECK (role IN ('owner','admin','member'));
-- We might not need strict check if the UI handles it, but let's add it if we can safely, or just assume UI restricts.

-- 2. Create workspace_invitations table
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. RLS Policies on Contracts
-- Drop existing first to prevent conflicts
DROP POLICY IF EXISTS "view_personal_contracts" ON contracts;
DROP POLICY IF EXISTS "view_workspace_contracts" ON contracts;
DROP POLICY IF EXISTS "delete_contracts" ON contracts;
DROP POLICY IF EXISTS "update_contract_workspace" ON contracts;

-- Create policies based on instructions
CREATE POLICY "view_personal_contracts"
ON contracts FOR SELECT
USING (
  user_id = auth.uid()
  AND workspace_id IS NULL
);

CREATE POLICY "view_workspace_contracts"
ON contracts FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "delete_contracts"
ON contracts FOR DELETE
USING (
  user_id = auth.uid()
  OR workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "update_contract_workspace"
ON contracts FOR UPDATE
USING (user_id = auth.uid());

-- Reload schema for PostgREST
NOTIFY pgrst, 'reload schema';
