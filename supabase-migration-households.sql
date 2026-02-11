-- =============================================================
-- Migration: RLS policies for the multi-tenant household schema
-- Run this in the Supabase SQL Editor.
--
-- Safe to re-run: drops old policies first, then re-creates.
-- =============================================================

-- 0a. Ensure created_by defaults to the logged-in user
ALTER TABLE public.households
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 0b. Drop FK on schedule_assignments.assigned_user_id → auth.users
--     We now allow assigning placeholder members (partner without account).
ALTER TABLE public.schedule_assignments
  DROP CONSTRAINT IF EXISTS schedule_assignments_assigned_user_id_fkey;

-- 0c. Restructure household_members primary key
--     The original PK includes user_id, but we need nullable user_id
--     for placeholder partner members who haven't signed up yet.

-- Add surrogate id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'household_members'
      AND column_name = 'id'
  ) THEN
    ALTER TABLE public.household_members
      ADD COLUMN id uuid DEFAULT gen_random_uuid() NOT NULL;
  END IF;
END $$;

-- Drop old PK and FK, create new PK, allow NULL user_id
DO $$
BEGIN
  -- Drop the old PK (may fail if already changed – that's OK)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'household_members_pkey'
      AND conrelid = 'public.household_members'::regclass
      AND (
        SELECT array_agg(a.attname ORDER BY x.n)
        FROM unnest(conkey) WITH ORDINALITY AS x(v, n)
        JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = x.v
      ) <> ARRAY['id']::name[]
  ) THEN
    ALTER TABLE public.household_members DROP CONSTRAINT household_members_pkey;
    ALTER TABLE public.household_members ADD PRIMARY KEY (id);
  END IF;

  -- Allow NULL user_id
  ALTER TABLE public.household_members ALTER COLUMN user_id DROP NOT NULL;

  -- Drop the FK temporarily so we can have NULL user_id rows
  -- Then re-add it but allow NULL
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'household_members_user_id_fkey'
      AND conrelid = 'public.household_members'::regclass
  ) THEN
    ALTER TABLE public.household_members DROP CONSTRAINT household_members_user_id_fkey;
  END IF;

  -- Re-add FK that allows NULL (NULL values are simply ignored by FK checks)
  ALTER TABLE public.household_members
    ADD CONSTRAINT household_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
END $$;

-- Unique index to prevent duplicate memberships for actual users
CREATE UNIQUE INDEX IF NOT EXISTS household_members_hh_user_unique
  ON public.household_members (household_id, user_id)
  WHERE user_id IS NOT NULL;

-- =============================================================
-- Helper: returns household_ids for the current user.
-- Used by children / schedule_assignments policies.
-- SECURITY DEFINER + plpgsql so it bypasses RLS and is not inlined.
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_my_household_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT household_id FROM household_members WHERE user_id = auth.uid();
END;
$$;

