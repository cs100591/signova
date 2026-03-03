-- Signova Party Selection & Onboarding v1.0
-- Adds company_size, analysis_style to profiles
-- Adds selected_party, party_a_name, party_b_name to contract_analyses

-- profiles: company size
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_size text
  CHECK (company_size IN ('individual', 'small_business', 'sme', 'enterprise'));

-- profiles: analysis style (default balanced)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS analysis_style text DEFAULT 'balanced'
  CHECK (analysis_style IN ('flag_everything', 'balanced', 'dealbreakers_only'));

-- contract_analyses: party selection fields
ALTER TABLE contract_analyses
  ADD COLUMN IF NOT EXISTS selected_party text,
  ADD COLUMN IF NOT EXISTS party_a_name text,
  ADD COLUMN IF NOT EXISTS party_b_name text;

COMMENT ON COLUMN profiles.company_size IS
  'individual | small_business | sme | enterprise';

COMMENT ON COLUMN profiles.analysis_style IS
  'flag_everything | balanced | dealbreakers_only — controls AI severity filter';

COMMENT ON COLUMN contract_analyses.selected_party IS
  'party_a | party_b | reviewing | unsure — which side the user is on';
