import React, { useState, useEffect } from 'react';
import { View, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import tw from '../lib/tw';
import { BackButton } from '../components/BackButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { Text } from '../components/Text';
import {
  checkBiometricAvailability,
  isBiometricEnabled,
  enableBiometricLogin,
  disableBiometricLogin,
  getBiometricTypeName,
  type BiometricCapability,
} from '../lib/biometric';

export default function BiometricSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability>({
    isAvailable: false,
    biometricType: 'none'
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    setLoading(true);
    try {
      const capability = await checkBiometricAvailability();
      setBiometricCapability(capability);

      if (capability.isAvailable) {
        const enabled = await isBiometricEnabled();
        setBiometricEnabled(enabled);
      }
    } catch (error) {
      console.error('Error checking biometric setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      // Enabling biometric - need to get user's current password
      Alert.alert(
        'Aktiver biometrisk innlogging',
        'For å aktivere biometrisk innlogging må du bekrefte passordet ditt.',
        [
          {
            text: 'Avbryt',
            style: 'cancel',
          },
          {
            text: 'Fortsett',
            onPress: () => promptForPassword(),
          },
        ]
      );
    } else {
      // Disabling biometric
      Alert.alert(
        'Deaktiver biometrisk innlogging',
        'Er du sikker på at du vil deaktivere biometrisk innlogging? Du må logge inn med passord neste gang.',
        [
          {
            text: 'Avbryt',
            style: 'cancel',
          },
          {
            text: 'Deaktiver',
            style: 'destructive',
            onPress: async () => {
              setSaving(true);
              try {
                await disableBiometricLogin();
                setBiometricEnabled(false);
                Alert.alert('Deaktivert', 'Biometrisk innlogging er nå deaktivert');
              } catch (error) {
                Alert.alert('Feil', 'Kunne ikke deaktivere biometrisk innlogging');
              } finally {
                setSaving(false);
              }
            },
          },
        ]
      );
    }
  };

  const promptForPassword = () => {
    Alert.prompt(
      'Bekreft passord',
      'Skriv inn ditt passord for å aktivere biometrisk innlogging:',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Bekreft',
          onPress: async (password) => {
            if (!password) {
              Alert.alert('Feil', 'Passord kan ikke være tomt');
              return;
            }
            await verifyAndEnableBiometric(password);
          },
        },
      ],
      'secure-text'
    );
  };

  const verifyAndEnableBiometric = async (password: string) => {
    setSaving(true);
    try {
      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('Kunne ikke finne brukerens e-post');
      }

      // Verify password by attempting to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        throw new Error('Feil passord');
      }

      // Password is correct, enable biometric
      const success = await enableBiometricLogin(user.email, password);
      if (success) {
        setBiometricEnabled(true);
        const biometricName = getBiometricTypeName(biometricCapability.biometricType);
        Alert.alert('Aktivert', `${biometricName} er nå aktivert for innlogging`);
      } else {
        throw new Error('Kunne ikke lagre innloggingsinformasjon');
      }
    } catch (error) {
      Alert.alert(
        'Feil',
        error instanceof Error ? error.message : 'Kunne ikke aktivere biometrisk innlogging'
      );
    } finally {
      setSaving(false);
    }
  };

  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (biometricCapability.biometricType) {
      case 'fingerprint':
        return 'finger-print';
      case 'facial':
        return 'scan';
      case 'iris':
        return 'eye-outline';
      default:
        return 'lock-closed-outline';
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-background justify-center items-center`}>
        <ActivityIndicator size="large" color="#7fa884" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-background`}>
      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-4`}
        >
          <BackButton />

          <ScreenHeader
            title="Biometrisk innlogging"
            subtitle={biometricCapability.isAvailable
              ? `Bruk ${getBiometricTypeName(biometricCapability.biometricType)} for raskere innlogging`
              : 'Ikke tilgjengelig på denne enheten'
            }
          />

          {/* Biometric Status */}
          <View style={tw`bg-slate-800/50 rounded-lg p-5 border border-slate-700 mb-4`}>
            <View style={tw`flex-row items-center gap-3 mb-4`}>
              <Ionicons
                name={getBiometricIcon()}
                size={32}
                color={biometricCapability.isAvailable ? '#7fa884' : '#a89985'}
              />
              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-semibold text-white mb-1`}>
                  {biometricCapability.isAvailable
                    ? getBiometricTypeName(biometricCapability.biometricType).charAt(0).toUpperCase() +
                      getBiometricTypeName(biometricCapability.biometricType).slice(1)
                    : 'Ikke tilgjengelig'}
                </Text>
                <Text style={tw`text-sm text-slate-400`}>
                  {biometricCapability.isAvailable
                    ? biometricEnabled ? 'Aktivert' : 'Deaktivert'
                    : 'Enheten din støtter ikke biometrisk autentisering'}
                </Text>
              </View>
            </View>

            {biometricCapability.isAvailable && (
              <View style={tw`flex-row items-center justify-between pt-3 border-t border-slate-700`}>
                <Text style={tw`text-base text-white`}>Aktiver biometrisk innlogging</Text>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleToggleBiometric}
                  disabled={saving}
                  trackColor={{ false: '#475569', true: '#7fa884' }}
                  thumbColor={biometricEnabled ? '#f5f1ed' : '#cbd5e1'}
                />
              </View>
            )}
          </View>

          {/* Information */}
          {biometricCapability.isAvailable && (
            <View style={tw`bg-slate-800/30 rounded-lg p-4 border border-slate-700/50`}>
              <View style={tw`flex-row gap-2 mb-2`}>
                <Ionicons name="information-circle-outline" size={20} color="#a89985" />
                <Text style={tw`text-sm font-semibold text-slate-300`}>Om biometrisk innlogging</Text>
              </View>
              <Text style={tw`text-sm text-slate-400 leading-5 ml-7`}>
                Når biometrisk innlogging er aktivert, vil innloggingsinformasjonen din bli lagret sikkert på enheten.
                Du kan bruke {getBiometricTypeName(biometricCapability.biometricType)} for å logge inn raskt uten å måtte skrive passordet ditt hver gang.
              </Text>
              <Text style={tw`text-sm text-slate-400 leading-5 ml-7 mt-3`}>
                Innloggingsinformasjonen lagres kun på denne enheten og kan ikke aksesseres av andre apper.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
