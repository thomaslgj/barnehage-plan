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

  // Step 3: Equipment items
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItemDraft[]>(
    DEFAULT_EQUIPMENT_ITEMS.map(item => ({ ...item }))
  );
  const [newItemLabel, setNewItemLabel] = useState('');

  // Step 4: Schedule template (optional)
  const [setupTemplate, setSetupTemplate] = useState(false);
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, number>>({});

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
        // Android doesn't have Alert.prompt, show simple alert
        Alert.alert(
          'Endre navn',
          'For å endre navn på ' + item.label + ', vennligst bruk iOS eller web-versjonen.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleCreateHousehold = async () => {
    if (!myName.trim()) {
      Alert.alert('Feil', 'Vennligst skriv inn ditt navn');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('bootstrap_household', {
        p_name: householdName.trim() || null,
        p_my_display_name: myName.trim(),
        p_partner_display_name: partnerName.trim() || null,
      });

      if (error) throw error;

      // TODO: Save equipment items and template if provided

      Alert.alert('Suksess', 'Husholdning opprettet!');
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
        {step === 4 && (
          <View style={tw`flex-1`}>
            <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Standard uke?</Text>
            <Text style={tw`text-base text-slate-300 text-center mb-6`}>
              Du kan sette opp en standarduke nå, eller hoppe over og gjøre det senere
            </Text>

            <TouchableOpacity
              style={tw`bg-primary rounded py-3.5 items-center mb-3`}
              onPress={() => {
                // TODO: Show schedule template setup
                setSetupTemplate(true);
              }}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