-- =============================================================
-- RPC: bootstrap_household
-- Creates household + members + default child in one transaction.
-- SECURITY DEFINER so it bypasses RLS.
-- =============================================================
CREATE OR REPLACE FUNCTION public.bootstrap_household(
  p_name text DEFAULT 'Min husstand',
  p_my_display_name text DEFAULT NULL,
  p_partner_display_name text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
  v_child_id uuid;
  v_old_hh_ids uuid[];
BEGIN
  -- 0. Clean up any leftover data from previous attempts
  SELECT array_agg(id) INTO v_old_hh_ids
    FROM households WHERE created_by = auth.uid();

  IF v_old_hh_ids IS NOT NULL THEN
    DELETE FROM schedule_assignments WHERE household_id = ANY(v_old_hh_ids);
    DELETE FROM children              WHERE household_id = ANY(v_old_hh_ids);
    DELETE FROM household_members     WHERE household_id = ANY(v_old_hh_ids);
    DELETE FROM households            WHERE id = ANY(v_old_hh_ids);
  END IF;

  -- Also remove any orphaned membership rows for this user
  DELETE FROM household_members WHERE user_id = auth.uid();

  -- 1. Create household
  INSERT INTO households (name, created_by)
  VALUES (COALESCE(NULLIF(p_name, ''), 'Min husstand'), auth.uid())
  RETURNING id INTO v_household_id;

  -- 2. Create member for current user
  --    If a trigger auto-created a row, update it instead
  IF EXISTS (SELECT 1 FROM household_members WHERE household_id = v_household_id AND user_id = auth.uid()) THEN
    UPDATE household_members
    SET display_name = p_my_display_name, role = 'admin'
    WHERE household_id = v_household_id AND user_id = auth.uid();
  ELSE
    INSERT INTO household_members (household_id, user_id, display_name, role)
    VALUES (v_household_id, auth.uid(), p_my_display_name, 'admin');
  END IF;

  -- 3. Optionally create placeholder member for partner (user_id = NULL)
  IF p_partner_display_name IS NOT NULL AND p_partner_display_name != '' THEN
    INSERT INTO household_members (household_id, user_id, display_name, role)
    VALUES (v_household_id, NULL, p_partner_display_name, 'member');
  END IF;

  -- 4. Create default child
  INSERT INTO children (household_id, name)
  VALUES (v_household_id, 'Barn')
  RETURNING id INTO v_child_id;

  RETURN json_build_object(
    'household_id', v_household_id,
    'child_id', v_child_id
  );
END;
$$;

-- =============================================================
-- Drop all previous policies (safe if they don't exist)
-- =============================================================
DROP POLICY IF EXISTS "households_insert"            ON public.households;
DROP POLICY IF EXISTS "households_select"             ON public.households;
DROP POLICY IF EXISTS "household_members_select"      ON public.household_members;
DROP POLICY IF EXISTS "household_members_insert"      ON public.household_members;
DROP POLICY IF EXISTS "children_select"               ON public.children;
DROP POLICY IF EXISTS "children_insert"               ON public.children;
DROP POLICY IF EXISTS "schedule_assignments_select"   ON public.schedule_assignments;
DROP POLICY IF EXISTS "schedule_assignments_insert"   ON public.schedule_assignments;
DROP POLICY IF EXISTS "schedule_assignments_update"   ON public.schedule_assignments;
DROP POLICY IF EXISTS "schedule_assignments_delete"   ON public.schedule_assignments;

-- =============================================================
-- 1. households
-- =============================================================
CREATE POLICY "households_insert"
  ON public.households FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "households_select"
  ON public.households FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (SELECT get_my_household_ids())
  );

-- =============================================================
-- 2. household_members
--    SELECT is open to all authenticated users (avoids recursion).
--    INSERT is restricted to adding yourself to a household you created.
-- =============================================================
CREATE POLICY "household_members_select"
  ON public.household_members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "household_members_insert"
  ON public.household_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.households
      WHERE id = household_id AND created_by = auth.uid()
    )
  );

-- =============================================================
-- 3. children
-- =============================================================
CREATE POLICY "children_select"
  ON public.children FOR SELECT TO authenticated
  USING (
    household_id IN (SELECT get_my_household_ids())
  );

CREATE POLICY "children_insert"
  ON public.children FOR INSERT TO authenticated
  WITH CHECK (
    household_id IN (SELECT get_my_household_ids())
  );

-- =============================================================
-- 4. schedule_assignments
-- =============================================================
CREATE POLICY "schedule_assignments_select"
  ON public.schedule_assignments FOR SELECT TO authenticated
  USING (
    household_id IN (SELECT get_my_household_ids())
  );

CREATE POLICY "schedule_assignments_insert"
  ON public.schedule_assignments FOR INSERT TO authenticated
  WITH CHECK (
    household_id IN (SELECT get_my_household_ids())
  );

CREATE POLICY "schedule_assignments_update"
  ON public.schedule_assignments FOR UPDATE TO authenticated
  USING (
    household_id IN (SELECT get_my_household_ids())
  )
  WITH CHECK (
    household_id IN (SELECT get_my_household_ids())
  );

CREATE POLICY "schedule_assignments_delete"
  ON public.schedule_assignments FOR DELETE TO authenticated
  USING (
    household_id IN (SELECT get_my_household_ids())
  );
