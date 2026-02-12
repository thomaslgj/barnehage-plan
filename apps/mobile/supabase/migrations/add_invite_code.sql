-- Add invite_code column to households table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'invite_code'
  ) THEN
    ALTER TABLE households ADD COLUMN invite_code TEXT UNIQUE;
  END IF;
END $$;

-- Create index for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code);

-- Word list for generating invite codes (Norwegian words)
CREATE TABLE IF NOT EXISTS invite_words (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE
);

-- Insert Norwegian words for invite codes (simple, easy to remember words)
INSERT INTO invite_words (word) VALUES
  ('eple'), ('pære'), ('banan'), ('appelsin'), ('drue'),
  ('jordbær'), ('bringebær'), ('blåbær'), ('melon'), ('kiwi'),
  ('sol'), ('måne'), ('stjerne'), ('sky'), ('regn'),
  ('snø'), ('vind'), ('torden'), ('lyn'), ('regnbue'),
  ('hund'), ('katt'), ('hest'), ('ku'), ('gris'),
  ('sau'), ('kylling'), ('and'), ('fisk'), ('kanin'),
  ('bjørn'), ('ulv'), ('rev'), ('elg'), ('rein'),
  ('blå'), ('rød'), ('grønn'), ('gul'), ('rosa'),
  ('lilla'), ('oransje'), ('hvit'), ('svart'), ('brun'),
  ('hus'), ('bil'), ('sykkel'), ('båt'), ('fly'),
  ('tog'), ('buss'), ('blomst'), ('tre'), ('skog'),
  ('fjell'), ('hav'), ('strand'), ('vann'), ('elv'),
  ('dag'), ('natt'), ('morgen'), ('kveld'), ('vår'),
  ('sommer'), ('høst'), ('vinter'), ('glad'), ('sterk'),
  ('rask'), ('snill'), ('stor'), ('liten'), ('lang'),
  ('kort'), ('ny'), ('gammel'), ('ung'), ('fin'),
  ('pen'), ('god'), ('deilig'), ('koselig'), ('hyggelig'),
  ('ball'), ('leke'), ('bok'), ('penn'), ('papir'),
  ('bord'), ('stol'), ('sofa'), ('seng'), ('vindu'),
  ('dør'), ('vegg'), ('tak'), ('gulv'), ('lampe')
ON CONFLICT (word) DO NOTHING;

-- Function to generate a unique two-word invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  word1 TEXT;
  word2 TEXT;
  code TEXT;
  max_attempts INT := 100;
  attempt INT := 0;
BEGIN
  LOOP
    -- Select two random words
    SELECT word INTO word1 FROM invite_words ORDER BY RANDOM() LIMIT 1;
    SELECT word INTO word2 FROM invite_words ORDER BY RANDOM() LIMIT 1;

    -- Combine them with a dash
    code := word1 || '-' || word2;

    -- Check if this code already exists
    IF NOT EXISTS (SELECT 1 FROM households WHERE invite_code = code) THEN
      RETURN code;
    END IF;

    -- Prevent infinite loop
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique invite code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- Drop existing function first (needed to change return type and signature)
DROP FUNCTION IF EXISTS bootstrap_household(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS bootstrap_household(TEXT, TEXT, TEXT, TEXT);

-- Create new bootstrap_household function to generate and return invite code
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

-- Drop existing function first (needed to change signature)
DROP FUNCTION IF EXISTS accept_household_invite(TEXT, TEXT);

-- Create new accept_household_invite to accept word-based invite code
CREATE OR REPLACE FUNCTION accept_household_invite(
  invite_code TEXT,
  display_name TEXT DEFAULT NULL
)
RETURNS TABLE(household_id UUID, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_user_id UUID;
  v_placeholder_member_id UUID;
  v_display_name TEXT;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find household by invite code
  SELECT h.id INTO v_household_id
  FROM households h
  WHERE h.invite_code = accept_household_invite.invite_code;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM household_members
    WHERE household_members.household_id = v_household_id
    AND household_members.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this household';
  END IF;

  -- Check if there's a placeholder member (user_id IS NULL) we should replace
  SELECT id INTO v_placeholder_member_id
  FROM household_members
  WHERE household_members.household_id = v_household_id
  AND household_members.user_id IS NULL
  LIMIT 1;

  -- Use provided display name or get from placeholder
  IF display_name IS NOT NULL AND display_name != '' THEN
    v_display_name := display_name;
  ELSIF v_placeholder_member_id IS NOT NULL THEN
    SELECT hm.display_name INTO v_display_name
    FROM household_members hm
    WHERE hm.id = v_placeholder_member_id;
  ELSE
    v_display_name := 'Partner';
  END IF;

  -- If placeholder exists, update it with real user_id
  IF v_placeholder_member_id IS NOT NULL THEN
    UPDATE household_members
    SET user_id = v_user_id,
        display_name = v_display_name
    WHERE id = v_placeholder_member_id;
  ELSE
    -- Otherwise, create new member
    INSERT INTO household_members (household_id, user_id, display_name, role)
    VALUES (v_household_id, v_user_id, v_display_name, 'member');
  END IF;

  -- Return the household_id and user_id
  RETURN QUERY SELECT v_household_id, v_user_id;
END;
$$;
