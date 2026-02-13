import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import tw from '../lib/tw';
import { BackButton } from '../components/BackButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextInputField } from '../components/TextInputField';
import { Button } from '../components/Button';
import { Text } from '../components/Text';

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

  const isUnchanged = displayName.trim() === currentMember?.display_name;

  return (
    <View style={tw`flex-1 bg-background`}>
      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-4`}
        >
          <BackButton />

          <ScreenHeader
            title="Personlige opplysninger"
            subtitle="Rediger dine personlige opplysninger"
          />

          {/* Name Section */}
          <View style={tw`bg-slate-800/50 rounded-lg p-4 border border-slate-700`}>
            <Text style={tw`text-sm text-text-muted mb-2`}>Ditt navn</Text>

            <TextInputField
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ditt navn"
              autoCapitalize="words"
              editable={!saving}
            />

            <Button
              variant="primary"
              onPress={handleSaveName}
              disabled={saving || isUnchanged}
              loading={saving}
              fullWidth
            >
              {saving ? 'Lagrer...' : 'Lagre navn'}
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
