import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import tw from '../lib/tw';
import EquipmentList from '../components/EquipmentList';
import AddEquipmentItem from '../components/AddEquipmentItem';

interface EquipmentItem {
  key: string;
  label: string;
  is_critical: boolean;
}

export default function EquipmentManagementScreen({ navigation }: any) {
  const { user, householdId } = useHousehold();
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [equipmentLoading, setEquipmentLoading] = useState(false);

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
            onPress: async (newLabel?: string) => {
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

          <Text style={[tw`text-3xl font-bold text-white mb-2`, { fontFamily: 'Manrope_400Regular' }]}>Utstyrsliste</Text>
          <Text style={[tw`text-sm text-text-muted mb-6`, { fontFamily: 'Manrope_400Regular' }]}>
            Administrer utstyr som skal med til barnehagen
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
