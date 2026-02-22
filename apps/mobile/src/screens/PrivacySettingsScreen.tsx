import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import { exportUserData, deleteUserAccount } from '../lib/gdpr';
import tw from '../lib/tw';
import { BackButton } from '../components/BackButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { Text } from '../components/Text';

export default function PrivacySettingsScreen({ navigation }: any) {
  const { user, householdId, members, selectedChildId } = useHousehold();
  const [loading, setLoading] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [savingAnalytics, setSavingAnalytics] = useState(false);

  const currentMember = members.find(m => m.user_id === user?.id);
  const isOwner = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  // Load analytics preference
  useEffect(() => {
    if (currentMember) {
      loadAnalyticsPreference();
    }
  }, [currentMember]);

  const loadAnalyticsPreference = async () => {
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select('analytics_enabled')
        .eq('id', currentMember?.id)
        .single();

      if (!error && data) {
        setAnalyticsEnabled(data.analytics_enabled !== false); // Default to true
      }
    } catch (error) {
      console.error('Error loading analytics preference:', error);
    }
  };

  const handleToggleAnalytics = async (value: boolean) => {
    if (!currentMember) return;

    setSavingAnalytics(true);
    try {
      const { error } = await supabase
        .from('household_members')
        .update({ analytics_enabled: value })
        .eq('id', currentMember.id);

      if (error) throw error;

      setAnalyticsEnabled(value);
      Alert.alert(
        'Innstilling lagret',
        value
          ? 'Du deler nå anonym bruksstatistikk for å hjelpe oss forbedre appen.'
          : 'Bruksstatistikk er nå deaktivert.'
      );
    } catch (error) {
      console.error('Error saving analytics preference:', error);
      Alert.alert('Feil', 'Kunne ikke lagre innstilling');
    } finally {
      setSavingAnalytics(false);
    }
  };

  const handleExportData = async () => {
    if (!user || !householdId || !selectedChildId) {
      Alert.alert('Feil', 'Kunne ikke finne brukerdata');
      return;
    }

    Alert.alert(
      'Eksporter data',
      'Dette vil laste ned all din data i JSON-format. Du kan åpne filen i en teksteditor eller dele den.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Eksporter',
          onPress: async () => {
            setLoading(true);
            try {
              await exportUserData(user.id, householdId, selectedChildId);
              Alert.alert('Suksess', 'Data eksportert! Filen er klar til deling.');
            } catch (error) {
              console.error('Export error:', error);
              Alert.alert('Feil', 'Kunne ikke eksportere data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!user || !householdId || !currentMember) {
      Alert.alert('Feil', 'Kunne ikke finne brukerdata');
      return;
    }

    Alert.alert(
      'Slett konto',
      isOwner
        ? 'Du er eier av husholdningen. Sletting vil også slette hele husholdningen, alle barn, planer og notater. Dette kan IKKE angres.'
        : 'Dette vil slette din tilgang til husholdningen. Data forblir for andre medlemmer. Dette kan IKKE angres.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Fortsett',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Er du helt sikker?',
      'Skriv "SLETT" for å bekrefte permanent sletting av kontoen din.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'SLETT',
          style: 'destructive',
          onPress: async () => {
            if (!user || !householdId || !currentMember) return;

            setLoading(true);
            try {
              const result = await deleteUserAccount(
                user.id,
                householdId,
                currentMember.id,
                isOwner
              );

              if (result.success) {
                Alert.alert(
                  'Konto slettet',
                  'Din konto og all data er permanent slettet.',
                  [{ text: 'OK' }]
                );
                // User will be signed out automatically
              } else if (result.error === 'household_has_members') {
                // Already handled in deleteUserAccount
              } else {
                throw new Error('Deletion failed');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Feil', 'Kunne ikke slette konto. Kontakt support.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    // TODO: Replace with your actual privacy policy URL
    Linking.openURL('https://flyt.no/privacy');
  };

  const openTerms = () => {
    // TODO: Replace with your actual terms URL
    Linking.openURL('https://flyt.no/terms');
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={tw`flex-row items-center justify-between py-4 px-5 border-b border-slate-700/50`}
      onPress={onPress}
      disabled={loading}
    >
      <View style={tw`flex-row items-center gap-3 flex-1`}>
        <Ionicons
          name={icon}
          size={24}
          color={danger ? tw.color('text-error') : tw.color('text-text')}
        />
        <View style={tw`flex-1`}>
          <Text style={tw.style('text-base font-medium', danger ? 'text-error' : 'text-text')}>
            {title}
          </Text>
          {subtitle && (
            <Text style={tw`text-sm text-text-muted mt-1`}>{subtitle}</Text>
          )}
        </View>
      </View>
      <Text style={tw`text-text-light text-xl`}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={tw`flex-1 bg-background justify-center items-center`}>
        <ActivityIndicator size="large" color={tw.color('primary')} />
        <Text style={tw`text-text-muted mt-4`}>Behandler...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-background`}>
      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4`}>
          <BackButton />

          <ScreenHeader
            title="Personvern & GDPR"
            subtitle="Administrer dine personopplysninger og rettigheter"
          />

          {/* Your Rights Section */}
          <View style={tw`bg-slate-800/50 rounded-lg border border-slate-700 mb-4`}>
            <View style={tw`p-5 border-b border-slate-700/50`}>
              <Text style={tw`text-base font-semibold text-white`}>Dine rettigheter (GDPR)</Text>
            </View>

            <MenuItem
              icon="document-text-outline"
              title="Personvernerklæring"
              subtitle="Les hvordan vi behandler dine data"
              onPress={openPrivacyPolicy}
            />

            <MenuItem
              icon="shield-checkmark-outline"
              title="Vilkår for bruk"
              subtitle="Brukervilkår og betingelser"
              onPress={openTerms}
            />

            <MenuItem
              icon="download-outline"
              title="Eksporter mine data"
              subtitle="Last ned all din data (GDPR rett til dataportabilitet)"
              onPress={handleExportData}
            />
          </View>

          {/* Privacy Preferences */}
          <View style={tw`bg-slate-800/50 rounded-lg border border-slate-700 mb-4`}>
            <View style={tw`p-5 border-b border-slate-700/50`}>
              <Text style={tw`text-base font-semibold text-white`}>Personverninnstillinger</Text>
            </View>

            <View style={tw`flex-row items-center justify-between py-4 px-5`}>
              <View style={tw`flex-1 mr-4`}>
                <Text style={tw`text-base font-medium text-text mb-1`}>
                  Del anonym bruksstatistikk
                </Text>
                <Text style={tw`text-sm text-text-muted leading-5`}>
                  Hjelp oss forbedre appen ved å dele anonymisert bruksdata. Dette inkluderer kun tekniske hendelser som appbruk og funksjonalitet, ingen personopplysninger.
                </Text>
              </View>
              <Switch
                value={analyticsEnabled}
                onValueChange={handleToggleAnalytics}
                disabled={savingAnalytics}
                trackColor={{ false: '#4a3f38', true: '#7fa884' }}
                thumbColor={analyticsEnabled ? '#f5f1ed' : '#a89985'}
              />
            </View>
          </View>

          {/* Danger Zone */}
          <View style={tw`bg-slate-800/50 rounded-lg border border-red-900/30 mb-4`}>
            <View style={tw`p-5 border-b border-red-900/30`}>
              <Text style={tw`text-base font-semibold text-error`}>Faresone</Text>
            </View>

            <MenuItem
              icon="trash-outline"
              title="Slett konto permanent"
              subtitle={isOwner
                ? "Sletter hele husholdningen og all data (GDPR rett til sletting)"
                : "Fjerner deg fra husholdningen (GDPR rett til sletting)"}
              onPress={handleDeleteAccount}
              danger
            />
          </View>

          {/* Info Box */}
          <View style={tw`bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-4`}>
            <View style={tw`flex-row gap-3`}>
              <Ionicons name="information-circle-outline" size={24} color={tw.color('text-secondary')} />
              <View style={tw`flex-1`}>
                <Text style={tw`text-sm text-slate-200 font-semibold mb-2`}>
                  Om GDPR og personvern
                </Text>
                <Text style={tw`text-sm text-slate-300 leading-5`}>
                  Vi tar ditt personvern på alvor. All data er kryptert og lagret sikkert i EU.
                  Du har full kontroll over dine data og kan når som helst eksportere eller slette dem.
                </Text>
              </View>
            </View>
          </View>

          {/* Contact */}
          <View style={tw`items-center py-6`}>
            <Text style={tw`text-sm text-text-muted text-center mb-2`}>
              Spørsmål om personvern?
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:privacy@flyt.no')}>
              <Text style={tw`text-sm text-secondary underline`}>
                privacy@flyt.no
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
