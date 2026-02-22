import { supabase } from './supabase';
import { Platform } from 'react-native';

/**
 * Rate limiting utility for protecting sensitive operations
 */

// Get a unique identifier for this device/session
// On web: use IP (handled server-side)
// On mobile: use a persistent device ID
async function getIdentifier(email?: string): Promise<string> {
  // For authenticated operations, use email as identifier
  if (email) {
    return email.toLowerCase();
  }

  // For anonymous operations, we'd ideally use IP
  // But since we can't get IP client-side, we'll use 'anonymous'
  // The database function will be called from Edge Functions with actual IP
  return 'anonymous';
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMinutes: 15 },
  signup: { maxAttempts: 3, windowMinutes: 60 },
  password_reset: { maxAttempts: 3, windowMinutes: 60 },
  data_export: { maxAttempts: 2, windowMinutes: 1440 }, // 2 per day
  account_deletion: { maxAttempts: 1, windowMinutes: 60 },
};

/**
 * Check if rate limit has been exceeded for an action
 * @param action - The action to check (login, signup, etc.)
 * @param identifier - Optional identifier (email, user_id). If not provided, uses device/IP
 * @returns true if rate limit exceeded, false otherwise
 */
export async function isRateLimited(
  action: keyof typeof RATE_LIMITS,
  identifier?: string
): Promise<boolean> {
  try {
    const id = identifier || await getIdentifier();
    const config = RATE_LIMITS[action];

    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: id,
      p_action: action,
      p_max_attempts: config.maxAttempts,
      p_window_minutes: config.windowMinutes,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - don't block on errors
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - don't block on errors
    return false;
  }
}

/**
 * Get user-friendly error message when rate limited
 */
export function getRateLimitMessage(action: keyof typeof RATE_LIMITS): string {
  const config = RATE_LIMITS[action];
  const minutes = config.windowMinutes;

  const timeString =
    minutes >= 1440
      ? `${Math.floor(minutes / 1440)} dag(er)`
      : minutes >= 60
      ? `${Math.floor(minutes / 60)} time(r)`
      : `${minutes} minutt(er)`;

  switch (action) {
    case 'login':
      return `For mange innloggingsforsøk. Prøv igjen om ${timeString}.`;
    case 'signup':
      return `For mange registreringsforsøk. Prøv igjen om ${timeString}.`;
    case 'password_reset':
      return `For mange forsøk på å tilbakestille passord. Prøv igjen om ${timeString}.`;
    case 'data_export':
      return `Du har nådd grensen for dataeksport. Prøv igjen om ${timeString}.`;
    case 'account_deletion':
      return `For mange forsøk på å slette konto. Prøv igjen om ${timeString}.`;
    default:
      return `For mange forsøk. Prøv igjen om ${timeString}.`;
  }
}

/**
 * Wrapper function to execute an action with rate limiting
 * @param action - The action type
 * @param fn - The function to execute if not rate limited
 * @param identifier - Optional identifier
 * @returns Result of fn or throws rate limit error
 */
export async function withRateLimit<T>(
  action: keyof typeof RATE_LIMITS,
  fn: () => Promise<T>,
  identifier?: string
): Promise<T> {
  const limited = await isRateLimited(action, identifier);

  if (limited) {
    throw new Error(getRateLimitMessage(action));
  }

  return await fn();
}

/**
 * Client-side attempt logging (for monitoring)
 * Note: Actual server-side logging should happen in Edge Functions
 * This is just for client-side tracking/debugging
 */
export async function logAttempt(
  action: keyof typeof RATE_LIMITS,
  identifier?: string,
  metadata?: Record<string, any>
): Promise<void> {
  // This is a placeholder - actual logging should happen server-side
  // to prevent gaming the system
  console.log(`Rate limit attempt logged: ${action} for ${identifier || 'anonymous'}`);
}
