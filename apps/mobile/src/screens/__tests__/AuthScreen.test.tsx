import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, ActivityIndicator } from 'react-native';
import AuthScreen from '../AuthScreen';
import { supabase } from '../../lib/supabase';
import * as biometric from '../../lib/biometric';

// Mock dependencies
jest.mock('../../lib/supabase');
jest.mock('../../lib/biometric');
jest.mock('../../lib/rateLimit');
jest.mock('../../lib/tw', () => {
  // Mock tw to work as both tagged template literal and function
  const mockTw = (strings: any, ...values: any[]) => ({});
  mockTw.style = (...args: any[]) => ({});
  mockTw.color = (color: string) => color;
  return {
    __esModule: true,
    default: mockTw,
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default biometric mocks
    (biometric.checkBiometricAvailability as jest.Mock).mockResolvedValue({
      isAvailable: false,
      biometricType: 'none',
    });
    (biometric.isBiometricEnabled as jest.Mock).mockResolvedValue(false);
    (biometric.getBiometricTypeName as jest.Mock).mockImplementation((type: string) => {
      if (type === 'fingerprint') return 'fingeravtrykk';
      if (type === 'facial') return 'ansiktsgjenkjenning';
      return 'biometrisk autentisering';
    });
  });

  describe('rendering', () => {
    it('should render login form by default', () => {
      const { getByPlaceholderText, getByText } = render(<AuthScreen navigation={{} as any} />);

      expect(getByPlaceholderText('E-post')).toBeTruthy();
      expect(getByPlaceholderText('Passord')).toBeTruthy();
      expect(getByText('Logg inn')).toBeTruthy();
    });

    it('should switch to signup mode when toggle is pressed', async () => {
      const { findByText, getByText } = render(<AuthScreen navigation={{} as any} />);

      const toggleButton = await findByText(/Opprett konto/i);
      fireEvent.press(toggleButton);

      expect(await findByText(/Opprett konto/i)).toBeTruthy();
    });

    it('should switch back to login mode', async () => {
      const { findByText, queryByText } = render(<AuthScreen navigation={{} as any} />);

      // Switch to signup
      const signupToggle = await findByText(/Har du ikke en konto/i);
      fireEvent.press(signupToggle);
      expect(await findByText(/Opprett en konto/i)).toBeTruthy();

      // Switch back to login
      const loginToggle = await findByText(/Har du allerede en konto/i);
      fireEvent.press(loginToggle);
      expect(await findByText(/Logg inn på din konto/i)).toBeTruthy();
    });
  });

  describe('login flow', () => {
    it('should show error when fields are empty', async () => {
      const { getByText } = render(<AuthScreen navigation={{} as any} />);

      const loginButton = getByText('Logg inn');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Feil',
          'Vennligst skriv inn e-post og passord'
        );
      });
    });

    it('should call signInWithPassword when login button is pressed', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.signInWithPassword as jest.Mock) = mockSignIn;

      const { getByPlaceholderText, getByText } = render(<AuthScreen navigation={{} as any} />);

      const emailInput = getByPlaceholderText('E-post');
      const passwordInput = getByPlaceholderText('Passord');
      const loginButton = getByText('Logg inn');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show error message when login fails', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });
      (supabase.auth.signInWithPassword as jest.Mock) = mockSignIn;

      const { getByPlaceholderText, getByText } = render(<AuthScreen navigation={{} as any} />);

      const emailInput = getByPlaceholderText('E-post');
      const passwordInput = getByPlaceholderText('Passord');
      const loginButton = getByText('Logg inn');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Feil', 'Invalid credentials');
      });
    });

    it('should offer biometric enrollment after successful login', async () => {
      (biometric.checkBiometricAvailability as jest.Mock).mockResolvedValue({
        isAvailable: true,
        biometricType: 'fingerprint',
      });
      (biometric.isBiometricEnabled as jest.Mock).mockResolvedValue(false);

      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.signInWithPassword as jest.Mock) = mockSignIn;

      const { getByPlaceholderText, getByText } = render(<AuthScreen navigation={{} as any} />);

      // Wait for biometric setup to complete
      await waitFor(() => {
        expect(biometric.checkBiometricAvailability).toHaveBeenCalled();
      });

      const emailInput = getByPlaceholderText('E-post');
      const passwordInput = getByPlaceholderText('Passord');
      const loginButton = getByText('Logg inn');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Aktiver biometrisk innlogging?',
          expect.stringContaining('fingeravtrykk'),
          expect.any(Array)
        );
      });
    });
  });

  describe('signup flow', () => {
    it('should call signUp when signup button is pressed', async () => {
      const mockSignUp = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.signUp as jest.Mock) = mockSignUp;

      const { getByPlaceholderText, findByText } = render(<AuthScreen navigation={{} as any} />);

      // Switch to signup mode
      const signupToggle = await findByText(/Opprett konto/i);
      fireEvent.press(signupToggle);

      const emailInput = getByPlaceholderText('E-post');
      const passwordInput = getByPlaceholderText('Passord');
      const signupButton = await findByText(/Opprett konto/i);

      fireEvent.changeText(emailInput, 'newuser@example.com');
      fireEvent.changeText(passwordInput, 'newpassword123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'newpassword123',
        });
      });
    });

    it('should show success message after signup', async () => {
      const mockSignUp = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.signUp as jest.Mock) = mockSignUp;

      const { getByPlaceholderText, findByText } = render(<AuthScreen navigation={{} as any} />);

      // Switch to signup mode
      const signupToggle = await findByText(/Opprett konto/i);
      fireEvent.press(signupToggle);

      const emailInput = getByPlaceholderText('E-post');
      const passwordInput = getByPlaceholderText('Passord');
      const signupButton = await findByText(/Opprett konto/i);

      fireEvent.changeText(emailInput, 'newuser@example.com');
      fireEvent.changeText(passwordInput, 'newpassword123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Suksess',
          'Sjekk e-posten din for bekreftelseslenke'
        );
      });
    });
  });

  describe('biometric authentication', () => {
    it('should show biometric login button when enabled', async () => {
      (biometric.checkBiometricAvailability as jest.Mock).mockResolvedValue({
        isAvailable: true,
        biometricType: 'fingerprint',
      });
      (biometric.isBiometricEnabled as jest.Mock).mockResolvedValue(true);

      const { findByText } = render(<AuthScreen navigation={{} as any} />);

      const biometricButton = await findByText(/Logg inn med fingeravtrykk/i);
      expect(biometricButton).toBeTruthy();
    });

    it('should not show biometric button when not available', () => {
      (biometric.checkBiometricAvailability as jest.Mock).mockResolvedValue({
        isAvailable: false,
        biometricType: 'none',
      });
      (biometric.isBiometricEnabled as jest.Mock).mockResolvedValue(false);

      const { queryByText } = render(<AuthScreen navigation={{} as any} />);

      expect(queryByText(/Logg inn med fingeravtrykk/i)).toBeNull();
    });

    it('should authenticate with biometrics when button is pressed', async () => {
      (biometric.checkBiometricAvailability as jest.Mock).mockResolvedValue({
        isAvailable: true,
        biometricType: 'fingerprint',
      });
      (biometric.isBiometricEnabled as jest.Mock).mockResolvedValue(true);
      (biometric.authenticateWithBiometrics as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
        password: 'password123',
      });

      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.signInWithPassword as jest.Mock) = mockSignIn;

      const { findByText } = render(<AuthScreen navigation={{} as any} />);

      const biometricButton = await findByText(/Logg inn med fingeravtrykk/i);
      fireEvent.press(biometricButton);

      await waitFor(() => {
        expect(biometric.authenticateWithBiometrics).toHaveBeenCalled();
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('rate limiting integration', () => {
    it('should check rate limit before login', async () => {
      const { isRateLimited } = require('../../lib/rateLimit');
      (isRateLimited as jest.Mock).mockResolvedValue(false);

      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.signInWithPassword as jest.Mock) = mockSignIn;

      const { getByPlaceholderText, getByText } = render(<AuthScreen navigation={{} as any} />);

      const emailInput = getByPlaceholderText('E-post');
      const passwordInput = getByPlaceholderText('Passord');
      const loginButton = getByText('Logg inn');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(isRateLimited).toHaveBeenCalledWith('login', 'test@example.com');
      });
    });

    it('should not attempt login when rate limited', async () => {
      const { isRateLimited, getRateLimitMessage } = require('../../lib/rateLimit');
      (isRateLimited as jest.Mock).mockResolvedValue(true);
      (getRateLimitMessage as jest.Mock).mockReturnValue('For mange forsøk');

      const mockSignIn = jest.fn();
      (supabase.auth.signInWithPassword as jest.Mock) = mockSignIn;

      const { getByPlaceholderText, getByText } = render(<AuthScreen navigation={{} as any} />);

      const emailInput = getByPlaceholderText('E-post');
      const passwordInput = getByPlaceholderText('Passord');
      const loginButton = getByText('Logg inn');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('For mange forsøk', 'For mange forsøk');
        expect(mockSignIn).not.toHaveBeenCalled();
      });
    });
  });

  describe('loading states', () => {
    it('should show loading indicator when button is pressed', async () => {
      const mockSignIn = jest.fn(() => new Promise(() => {})); // Never resolves
      (supabase.auth.signInWithPassword as jest.Mock) = mockSignIn;

      const { getByPlaceholderText, getByText, queryByText, UNSAFE_getByType } = render(<AuthScreen navigation={{} as any} />);

      const emailInput = getByPlaceholderText('E-post');
      const passwordInput = getByPlaceholderText('Passord');
      const loginButton = getByText('Logg inn');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // When loading, the button text is replaced with ActivityIndicator
      // Verify that the button text disappears (replaced by loading spinner)
      await waitFor(() => {
        expect(queryByText('Logg inn')).toBeNull();
      });
    });
  });
});
