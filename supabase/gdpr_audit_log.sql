-- GDPR Request Audit Log
-- Tracks all data subject requests for compliance

-- Create enum for request types
CREATE TYPE gdpr_request_type AS ENUM (
  'access',      -- Right to access (Article 15)
  'rectification', -- Right to rectification (Article 16)
  'erasure',     -- Right to erasure / "Right to be forgotten" (Article 17)
  'restriction', -- Right to restriction of processing (Article 18)
  'portability', -- Right to data portability (Article 20)
  'objection'    -- Right to object (Article 21)
);

-- Create enum for request status
CREATE TYPE gdpr_request_status AS ENUM (
  'pending',     -- Request received, not yet processed
  'in_progress', -- Request is being processed
  'completed',   -- Request fulfilled
  'rejected',    -- Request rejected (with reason)
  'cancelled'    -- User cancelled request
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who made the request
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL, -- Store email separately in case user deletes account
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,

  -- Request details
  request_type gdpr_request_type NOT NULL,
  status gdpr_request_status DEFAULT 'pending' NOT NULL,

  -- Request metadata
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  processed_by TEXT, -- Admin/system that processed it

  -- Additional details
  user_notes TEXT, -- User's explanation/notes
  admin_notes TEXT, -- Admin notes about processing
  rejection_reason TEXT, -- If rejected, why?

  -- Audit trail
  ip_address TEXT,
  user_agent TEXT,

  -- Data export (for portability requests)
  export_url TEXT, -- URL to download data export
  export_expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_email ON gdpr_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_household_id ON gdpr_requests(household_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_requested_at ON gdpr_requests(requested_at DESC);

-- Enable Row Level Security
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own requests
CREATE POLICY "gdpr_requests_select_own"
  ON gdpr_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own requests
CREATE POLICY "gdpr_requests_insert_own"
  ON gdpr_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can update (processed_by should be set server-side)
-- For now, allow users to cancel their own requests
CREATE POLICY "gdpr_requests_update_own_cancel"
  ON gdpr_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gdpr_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gdpr_requests_updated_at
  BEFORE UPDATE ON gdpr_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_gdpr_requests_updated_at();

-- Function to submit a GDPR request
CREATE OR REPLACE FUNCTION submit_gdpr_request(
  p_request_type gdpr_request_type,
  p_user_notes TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_household_id UUID;
  v_request_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Get household (if exists)
  SELECT household_id INTO v_household_id
  FROM household_members
  WHERE user_id = v_user_id
  LIMIT 1;

  -- Insert request
  INSERT INTO gdpr_requests (
    user_id,
    user_email,
    household_id,
    request_type,
    user_notes,
    ip_address,
    user_agent
  ) VALUES (
    v_user_id,
    v_user_email,
    v_household_id,
    p_request_type,
    p_user_notes,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_request_id;

  -- Log the request
  RAISE NOTICE 'GDPR request submitted: % for user % (email: %)',
    p_request_type, v_user_id, v_user_email;

  RETURN v_request_id;
END;
$$;

-- Function to get user's GDPR requests
CREATE OR REPLACE FUNCTION get_my_gdpr_requests()
RETURNS TABLE(
  id UUID,
  request_type gdpr_request_type,
  status gdpr_request_status,
  requested_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  user_notes TEXT,
  admin_notes TEXT,
  export_url TEXT,
  export_expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    gdpr_requests.id,
    gdpr_requests.request_type,
    gdpr_requests.status,
    gdpr_requests.requested_at,
    gdpr_requests.completed_at,
    gdpr_requests.user_notes,
    gdpr_requests.admin_notes,
    gdpr_requests.export_url,
    gdpr_requests.export_expires_at
  FROM gdpr_requests
  WHERE gdpr_requests.user_id = v_user_id
  ORDER BY gdpr_requests.requested_at DESC;
END;
$$;

-- Function to cancel a pending GDPR request
CREATE OR REPLACE FUNCTION cancel_gdpr_request(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update request status to cancelled
  UPDATE gdpr_requests
  SET status = 'cancelled'
  WHERE id = p_request_id
    AND user_id = v_user_id
    AND status = 'pending';

  -- Return true if row was updated
  RETURN FOUND;
END;
$$;

-- Admin function to process GDPR request (for future use)
-- This should only be callable by admins via service role
CREATE OR REPLACE FUNCTION process_gdpr_request(
  p_request_id UUID,
  p_status gdpr_request_status,
  p_admin_notes TEXT DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL,
  p_export_url TEXT DEFAULT NULL,
  p_processed_by TEXT DEFAULT 'system'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE gdpr_requests
  SET
    status = p_status,
    completed_at = CASE WHEN p_status IN ('completed', 'rejected') THEN NOW() ELSE NULL END,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    rejection_reason = p_rejection_reason,
    export_url = p_export_url,
    export_expires_at = CASE WHEN p_export_url IS NOT NULL THEN NOW() + INTERVAL '7 days' ELSE NULL END,
    processed_by = p_processed_by
  WHERE id = p_request_id;

  RETURN FOUND;
END;
$$;

-- Example: How to submit a GDPR request from app
-- SELECT submit_gdpr_request('access', 'I want to see all my data', '192.168.1.1', 'Mozilla/5.0...');
-- SELECT submit_gdpr_request('erasure', 'Please delete my account', '192.168.1.1', 'Mozilla/5.0...');

-- Example: How to get user's requests
-- SELECT * FROM get_my_gdpr_requests();

-- Example: How to cancel a request
-- SELECT cancel_gdpr_request('request-uuid-here');

-- Example: Admin processing (via service role)
-- SELECT process_gdpr_request('request-uuid', 'completed', 'Data exported and sent via email', null, null, 'admin@example.com');
