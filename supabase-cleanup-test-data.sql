-- =============================================================
-- CLEANUP: Remove test households so you can re-onboard.
-- Run this in the Supabase SQL Editor.
--
-- Replace 'din@epost.no' with the email you signed up with.
-- =============================================================

DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'din@epost.no';

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Fant ikke bruker med den e-posten';
  END IF;

  -- Delete in dependency order
  DELETE FROM schedule_assignments
    WHERE household_id IN (SELECT id FROM households WHERE created_by = v_uid);

  DELETE FROM children
    WHERE household_id IN (SELECT id FROM households WHERE created_by = v_uid);

  DELETE FROM household_members
    WHERE household_id IN (SELECT id FROM households WHERE created_by = v_uid);

  DELETE FROM households
    WHERE created_by = v_uid;

  RAISE NOTICE 'Ryddet opp for bruker %', v_uid;
END;
$$;

