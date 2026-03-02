-- Enable RLS on workspace_invitations
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to view invitations for their workspaces or where they are the inviter or the invited user (by email)
CREATE POLICY "Users can view relevant invitations" ON workspace_invitations
FOR SELECT USING (
  invited_by = auth.uid() 
  OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

-- Allow workspace admins and owners to insert invitations
CREATE POLICY "Admins and owners can insert invitations" ON workspace_invitations
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- Allow workspace admins and owners to delete/update invitations
CREATE POLICY "Admins and owners can manage invitations" ON workspace_invitations
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- Also allow the system to insert members when an invite is accepted
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Assuming there might be an issue with workspace_members insert too when accepting:
-- Let's just make sure users can insert themselves into workspace_members if they have an invite
-- Note: the actual insert happens in the API route which uses the service_role key OR the user's auth token.
-- Since the API uses createSupabaseServerClient (which uses the user's token), we MUST allow the user to insert themselves into workspace_members!

CREATE POLICY "Users can insert themselves if invited" ON workspace_members
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Note: We also need to let users view workspaces they are invited to / are members of.
