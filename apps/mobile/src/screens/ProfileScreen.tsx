import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import tw from '../lib/tw';

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { forceOnboarding, user, members, householdId, refresh } = useHousehold();

  // Get current user's member record
  const currentMember = members.find(m => m.user_id === user?.id);

  // State for editable name
  const [displayName, setDisplayName] = useState('');

  // Load current display name
  useEffect(() => {
    if (currentMember?.display_name) {
      setDisplayName(currentMember.display_name);
    }
  }, [currentMember]);

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      Alert.alert('Feil', 'Navnet kan ikke være tomt');
      return;
    }

    if (!currentMember) {
      Alert.alert('Feil', 'Kunne ikke finne din profil');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('household_members')
        .update({ display_name: displayName.trim() })
        .eq('id', currentMember.id);

      if (error) throw error;

      // Refresh household data to show updated name
      await refresh();

      Alert.alert('Lagret', 'Navnet ditt er oppdatert');
    } catch (error) {
      console.error('Error saving name:', error);
      Alert.alert('Feil', 'Kunne ikke lagre navnet');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logg ut',
      'Er du sikker på at du vil logge ut?',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Logg ut',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Feil', 'Kunne ikke logge ut');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={tw`flex-1 bg-background`}>
      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-4`}
        >
        {/* Back button */}
        <TouchableOpacity
          style={tw`flex-row items-center gap-2 mb-6`}
          onPress={() => navigation.goBack()}
        >
          <Text style={tw`text-2xl text-text-light`}>‹</Text>
          <Text style={tw`text-base text-text-light`}>Tilbake</Text>
        </TouchableOpacity>

        <Text style={tw`text-3xl font-bold text-white mb-6`}>Profil & Innstillinger</Text>

        {/* Personal Settings Section */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider`}>
            Personlige innstillinger
          </Text>

          <View style={tw`bg-slate-800/50 rounded-lg p-4 border border-slate-700`}>
            <Text style={tw`text-sm text-text-muted mb-2`}>Ditt navn</Text>
            <TextInput
              style={tw`bg-background border border-slate-700 rounded-lg px-4 py-3 text-white text-base mb-3`}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ditt navn"
              placeholderTextColor="#a89985"
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={tw`bg-primary rounded-lg py-3 px-4`}
              onPress={handleSaveName}
              disabled={saving || displayName.trim() === currentMember?.display_name}
            >
              {saving ? (
                <View style={tw`flex-row items-center justify-center gap-2`}>
                  <ActivityIndicator size="small" color="#f5f1ed" />
                  <Text style={tw`text-white text-base font-medium`}>Lagrer...</Text>
                </View>
              ) : (
                <Text style={tw`text-white text-base font-medium text-center`}>
                  Lagre navn
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Settings Section */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider`}>
            Konto
          </Text>

          {/* Reset Onboarding Button (for testing) */}
          <TouchableOpacity
            style={tw`bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-3`}
            onPress={() => {
              Alert.alert(
                'Kjør onboarding på nytt',
                'Dette vil la deg gå gjennom onboardingen på nytt og oppdatere innstillingene dine.',
                [
                  { text: 'Avbryt', style: 'cancel' },
                  {
                    text: 'Kjør på nytt',
                    onPress: () => {
                      forceOnboarding();
                      navigation.goBack();
                    },
                  },
                ]
              );
            }}
          >
            <Text style={tw`text-secondary text-base font-medium`}>Kjør onboarding på nytt</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={tw`bg-slate-800/50 rounded-lg p-4 border border-slate-700`}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <View style={tw`flex-row items-center justify-center gap-2`}>
                <ActivityIndicator size="small" color="#d17166" />
                <Text style={tw`text-error text-base`}>Logger ut...</Text>
              </View>
            ) : (
              <Text style={tw`text-error text-base font-medium`}>Logg ut</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
