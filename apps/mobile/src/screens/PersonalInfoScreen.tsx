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
import AvatarPicker from '../components/AvatarPicker';

export default function PersonalInfoScreen({ navigation }: any) {
  const [saving, setSaving] = useState(false);
  const { user, members, refresh } = useHousehold();

  // Get current user's member record
  const currentMember = members.find(m => m.user_id === user?.id);

  // State for editable name and avatar
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState<string | null>(null);

  // Load current display name and avatar
  useEffect(() => {
    if (currentMember?.display_name) {
      setDisplayName(currentMember.display_name);
    }
    if (currentMember?.avatar_id) {
      setAvatarId(currentMember.avatar_id);
    }
  }, [currentMember]);

  const handleSave = async () => {
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
      const updateData: { display_name: string; avatar_id?: string | null } = {
        display_name: displayName.trim()
      };

      // Only update avatar_id if it has changed
      if (avatarId !== currentMember.avatar_id) {
        updateData.avatar_id = avatarId;
      }

      const { error } = await supabase
        .from('household_members')
        .update(updateData)
        .eq('id', currentMember.id);

      if (error) throw error;

      // Refresh household data to show updated info
      await refresh();

      Alert.alert('Lagret', 'Profilen din er oppdatert');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Feil', 'Kunne ikke lagre profilen');
    } finally {
      setSaving(false);
    }
  };

  const isUnchanged = displayName.trim() === currentMember?.display_name && avatarId === currentMember?.avatar_id;

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

          {/* Profile Section */}
          <View style={tw`bg-slate-800/50 rounded-lg p-4 border border-slate-700`}>
            <Text style={tw`text-sm text-text-muted mb-2`}>Ditt navn</Text>

            <TextInputField
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ditt navn"
              autoCapitalize="words"
              editable={!saving}
            />

            <View style={tw`mt-4 mb-4`}>
              <AvatarPicker
                selectedAvatarId={avatarId}
                onSelect={setAvatarId}
              />
            </View>

            <Button
              variant="primary"
              onPress={handleSave}
              disabled={saving || isUnchanged}
              loading={saving}
              fullWidth
            >
              {saving ? 'Lagrer...' : 'Lagre endringer'}
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
