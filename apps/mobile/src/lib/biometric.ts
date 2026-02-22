import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const STORED_EMAIL_KEY = 'biometric_email';
const STORED_PASSWORD_KEY = 'biometric_password';

export interface BiometricCapability {
  isAvailable: boolean;
  biometricType: 'fingerprint' | 'facial' | 'iris' | 'none';
}

/**
 * Check if biometric authentication is available on this device
 */
export async function checkBiometricAvailability(): Promise<BiometricCapability> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return { isAvailable: false, biometricType: 'none' };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      return { isAvailable: false, biometricType: 'none' };
    }

    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricType: 'fingerprint' | 'facial' | 'iris' | 'none' = 'none';
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'facial';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'iris';
    }

    return { isAvailable: true, biometricType };
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return { isAvailable: false, biometricType: 'none' };
  }
}

/**
 * Check if biometric login is enabled by the user
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric enabled status:', error);
    return false;
  }
}

/**
 * Enable biometric login and store credentials securely
 */
export async function enableBiometricLogin(email: string, password: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(STORED_EMAIL_KEY, email);
    await SecureStore.setItemAsync(STORED_PASSWORD_KEY, password);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    return true;
  } catch (error) {
    console.error('Error enabling biometric login:', error);
    return false;
  }
}

/**
 * Disable biometric login and remove stored credentials
 */
export async function disableBiometricLogin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORED_EMAIL_KEY);
    await SecureStore.deleteItemAsync(STORED_PASSWORD_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  } catch (error) {
    console.error('Error disabling biometric login:', error);
  }
}

/**
 * Authenticate with biometrics and return stored credentials
 */
export async function authenticateWithBiometrics(): Promise<{ email: string; password: string } | null> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Bekreft din identitet',
      fallbackLabel: 'Bruk passord',
      cancelLabel: 'Avbryt',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return null;
    }

    // Retrieve stored credentials
    const email = await SecureStore.getItemAsync(STORED_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);

    if (!email || !password) {
      console.error('Stored credentials not found');
      return null;
    }

    return { email, password };
  } catch (error) {
    console.error('Error authenticating with biometrics:', error);
    return null;
  }
}

/**
 * Get the biometric type name in Norwegian
 */
export function getBiometricTypeName(type: BiometricCapability['biometricType']): string {
  switch (type) {
    case 'fingerprint':
      return 'fingeravtrykk';
    case 'facial':
      return 'ansiktsgjenkjenning';
    case 'iris':
      return 'irisgjenkjenning';
    default:
      return 'biometrisk autentisering';
  }
}
