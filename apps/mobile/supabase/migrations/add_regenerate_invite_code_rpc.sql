-- Function to regenerate invite code for an existing household
-- This is useful when old households don't have an invite code yet
CREATE OR REPLACE FUNCTION regenerate_household_invite_code(
  p_household_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite_code TEXT;
  v_user_id UUID;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is a member of this household
  IF NOT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id
    AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this household';
  END IF;

  -- Generate a new unique invite code
  v_invite_code := generate_invite_code();

  -- Update the household with the new invite code
  UPDATE households
  SET invite_code = v_invite_code
  WHERE id = p_household_id;

  -- Return the new invite code
  RETURN v_invite_code;
END;
$$;
