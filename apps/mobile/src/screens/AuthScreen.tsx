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
} from 'react-native';
import { supabase } from '../lib/supabase';
import tw from '../lib/tw';
import { Text } from '../components/Text';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Animation refs
  const titleFade = useRef(new Animated.Value(0)).current;
  const emailFade = useRef(new Animated.Value(0)).current;
  const passwordFade = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const toggleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Feil', 'Vennligst skriv inn e-post og passord');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        Alert.alert('Suksess', 'Sjekk e-posten din for bekreftelseslenke');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      Alert.alert('Feil', error instanceof Error ? error.message : 'Innlogging feilet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-background`}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={tw`flex-1 justify-center px-6`}>
        {/* Title + Tagline */}
        <Animated.View style={{ opacity: titleFade }}>
          <Text style={[tw`text-4xl text-center mb-2`, { fontFamily: 'PlusJakartaSans_500Medium', letterSpacing: 12, color: '#d4c5b9' }]}>
            FLYT
          </Text>
          <Text style={tw`text-base text-text-muted text-center mb-2`}>
            Flyt i hverdagen
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

        {/* Login Button */}
        <Animated.View style={{ opacity: buttonFade }}>
          <TouchableOpacity
            style={tw.style(`bg-primary rounded py-3.5 items-center mt-2`, loading && 'opacity-50')}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
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
      </View>
    </KeyboardAvoidingView>
  );
}
