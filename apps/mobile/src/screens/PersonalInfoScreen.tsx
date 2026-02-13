import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import tw from '../lib/tw';

export default function PersonalInfoScreen({ navigation }: any) {
  const [saving, setSaving] = useState(false);
  const { user, members, refresh } = useHousehold();

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
            <Text style={[tw`text-2xl text-text-light`, { fontFamily: 'Manrope_400Regular' }]}>‹</Text>
            <Text style={[tw`text-base text-text-light`, { fontFamily: 'Manrope_400Regular' }]}>Tilbake</Text>
          </TouchableOpacity>

          <Text style={[tw`text-3xl font-bold text-white mb-2`, { fontFamily: 'Manrope_400Regular' }]}>Personlige opplysninger</Text>
          <Text style={[tw`text-sm text-text-muted mb-6`, { fontFamily: 'Manrope_400Regular' }]}>
            Rediger dine personlige opplysninger
          </Text>

          {/* Name Section */}
          <View style={tw`bg-slate-800/50 rounded-lg p-4 border border-slate-700`}>
            <Text style={[tw`text-sm text-text-muted mb-2`, { fontFamily: 'Manrope_400Regular' }]}>Ditt navn</Text>
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
                  <Text style={[tw`text-white text-base font-medium`, { fontFamily: 'Manrope_400Regular' }]}>Lagrer...</Text>
                </View>
              ) : (
                <Text style={[tw`text-white text-base font-medium text-center`, { fontFamily: 'Manrope_400Regular' }]}>
                  Lagre navn
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
