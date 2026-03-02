import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import tw from '../lib/tw';
import { Text } from '../components/Text';
import {
  checkBiometricAvailability,
  isBiometricEnabled,
  enableBiometricLogin,
  authenticateWithBiometrics,
  getBiometricTypeName,
  type BiometricCapability,
} from '../lib/biometric';
import { isRateLimited, getRateLimitMessage } from '../lib/rateLimit';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability>({
    isAvailable: false,
    biometricType: 'none'
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [attemptingBiometric, setAttemptingBiometric] = useState(false);

  // Dev impersonation state
  const [devModalVisible, setDevModalVisible] = useState(false);
  const [devUsers, setDevUsers] = useState<{ id: string; email: string }[]>([]);
  const [devLoading, setDevLoading] = useState(false);

  // Animation refs
  // In test environment, start with opacity 1 (fully visible) to avoid animation issues
  const isTestEnv = process.env.NODE_ENV === 'test' || typeof jest !== 'undefined';
  const initialOpacity = isTestEnv ? 1 : 0;

  const titleFade = useRef(new Animated.Value(initialOpacity)).current;
  const emailFade = useRef(new Animated.Value(initialOpacity)).current;
  const passwordFade = useRef(new Animated.Value(initialOpacity)).current;
  const buttonFade = useRef(new Animated.Value(initialOpacity)).current;
  const toggleFade = useRef(new Animated.Value(initialOpacity)).current;

  useEffect(() => {
    // Skip animations in test environment
    if (!isTestEnv) {
      // Stagger the animations
      Animated.stagger(150, [
        Animated.timing(titleFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(emailFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(passwordFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(toggleFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Check biometric availability
    checkBiometricSetup();
  }, []);

  const checkBiometricSetup = async () => {
    const capability = await checkBiometricAvailability();
    setBiometricCapability(capability);

    if (capability.isAvailable) {
      const enabled = await isBiometricEnabled();
      setBiometricEnabled(enabled);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Feil', 'Vennligst skriv inn e-post og passord');
      return;
    }

    setLoading(true);
    try {
      // Check rate limit before attempting auth
      const action = isSignUp ? 'signup' : 'login';
      const limited = await isRateLimited(action, email);

      if (limited) {
        Alert.alert('For mange forsøk', getRateLimitMessage(action));
        return;
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Check if user already exists - Supabase returns a user but with specific identities
        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          // Email already registered
          Alert.alert(
            'E-post allerede i bruk',
            'Denne e-posten har allerede en konto. Vil du logge inn i stedet?',
            [
              { text: 'Avbryt', style: 'cancel' },
              {
                text: 'Logg inn',
                onPress: () => setIsSignUp(false)
              }
            ]
          );
          return;
        }

        // Email confirmation is disabled - user is now logged in automatically
        // No need to show a message, the app will navigate to onboarding/main screen
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // After successful login, offer to enable biometric if available and not already enabled
        if (biometricCapability.isAvailable && !biometricEnabled) {
          offerBiometricEnrollment();
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Supabase errors are plain objects with a message property, not Error instances
      const errorMessage = (error as any)?.message || (error instanceof Error ? error.message : 'Innlogging feilet');
      console.error('Error message:', errorMessage);

      // Provide better error messages
      let userFriendlyMessage = errorMessage;

      if (isSignUp) {
        if (errorMessage.toLowerCase().includes('already registered') ||
            errorMessage.toLowerCase().includes('already exists') ||
            errorMessage.toLowerCase().includes('user already exists')) {
          userFriendlyMessage = 'Denne e-posten er allerede registrert. Prøv å logge inn i stedet.';
        } else if (errorMessage.toLowerCase().includes('password')) {
          userFriendlyMessage = 'Passordet må være minst 6 tegn langt.';
        } else if (errorMessage.toLowerCase().includes('email')) {
          userFriendlyMessage = 'Ugyldig e-postadresse.';
        }
      } else {
        if (errorMessage.toLowerCase().includes('invalid login credentials')) {
          userFriendlyMessage = 'Feil e-post eller passord.';
        } else if (errorMessage.toLowerCase().includes('email not confirmed')) {
          userFriendlyMessage = 'E-posten din er ikke bekreftet ennå. Sjekk innboksen din.';
        }
      }

      Alert.alert('Feil', userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const offerBiometricEnrollment = () => {
    const biometricName = getBiometricTypeName(biometricCapability.biometricType);
    Alert.alert(
      'Aktiver biometrisk innlogging?',
      `Vil du bruke ${biometricName} for raskere innlogging neste gang?`,
      [
        {
          text: 'Ikke nå',
          style: 'cancel',
        },
        {
          text: 'Aktiver',
          onPress: async () => {
            const success = await enableBiometricLogin(email, password);
            if (success) {
              setBiometricEnabled(true);
              Alert.alert('Aktivert', `${biometricName} er nå aktivert for innlogging`);
            } else {
              Alert.alert('Feil', 'Kunne ikke aktivere biometrisk innlogging');
            }
          },
        },
      ]
    );
  };

  const handleBiometricAuth = async () => {
    setAttemptingBiometric(true);
    try {
      const credentials = await authenticateWithBiometrics();
      if (credentials) {
        // Sign in with stored credentials
        const { error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        if (error) throw error;
      }
    } catch (error) {
      const errorMessage = (error as any)?.message || (error instanceof Error ? error.message : 'Biometrisk autentisering feilet');
      Alert.alert('Feil', errorMessage);
    } finally {
      setAttemptingBiometric(false);
    }
  };

  const handleDevOpenModal = async () => {
    setDevLoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://flytfamilie.no';
      const res = await fetch(`${apiUrl}/api/dev/users`);
      if (!res.ok) throw new Error('Could not fetch users');
      const users = await res.json();
      setDevUsers(users);
      setDevModalVisible(true);
    } catch (error) {
      Alert.alert('Dev error', (error as Error).message);
    } finally {
      setDevLoading(false);
    }
  };

  const handleDevImpersonate = async (userEmail: string) => {
    setDevModalVisible(false);
    setLoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://flytfamilie.no';
      const res = await fetch(`${apiUrl}/api/dev/impersonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Impersonation failed');
      }
      const { email: otpEmail, otp } = await res.json();
      // Use verifyOtp on the client — goes through the normal sign-in flow
      // (avoids setSession lock deadlock with onAuthStateChange)
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otp,
        type: 'email',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Dev impersonate error:', error);
      Alert.alert('Dev error', (error as Error).message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-background`}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={tw`flex-grow justify-center px-6 py-8`}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View style={{ opacity: titleFade }}>
          <Text style={[tw`text-5xl text-center mb-16`, { fontFamily: 'PlusJakartaSans_500Medium', letterSpacing: 8, color: '#EDE7DF' }]}>
            flyt
          </Text>
          <Text style={tw`text-sm text-text-light text-center mb-12`}>
            {isSignUp ? 'Opprett en konto' : 'Logg inn på din konto'}
          </Text>
        </Animated.View>

        {/* Email Input */}
        <Animated.View style={{ opacity: emailFade }}>
          <TextInput
            style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-4 text-white`}
            placeholder="E-post"
            placeholderTextColor="#a89985"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />
        </Animated.View>

        {/* Password Input */}
        <Animated.View style={{ opacity: passwordFade }}>
          <TextInput
            style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-4 text-white`}
            placeholder="Passord"
            placeholderTextColor="#a89985"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={!loading}
          />
        </Animated.View>

        {/* Biometric Login Button - Only show if enabled and in login mode */}
        {biometricEnabled && !isSignUp && (
          <Animated.View style={{ opacity: buttonFade }}>
            <TouchableOpacity
              style={tw.style(
                `bg-slate-800/50 border-2 border-secondary rounded py-3.5 items-center mt-2 mb-3 flex-row justify-center gap-2`,
                attemptingBiometric && 'opacity-50'
              )}
              onPress={handleBiometricAuth}
              disabled={attemptingBiometric || loading}
            >
              {attemptingBiometric ? (
                <ActivityIndicator color="#e8c96f" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={24} color="#e8c96f" />
                  <Text style={[tw`text-secondary text-base font-semibold`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
                    Logg inn med {getBiometricTypeName(biometricCapability.biometricType)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Login Button */}
        <Animated.View style={{ opacity: buttonFade }}>
          <TouchableOpacity
            style={tw.style(`bg-primary rounded py-3.5 items-center mt-2`, loading && 'opacity-50')}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#f5f1ed" />
            ) : (
              <Text style={tw`text-white text-base font-semibold`}>
                {isSignUp ? 'Opprett konto' : 'Logg inn'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Toggle Link */}
        <Animated.View style={{ opacity: toggleFade }}>
          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
            style={tw`mt-4 py-3`}
          >
            <Text style={tw`text-secondary text-sm text-center`}>
              {isSignUp
                ? 'Har du allerede en konto? Logg inn'
                : 'Har du ikke en konto? Opprett konto'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Dev Impersonation Panel - only in dev builds */}
        {__DEV__ && (
          <View style={tw`mt-8 border-t border-slate-700 pt-4`}>
            <TouchableOpacity
              style={tw.style(
                `bg-slate-800/50 border border-dashed border-slate-600 rounded py-3 items-center`,
                devLoading && 'opacity-50'
              )}
              onPress={handleDevOpenModal}
              disabled={devLoading || loading}
            >
              {devLoading ? (
                <ActivityIndicator color="#a89985" />
              ) : (
                <Text style={tw`text-text-light text-sm`}>
                  Dev: Velg bruker
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Dev User Picker Modal */}
      {__DEV__ && (
        <Modal
          visible={devModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDevModalVisible(false)}
        >
          <View style={tw`flex-1 justify-end bg-black/50`}>
            <View style={tw`bg-card-elevated rounded-t-2xl max-h-[70%] pb-8`}>
              <View style={tw`flex-row justify-between items-center px-5 py-4 border-b border-slate-700`}>
                <Text style={tw`text-white text-lg font-semibold`}>Velg bruker</Text>
                <TouchableOpacity onPress={() => setDevModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#a89985" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={devUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={tw`px-5 py-4 border-b border-slate-700/50`}
                    onPress={() => handleDevImpersonate(item.email)}
                  >
                    <Text style={tw`text-white text-base`}>{item.email}</Text>
                    <Text style={tw`text-text-light text-xs mt-1`}>{item.id}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}
