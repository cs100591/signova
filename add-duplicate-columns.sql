-- Add columns to support duplicate detection and contract versioning
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS contract_group_id UUID,
ADD COLUMN IF NOT EXISTS parent_contract_id UUID,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- Refresh PostgREST schema cache so the API can immediately see the new columns
NOTIFY pgrst, 'reload schema';
