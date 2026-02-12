-- Drop all versions of bootstrap_household function
DROP FUNCTION IF EXISTS bootstrap_household(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS bootstrap_household(TEXT, TEXT, TEXT, TEXT);

-- Recreate bootstrap_household with child_name parameter
CREATE OR REPLACE FUNCTION bootstrap_household(
  p_name TEXT DEFAULT NULL,
  p_my_display_name TEXT DEFAULT 'Meg',
  p_partner_display_name TEXT DEFAULT NULL,
  p_child_name TEXT DEFAULT 'Barn'
)
RETURNS TABLE(household_id UUID, child_id UUID, invite_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_child_id UUID;
  v_invite_code TEXT;
  v_user_id UUID;
  v_member_id UUID;
  v_partner_member_id UUID;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate unique invite code
  v_invite_code := generate_invite_code();

  -- Create household with invite code
  INSERT INTO households (name, created_by, invite_code)
  VALUES (COALESCE(p_name, 'Min husholdning'), v_user_id, v_invite_code)
  RETURNING id INTO v_household_id;

  -- Add the creator as an admin member
  INSERT INTO household_members (household_id, user_id, display_name, role)
  VALUES (v_household_id, v_user_id, p_my_display_name, 'admin')
  RETURNING id INTO v_member_id;

  -- Add partner as placeholder member if provided
  IF p_partner_display_name IS NOT NULL AND p_partner_display_name != '' THEN
    INSERT INTO household_members (household_id, user_id, display_name, role)
    VALUES (v_household_id, NULL, p_partner_display_name, 'member')
    RETURNING id INTO v_partner_member_id;
  END IF;

  -- Create a child with the provided name
  INSERT INTO children (household_id, name)
  VALUES (v_household_id, p_child_name)
  RETURNING id INTO v_child_id;

  -- Return the IDs and invite code
  RETURN QUERY SELECT v_household_id, v_child_id, v_invite_code;
END;
$$;
