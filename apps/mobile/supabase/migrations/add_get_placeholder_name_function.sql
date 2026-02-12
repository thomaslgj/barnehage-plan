-- Function to get placeholder display name for an invite code
-- This allows the joining user to see what name was set for them
CREATE OR REPLACE FUNCTION get_placeholder_name_for_invite(
  p_invite_code TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_placeholder_name TEXT;
BEGIN
  -- Find household by invite code
  SELECT h.id INTO v_household_id
  FROM households h
  WHERE h.invite_code = p_invite_code;

  IF v_household_id IS NULL THEN
    RETURN NULL; -- Invalid invite code
  END IF;

  -- Check if there's a placeholder member (user_id IS NULL)
  SELECT hm.display_name INTO v_placeholder_name
  FROM household_members hm
  WHERE hm.household_id = v_household_id
  AND hm.user_id IS NULL
  LIMIT 1;

  -- Return the placeholder name (or NULL if none exists)
  RETURN v_placeholder_name;
END;
$$;
