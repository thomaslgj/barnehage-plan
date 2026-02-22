-- ============================================
-- RATE LIMITING SYSTEM
-- ============================================
-- Protects against brute force attacks and abuse
-- by tracking and limiting requests per IP/user

-- Create rate_limit_logs table
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user_id
  action TEXT NOT NULL, -- 'login', 'signup', 'password_reset', 'data_export', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Optional additional context
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_identifier_action_created
ON public.rate_limit_logs(identifier, action, created_at DESC);

-- Enable RLS (admin only access)
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (for admin/monitoring)
CREATE POLICY "rate_limit_logs_service_role_only"
  ON public.rate_limit_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RATE LIMIT CHECK FUNCTION
-- ============================================
-- Returns true if rate limit is exceeded, false otherwise

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  v_attempt_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate window start time
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Count attempts in the window
  SELECT COUNT(*)
  INTO v_attempt_count
  FROM public.rate_limit_logs
  WHERE identifier = p_identifier
    AND action = p_action
    AND created_at >= v_window_start;

  -- Return true if limit exceeded
  RETURN v_attempt_count >= p_max_attempts;
END;
$$;

-- ============================================
-- LOG RATE LIMIT ATTEMPT FUNCTION
-- ============================================
-- Logs an attempt for rate limiting tracking

CREATE OR REPLACE FUNCTION log_rate_limit_attempt(
  p_identifier TEXT,
  p_action TEXT,
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.rate_limit_logs (identifier, action, metadata)
  VALUES (p_identifier, p_action, p_metadata);
END;
$$;

-- ============================================
-- CLEANUP OLD LOGS FUNCTION
-- ============================================
-- Removes logs older than specified days (for maintenance)

CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs(
  p_days_to_keep INTEGER DEFAULT 7
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limit_logs
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- ============================================
-- RATE LIMIT CONFIGURATIONS
-- ============================================
-- Default limits (can be adjusted based on needs):
--
-- LOGIN ATTEMPTS:
--   - 5 attempts per 15 minutes per IP
--   - 10 attempts per hour per IP
--
-- SIGNUP ATTEMPTS:
--   - 3 attempts per hour per IP
--
-- PASSWORD RESET:
--   - 3 attempts per hour per email
--
-- DATA EXPORT:
--   - 2 requests per day per user
--
-- ACCOUNT DELETION:
--   - 1 request per hour per user (prevents accidental spam)
--
-- Usage in application:
--   SELECT check_rate_limit('user@email.com', 'password_reset', 3, 60);
--   SELECT log_rate_limit_attempt('user@email.com', 'password_reset');

-- ============================================
-- SCHEDULED CLEANUP (Optional - requires pg_cron extension)
-- ============================================
-- Uncomment if you have pg_cron enabled in Supabase:
--
-- SELECT cron.schedule(
--   'cleanup-rate-limit-logs',
--   '0 2 * * *', -- Run daily at 2 AM
--   $$ SELECT cleanup_rate_limit_logs(7); $$
-- );

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Allow authenticated users to call check function (they can check their own limits)
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon;

-- Only service role can log attempts (prevents gaming the system)
GRANT EXECUTE ON FUNCTION log_rate_limit_attempt TO service_role;

-- Only service role can cleanup
GRANT EXECUTE ON FUNCTION cleanup_rate_limit_logs TO service_role;
