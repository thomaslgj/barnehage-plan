import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import tw from '../lib/tw';
import { DEFAULT_EQUIPMENT_ITEMS } from '../lib/equipment';

interface EquipmentItemDraft {
  key: string;
  label: string;
}

export default function OnboardingScreen() {
  const { refresh } = useHousehold();
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [step, setStep] = useState(1); // Step 1-4
  const [loading, setLoading] = useState(false);

  // Step 1: Household name
  const [householdName, setHouseholdName] = useState('');

  // Step 2: Parent names
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');

  // Android rename modal state
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameItemKey, setRenameItemKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Step 3: Equipment items
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItemDraft[]>(
    DEFAULT_EQUIPMENT_ITEMS.map(item => ({ ...item }))
  );
  const [newItemLabel, setNewItemLabel] = useState('');

  // Step 4: Schedule template (optional)
  const [setupTemplate, setSetupTemplate] = useState(false);
  // Key format: "dayOfWeek-slot" e.g. "1-dropoff" for Monday dropoff
  // Value: 0 (person 1), 1 (person 2), or null (unassigned)
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, number | null>>({});

  // Join household fields
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleAddEquipmentItem = () => {
    if (!newItemLabel.trim()) return;

    const newKey = newItemLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setEquipmentItems([...equipmentItems, { key: newKey, label: newItemLabel.trim() }]);
    setNewItemLabel('');
  };

  const handleRemoveEquipmentItem = (key: string) => {
    setEquipmentItems(equipmentItems.filter(item => item.key !== key));
  };

  const handleRenameEquipmentItem = (key: string) => {
    const item = equipmentItems.find(i => i.key === key);
    if (!item) return;

    // Use browser prompt on web, or create a simple implementation
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const newLabel = window.prompt('Nytt navn for ' + item.label, item.label);
      if (newLabel && newLabel.trim()) {
        setEquipmentItems(
          equipmentItems.map(i =>
            i.key === key ? { ...i, label: newLabel.trim() } : i
          )
        );
      }
    } else {
      // On native, use Alert.prompt (iOS) or fallback
      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Endre navn',
          'Nytt navn for ' + item.label,
          [
            { text: 'Avbryt', style: 'cancel' },
            {
              text: 'Lagre',
              onPress: (newLabel) => {
                if (newLabel && newLabel.trim()) {
                  setEquipmentItems(
                    equipmentItems.map(i =>
                      i.key === key ? { ...i, label: newLabel.trim() } : i
                    )
                  );
                }
              },
            },
          ],
          'plain-text',
          item.label
        );
      } else {
        // Android - use custom modal
        setRenameItemKey(key);
        setRenameValue(item.label);
        setRenameModalVisible(true);
      }
    }
  };

  const handleRenameConfirm = () => {
    if (renameItemKey && renameValue.trim()) {
      setEquipmentItems(
        equipmentItems.map(i =>
          i.key === renameItemKey ? { ...i, label: renameValue.trim() } : i
        )
      );
    }
    setRenameModalVisible(false);
    setRenameItemKey(null);
    setRenameValue('');
  };

  const handleTemplateSlotPress = (dayOfWeek: number, slot: 'dropoff' | 'pickup') => {
    const key = `${dayOfWeek}-${slot}`;
    const currentValue = templateAssignments[key];

    // Cycle through: null -> 0 (person1) -> 1 (person2) -> null
    let nextValue: number | null;
    if (currentValue === null || currentValue === undefined) {
      nextValue = 0;
    } else if (currentValue === 0) {
      nextValue = partnerName.trim() ? 1 : null;
    } else {
      nextValue = null;
    }

    setTemplateAssignments(prev => ({
      ...prev,
      [key]: nextValue,
    }));
  };

  const getTemplateSlotName = (dayOfWeek: number, slot: 'dropoff' | 'pickup'): string | null => {
    const key = `${dayOfWeek}-${slot}`;
    const personIndex = templateAssignments[key];
    if (personIndex === 0) return myName.trim() || 'Person 1';
    if (personIndex === 1) return partnerName.trim() || 'Person 2';
    return null;
  };

  const getTemplateSlotColor = (dayOfWeek: number, slot: 'dropoff' | 'pickup'): string => {
    const key = `${dayOfWeek}-${slot}`;
    const personIndex = templateAssignments[key];
    if (personIndex === 0) return 'bg-primary/20 border-primary/50'; // Person 1: emerald
    if (personIndex === 1) return 'bg-secondary/20 border-secondary/50'; // Person 2: amber
    return 'bg-slate-700/50 border-slate-600/50';
  };

  const handleCreateHousehold = async () => {
    if (!myName.trim()) {
      Alert.alert('Feil', 'Vennligst skriv inn ditt navn');
      return;
    }

    setLoading(true);
    try {
      // Check if user already has a household (e.g., testing onboarding)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: existingMemberships } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .limit(1);

      let household_id: string;
      let child_id: string;

      if (existingMemberships && existingMemberships.length > 0) {
        // User already has a household - use existing
        household_id = existingMemberships[0].household_id;

        // Get child_id
        const { data: children } = await supabase
          .from('children')
          .select('id')
          .eq('household_id', household_id)
          .limit(1);

        if (!children || children.length === 0) {
          throw new Error('No child found for existing household');
        }
        child_id = children[0].id;
      } else {
        // Create new household
        const { data: householdData, error: householdError } = await supabase.rpc('bootstrap_household', {
          p_name: householdName.trim() || null,
          p_my_display_name: myName.trim(),
          p_partner_display_name: partnerName.trim() || null,
        });

        if (householdError) throw householdError;

        const result = householdData as { household_id: string; child_id: string };
        household_id = result.household_id;
        child_id = result.child_id;
      }

      // Get household members to map names to member_ids
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select('id, user_id, display_name')
        .eq('household_id', household_id);

      if (membersError) throw membersError;

      // Sort members: current user first (person 1), then others (person 2)
      const members = (membersData || []).sort((a, b) => {
        if (a.user_id === user.id) return -1;
        if (b.user_id === user.id) return 1;
        return 0;
      });

      // Save equipment items (delete old ones first if re-onboarding)
      if (equipmentItems.length > 0) {
        // Delete existing equipment items
        await supabase
          .from('equipment_items')
          .delete()
          .eq('household_id', household_id);

        const equipmentRows = equipmentItems.map((item, index) => ({
          household_id,
          key: item.key,
          label: item.label,
          sort_order: index,
          active: true,
          updated_by: user.id,
        }));

        const { error: equipmentError } = await supabase
          .from('equipment_items')
          .insert(equipmentRows);

        if (equipmentError) console.error('Error saving equipment:', equipmentError);
      }

      // Save schedule template if setup (delete old ones first if re-onboarding)
      if (setupTemplate && Object.keys(templateAssignments).length > 0) {
        // Delete existing templates
        await supabase
          .from('schedule_templates')
          .delete()
          .eq('household_id', household_id)
          .eq('child_id', child_id);

        const templateRows = Object.entries(templateAssignments)
          .filter(([_, personIndex]) => personIndex !== null)
          .map(([key, personIndex]) => {
            const [dayOfWeek, slot] = key.split('-');
            const member = members[personIndex as number];
            console.log(`Template mapping: ${key} -> personIndex ${personIndex} -> member:`, member);
            return {
              household_id,
              child_id,
              weekday: parseInt(dayOfWeek),
              slot,
              assigned_member_id: member?.id || null,
              assigned_user_id: member?.user_id || null,
              updated_by: user.id,
            };
          });

        console.log('Saving template rows:', templateRows);

        if (templateRows.length > 0) {
          const { error: templateError } = await supabase
            .from('schedule_templates')
            .insert(templateRows);

          if (templateError) console.error('Error saving template:', templateError);
          else console.log('Template saved successfully');
        }
      }

      Alert.alert('Suksess', existingMemberships && existingMemberships.length > 0 ? 'Innstillinger oppdatert!' : 'Husholdning opprettet!');
      await refresh();
    } catch (error) {
      console.error('Create household error:', error);
      Alert.alert('Feil', error instanceof Error ? error.message : 'Kunne ikke opprette husholdning');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Feil', 'Vennligst skriv inn invitasjonskode');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('accept_household_invite', {
        invite_code: inviteCode.trim(),
        display_name: displayName.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Suksess', 'Du er nå med i husholdningen!');
      await refresh();
    } catch (error) {
      console.error('Join household error:', error);
      Alert.alert('Feil', error instanceof Error ? error.message : 'Kunne ikke bli med i husholdning');
    } finally {
      setLoading(false);
    }
  };

  // Choice screen
  if (mode === 'choice') {
    return (
      <View style={tw`flex-1 bg-background`}>
        <View style={tw`flex-1 justify-center px-6`}>
          <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Velkommen!</Text>
          <Text style={tw`text-base text-slate-300 text-center mb-8`}>
            Vil du opprette en ny husholdning eller bli med i en eksisterende?
          </Text>

          <TouchableOpacity
            style={tw`bg-primary rounded-lg p-5 mb-4`}
            onPress={() => { setMode('create'); setStep(1); }}
          >
            <Text style={tw`text-lg font-semibold text-white mb-1`}>Opprett ny husholdning</Text>
            <Text style={tw`text-sm text-white/90`}>
              Start fra bunnen av og inviter andre senere
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-info rounded-lg p-5`}
            onPress={() => setMode('join')}
          >
            <Text style={tw`text-lg font-semibold text-white mb-1`}>Bli med i husholdning</Text>
            <Text style={tw`text-sm text-white/90`}>
              Bruk invitasjonskode fra din husholdning
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Join household screen
  if (mode === 'join') {
    return (
      <KeyboardAvoidingView
        style={tw`flex-1 bg-background`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Bli med i husholdning</Text>
          <Text style={tw`text-base text-slate-300 text-center mb-8`}>
            Skriv inn invitasjonskoden du har fått
          </Text>

          <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Invitasjonskode *</Text>
          <TextInput
            style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-4 text-white`}
            placeholder="Skriv inn kode"
            placeholderTextColor="#94a3b8"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            editable={!loading}
          />

          <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Ditt navn (valgfritt)</Text>
          <TextInput
            style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-4 text-white`}
            placeholder="Hvordan andre vil se deg"
            placeholderTextColor="#94a3b8"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!loading}
          />

          <TouchableOpacity
            style={tw.style(`bg-primary rounded py-3.5 items-center mt-2`, loading && 'opacity-50')}
            onPress={handleJoinHousehold}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={tw`text-white text-base font-semibold`}>Bli med</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`mt-4 py-3`}
            onPress={() => setMode('choice')}
            disabled={loading}
          >
            <Text style={tw`text-slate-400 text-sm text-center`}>Tilbake</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Create household - Multi-step form
  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-background`}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress indicator */}
        <View style={tw`flex-row justify-center mb-8 gap-2`}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={tw.style(
                'w-12 h-1.5 rounded-full',
                s <= step ? 'bg-primary' : 'bg-slate-700'
              )}
            />
          ))}
        </View>

        {/* Step 1: Household name */}
        {step === 1 && (
          <View style={tw`flex-1 justify-center`}>
            <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Hva heter husholdningen?</Text>
            <Text style={tw`text-base text-slate-300 text-center mb-8`}>
              Dette er valgfritt, du kan også la det stå tomt
            </Text>

            <TextInput
              style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-6 text-white`}
              placeholder="F.eks. Familie Hansen"
              placeholderTextColor="#94a3b8"
              value={householdName}
              onChangeText={setHouseholdName}
              editable={!loading}
              autoFocus
            />

            <TouchableOpacity
              style={tw`bg-primary rounded py-3.5 items-center`}
              onPress={() => setStep(2)}
            >
              <Text style={tw`text-white text-base font-semibold`}>Neste</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`mt-4 py-3`}
              onPress={() => setMode('choice')}
            >
              <Text style={tw`text-slate-400 text-sm text-center`}>Tilbake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Parent names */}
        {step === 2 && (
          <View style={tw`flex-1 justify-center`}>
            <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Hvem er foreldrene?</Text>
            <Text style={tw`text-base text-slate-300 text-center mb-8`}>
              Disse navnene brukes i planleggingen
            </Text>

            <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Ditt navn *</Text>
            <TextInput
              style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-4 text-white`}
              placeholder="Ditt navn"
              placeholderTextColor="#94a3b8"
              value={myName}
              onChangeText={setMyName}
              editable={!loading}
              autoFocus
            />

            <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Partner (valgfritt)</Text>
            <TextInput
              style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-6 text-white`}
              placeholder="Partnerens navn"
              placeholderTextColor="#94a3b8"
              value={partnerName}
              onChangeText={setPartnerName}
              editable={!loading}
            />

            <TouchableOpacity
              style={tw.style('bg-primary rounded py-3.5 items-center', !myName.trim() && 'opacity-50')}
              onPress={() => myName.trim() && setStep(3)}
              disabled={!myName.trim()}
            >
              <Text style={tw`text-white text-base font-semibold`}>Neste</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`mt-4 py-3`}
              onPress={() => setStep(1)}
            >
              <Text style={tw`text-slate-400 text-sm text-center`}>Tilbake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Equipment customization */}
        {step === 3 && (
          <View style={tw`flex-1`}>
            <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Utstyr til barnehagen</Text>
            <Text style={tw`text-base text-slate-300 text-center mb-6`}>
              Tilpass listen etter dine behov
            </Text>

            <View style={tw`mb-6`}>
              {equipmentItems.map((item, index) => (
                <View key={item.key} style={tw`flex-row items-center justify-between mb-3 bg-slate-800/50 rounded-lg p-3`}>
                  <Text style={tw`text-white flex-1`}>{item.label}</Text>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      style={tw`bg-slate-700 rounded px-3 py-1.5`}
                      onPress={() => handleRenameEquipmentItem(item.key)}
                    >
                      <Text style={tw`text-slate-300 text-sm`}>Endre</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tw`bg-error/20 rounded px-3 py-1.5`}
                      onPress={() => handleRemoveEquipmentItem(item.key)}
                    >
                      <Text style={tw`text-error text-sm`}>Slett</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Legg til nytt</Text>
              <View style={tw`flex-row gap-2`}>
                <TextInput
                  style={tw`flex-1 bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-white`}
                  placeholder="Navn på utstyr"
                  placeholderTextColor="#94a3b8"
                  value={newItemLabel}
                  onChangeText={setNewItemLabel}
                />
                <TouchableOpacity
                  style={tw.style('bg-primary rounded px-4 py-3', !newItemLabel.trim() && 'opacity-50')}
                  onPress={handleAddEquipmentItem}
                  disabled={!newItemLabel.trim()}
                >
                  <Text style={tw`text-white font-semibold`}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={tw`bg-primary rounded py-3.5 items-center mb-2`}
              onPress={() => setStep(4)}
            >
              <Text style={tw`text-white text-base font-semibold`}>Neste</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`mt-2 py-3`}
              onPress={() => setStep(2)}
            >
              <Text style={tw`text-slate-400 text-sm text-center`}>Tilbake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Schedule template (optional) */}
        {step === 4 && !setupTemplate && (
          <View style={tw`flex-1`}>
            <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Standard uke?</Text>
            <Text style={tw`text-base text-slate-300 text-center mb-6`}>
              Du kan sette opp en standarduke nå, eller hoppe over og gjøre det senere
            </Text>

            <TouchableOpacity
              style={tw`bg-primary rounded py-3.5 items-center mb-3`}
              onPress={() => setSetupTemplate(true)}
            >
              <Text style={tw`text-white text-base font-semibold`}>Sett opp standarduke</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`bg-slate-700 rounded py-3.5 items-center mb-6`}
              onPress={handleCreateHousehold}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={tw`text-white text-base font-semibold`}>Hopp over</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`mt-2 py-3`}
              onPress={() => setStep(3)}
            >
              <Text style={tw`text-slate-400 text-sm text-center`}>Tilbake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4b: Setup template */}
        {step === 4 && setupTemplate && (
          <View style={tw`flex-1`}>
            <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Standard uke</Text>
            <Text style={tw`text-base text-slate-300 text-center mb-4`}>
              Trykk på hver rute for å velge hvem som har ansvar
            </Text>

            {/* Header */}
            <View style={tw`flex-row gap-2 mb-2 px-1`}>
              <View style={tw`w-16`} />
              <View style={tw`flex-1 items-center`}>
                <Text style={tw`text-xs font-medium text-slate-400`}>Levering</Text>
              </View>
              <View style={tw`flex-1 items-center`}>
                <Text style={tw`text-xs font-medium text-slate-400`}>Henting</Text>
              </View>
            </View>

            {/* Days */}
            {[
              { day: 1, label: 'Man' },
              { day: 2, label: 'Tir' },
              { day: 3, label: 'Ons' },
              { day: 4, label: 'Tor' },
              { day: 5, label: 'Fre' },
            ].map(({ day, label }) => (
              <View key={day} style={tw`flex-row gap-2 mb-2`}>
                <View style={tw`w-16 justify-center`}>
                  <Text style={tw`text-sm font-semibold text-slate-300`}>{label}</Text>
                </View>

                {/* Dropoff slot */}
                <TouchableOpacity
                  style={tw.style(
                    'flex-1 p-3 rounded-lg border',
                    getTemplateSlotColor(day, 'dropoff')
                  )}
                  onPress={() => handleTemplateSlotPress(day, 'dropoff')}
                >
                  <Text style={tw`text-sm text-center text-white`}>
                    {getTemplateSlotName(day, 'dropoff') || '—'}
                  </Text>
                </TouchableOpacity>

                {/* Pickup slot */}
                <TouchableOpacity
                  style={tw.style(
                    'flex-1 p-3 rounded-lg border',
                    getTemplateSlotColor(day, 'pickup')
                  )}
                  onPress={() => handleTemplateSlotPress(day, 'pickup')}
                >
                  <Text style={tw`text-sm text-center text-white`}>
                    {getTemplateSlotName(day, 'pickup') || '—'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={tw`bg-primary rounded py-3.5 items-center mb-2 mt-4`}
              onPress={handleCreateHousehold}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={tw`text-white text-base font-semibold`}>Fullfør</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`mt-2 py-3`}
              onPress={() => setSetupTemplate(false)}
            >
              <Text style={tw`text-slate-400 text-sm text-center`}>Tilbake</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Android Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black/50`}>
          <View style={tw`bg-slate-800 rounded-lg p-6 w-80 mx-4`}>
            <Text style={tw`text-white text-lg font-semibold mb-4`}>
              Endre navn
            </Text>
            <TextInput
              style={tw`bg-slate-700 text-white p-3 rounded-lg mb-4`}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Nytt navn"
              placeholderTextColor="#94a3b8"
              autoFocus
            />
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 py-3 bg-slate-700 rounded-lg`}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={tw`text-white text-center font-medium`}>
                  Avbryt
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 py-3 bg-primary rounded-lg`}
                onPress={handleRenameConfirm}
              >
                <Text style={tw`text-white text-center font-semibold`}>
                  Lagre
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
