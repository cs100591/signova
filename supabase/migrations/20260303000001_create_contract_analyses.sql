-- Signova AI Engine v1.0
-- Layer 2 breakdown and Layer 4 narrative are stored here.
-- This table is separate from the existing contracts table.

CREATE TABLE IF NOT EXISTS contract_analyses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Layer 1: Structured clause extraction
  extracted_data jsonb,

  -- Layer 2: Rule engine output
  risk_score integer,
  risk_level text CHECK (risk_level IN ('SAFE', 'NEGOTIATE', 'HIGH RISK')),
  rule_version text DEFAULT 'v1.0',
  breakdown jsonb,

  -- Layer 3: Context modifier output
  context_modifiers jsonb DEFAULT '[]'::jsonb,

  -- Layer 4: Narrative
  narrative jsonb,

  analyzed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Index for fast lookup by contract
CREATE INDEX IF NOT EXISTS idx_contract_analyses_contract_id
  ON contract_analyses(contract_id);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_contract_analyses_user_id
  ON contract_analyses(user_id);

-- RLS: Users can only see their own analyses
ALTER TABLE contract_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON contract_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON contract_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Optional: Add annual_revenue_range to profiles for Layer 3 context
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS annual_revenue_range text;

COMMENT ON COLUMN profiles.annual_revenue_range IS
  'Optional — used by Layer 3 context modifier for liability ratio check. Values: < RM500K | RM500K-2M | RM2M-10M | > RM10M | Prefer not to say';
