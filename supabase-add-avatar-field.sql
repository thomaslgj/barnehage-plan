-- Add avatar_id field to household_members table
ALTER TABLE household_members
ADD COLUMN IF NOT EXISTS avatar_id TEXT;

-- Add a comment to document the field
COMMENT ON COLUMN household_members.avatar_id IS 'Avatar ID (1-9) for the member profile picture';
