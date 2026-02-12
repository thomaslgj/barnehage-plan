import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import tw from '../lib/tw';
import EquipmentList from '../components/EquipmentList';
import AddEquipmentItem from '../components/AddEquipmentItem';

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { forceOnboarding, user, members, householdId, refresh } = useHousehold();

  // Get current user's member record
  const currentMember = members.find(m => m.user_id === user?.id);

  // State for editable name
  const [displayName, setDisplayName] = useState('');

  // Equipment management state
  interface EquipmentItem {
    key: string;
    label: string;
    is_critical: boolean;
  }
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [equipmentLoading, setEquipmentLoading] = useState(false);

  // Load current display name
  useEffect(() => {
    if (currentMember?.display_name) {
      setDisplayName(currentMember.display_name);
    }
  }, [currentMember]);

  // Load equipment items
  useEffect(() => {
    if (householdId) {
      loadEquipment();
    }
  }, [householdId]);

  const loadEquipment = async () => {
    if (!householdId) return;

    try {
      const { data, error } = await supabase
        .from('equipment_items')
        .select('key, label, is_critical')
        .eq('household_id', householdId)
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;

      setEquipmentItems(
        (data || []).map(item => ({
          key: item.key,
          label: item.label,
          is_critical: item.is_critical ?? false,
        }))
      );
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

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

  const handleAddEquipmentItem = async () => {
    if (!newItemLabel.trim() || !householdId || !user) return;

    setEquipmentLoading(true);
    try {
      const newKey = newItemLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      // Check if key already exists
      if (equipmentItems.some(item => item.key === newKey)) {
        Alert.alert('Feil', 'Et utstyr med dette navnet eksisterer allerede');
        setEquipmentLoading(false);
        return;
      }

      const { error } = await supabase
        .from('equipment_items')
        .insert({
          household_id: householdId,
          key: newKey,
          label: newItemLabel.trim(),
          is_critical: false,
          sort_order: equipmentItems.length,
          active: true,
          updated_by: user.id,
        });

      if (error) throw error;

      await loadEquipment();
      setNewItemLabel('');
    } catch (error) {
      console.error('Error adding equipment:', error);
      Alert.alert('Feil', 'Kunne ikke legge til utstyr');
    } finally {
      setEquipmentLoading(false);
    }
  };

  const handleRemoveEquipmentItem = async (key: string) => {
    if (!householdId) return;

    Alert.alert(
      'Slett utstyr',
      'Er du sikker på at du vil slette dette utstyret?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            setEquipmentLoading(true);
            try {
              const { error } = await supabase
                .from('equipment_items')
                .delete()
                .eq('household_id', householdId)
                .eq('key', key);

              if (error) throw error;

              await loadEquipment();
            } catch (error) {
              console.error('Error removing equipment:', error);
              Alert.alert('Feil', 'Kunne ikke slette utstyr');
            } finally {
              setEquipmentLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleCritical = async (key: string) => {
    if (!householdId) return;

    const item = equipmentItems.find(i => i.key === key);
    if (!item) return;

    setEquipmentLoading(true);
    try {
      const { error } = await supabase
        .from('equipment_items')
        .update({ is_critical: !item.is_critical })
        .eq('household_id', householdId)
        .eq('key', key);

      if (error) throw error;

      await loadEquipment();
    } catch (error) {
      console.error('Error toggling critical:', error);
      Alert.alert('Feil', 'Kunne ikke oppdatere kritikalitet');
    } finally {
      setEquipmentLoading(false);
    }
  };

  const handleRenameEquipmentItem = async (key: string) => {
    const item = equipmentItems.find(i => i.key === key);
    if (!item || !householdId) return;

    if (Platform.OS === 'web') {
      const newLabel = window.prompt('Nytt navn for ' + item.label, item.label);
      if (newLabel && newLabel.trim() && newLabel.trim() !== item.label) {
        await saveRenamedItem(key, newLabel.trim());
      }
    } else if (Platform.OS === 'ios') {
      Alert.prompt(
        'Endre navn',
        'Nytt navn for ' + item.label,
        [
          { text: 'Avbryt', style: 'cancel' },
          {
            text: 'Lagre',
            onPress: async (newLabel) => {
              if (newLabel && newLabel.trim() && newLabel.trim() !== item.label) {
                await saveRenamedItem(key, newLabel.trim());
              }
            },
          },
        ],
        'plain-text',
        item.label
      );
    } else {
      Alert.alert('Endre navn', 'Bruk onboarding for å endre navn på Android');
    }
  };

  const saveRenamedItem = async (key: string, newLabel: string) => {
    if (!householdId) return;

    setEquipmentLoading(true);
    try {
      const { error } = await supabase
        .from('equipment_items')
        .update({ label: newLabel })
        .eq('household_id', householdId)
        .eq('key', key);

      if (error) throw error;

      await loadEquipment();
    } catch (error) {
      console.error('Error renaming equipment:', error);
      Alert.alert('Feil', 'Kunne ikke endre navn');
    } finally {
      setEquipmentLoading(false);
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

        <Text style={[tw`text-3xl font-bold text-white mb-6`, { fontFamily: 'Manrope_400Regular' }]}>Profil & Innstillinger</Text>

        {/* Personal Settings Section */}
        <View style={tw`mb-6`}>
          <Text style={[tw`text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider`, { fontFamily: 'Manrope_400Regular' }]}>
            Personlige innstillinger
          </Text>

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
        </View>

        {/* Equipment Management Section */}
        <View style={tw`mb-6`}>
          <Text style={[tw`text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider`, { fontFamily: 'Manrope_400Regular' }]}>
            Utstyr til barnehagen
          </Text>

          {equipmentLoading && (
            <View style={tw`mb-3`}>
              <ActivityIndicator size="small" color="#7fa884" />
            </View>
          )}

          {equipmentItems.length > 0 ? (
            <>
              <EquipmentList
                items={equipmentItems}
                onToggleCritical={handleToggleCritical}
                onRename={handleRenameEquipmentItem}
                onRemove={handleRemoveEquipmentItem}
              />
              <View style={tw`mt-3`}>
                <AddEquipmentItem
                  value={newItemLabel}
                  onChangeText={setNewItemLabel}
                  onAdd={handleAddEquipmentItem}
                />
              </View>
            </>
          ) : (
            <View style={tw`bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-3`}>
              <Text style={[tw`text-text-light text-center text-sm mb-3`, { fontFamily: 'Manrope_400Regular' }]}>
                Ingen utstyr lagt til enda
              </Text>
              <AddEquipmentItem
                value={newItemLabel}
                onChangeText={setNewItemLabel}
                onAdd={handleAddEquipmentItem}
              />
            </View>
          )}
        </View>

        {/* Account Settings Section */}
        <View style={tw`mb-6`}>
          <Text style={[tw`text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider`, { fontFamily: 'Manrope_400Regular' }]}>
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
            <Text style={[tw`text-secondary text-base font-medium`, { fontFamily: 'Manrope_400Regular' }]}>Kjør onboarding på nytt</Text>
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
                <Text style={[tw`text-error text-base`, { fontFamily: 'Manrope_400Regular' }]}>Logger ut...</Text>
              </View>
            ) : (
              <Text style={[tw`text-error text-base font-medium`, { fontFamily: 'Manrope_400Regular' }]}>Logg ut</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
