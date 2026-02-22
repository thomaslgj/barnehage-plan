import { getRateLimitMessage } from '../rateLimit';

// Note: isRateLimited and withRateLimit require mocked Supabase,
// so they're better suited for integration tests

describe('getRateLimitMessage', () => {
  it('should return correct message for login', () => {
    const message = getRateLimitMessage('login');
    expect(message).toContain('15 minutt');
    expect(message).toContain('innlogging');
  });

  it('should return correct message for signup', () => {
    const message = getRateLimitMessage('signup');
    expect(message).toContain('1 time');
    expect(message).toContain('registrering');
  });

  it('should return correct message for password_reset', () => {
    const message = getRateLimitMessage('password_reset');
    expect(message).toContain('1 time');
    expect(message).toContain('passord');
  });

  it('should return correct message for data_export', () => {
    const message = getRateLimitMessage('data_export');
    expect(message).toContain('1 dag');
    expect(message).toContain('dataeksport');
  });

  it('should return correct message for account_deletion', () => {
    const message = getRateLimitMessage('account_deletion');
    expect(message).toContain('1 time');
    expect(message).toContain('slette konto');
  });

  it('should format time correctly for minutes', () => {
    const message = getRateLimitMessage('login'); // 15 minutes
    expect(message).toMatch(/15 minutt/);
  });

  it('should format time correctly for hours', () => {
    const message = getRateLimitMessage('signup'); // 60 minutes = 1 hour
    expect(message).toMatch(/1 time/);
  });

  it('should format time correctly for days', () => {
    const message = getRateLimitMessage('data_export'); // 1440 minutes = 1 day
    expect(message).toMatch(/1 dag/);
  });
});

describe('Rate Limit Configuration', () => {
  it('should have sensible defaults', () => {
    // Test that the rate limits are reasonable
    // This is more of a sanity check
    const loginMessage = getRateLimitMessage('login');
    const signupMessage = getRateLimitMessage('signup');

    expect(loginMessage).toBeTruthy();
    expect(signupMessage).toBeTruthy();
  });
});
