import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  Linking,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import tw from '../lib/tw';
import { Text } from '../components/Text';
import { DEFAULT_EQUIPMENT_ITEMS } from '../lib/equipment';
import SuccessIllustration from '../components/SuccessIllustration';
import EquipmentList from '../components/EquipmentList';
import AddEquipmentItem from '../components/AddEquipmentItem';
import AvatarPicker from '../components/AvatarPicker';

interface EquipmentItemDraft {
  key: string;
  label: string;
  is_critical: boolean;
}

// Helper function to generate and save invite code for existing household
async function generateInviteCodeForHousehold(householdId: string): Promise<string | null> {
  try {
    // Call the RPC function to generate and save a unique invite code
    const { data: newCode, error } = await supabase.rpc('regenerate_household_invite_code', {
      p_household_id: householdId,
    });

    if (error) {
      console.error('Error generating invite code:', error);
      return null;
    }

    return newCode as string;
  } catch (error) {
    console.error('Error in generateInviteCodeForHousehold:', error);
    return null;
  }
}

export default function OnboardingScreen() {
  const { refresh } = useHousehold();
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [step, setStep] = useState(1); // Step 1-5 (+ success screen)
  const [loading, setLoading] = useState(false);

  // Step 1: My name
  const [myName, setMyName] = useState('');
  const [myAvatarId, setMyAvatarId] = useState<string | null>(null);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  // Step 2: Partner name
  const [partnerName, setPartnerName] = useState('');
  const [partnerAvatarId, setPartnerAvatarId] = useState<string | null>(null);

  // Step 3: Child name
  const [childName, setChildName] = useState('');

  // Generated invite code (shown after creation)
  const [generatedInviteCode, setGeneratedInviteCode] = useState<string | null>(null);

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
  const [placeholderNameFromInvite, setPlaceholderNameFromInvite] = useState<string | null>(null);
  const [fetchingPlaceholderName, setFetchingPlaceholderName] = useState(false);

  // Load existing equipment items if re-onboarding
  useEffect(() => {
    const loadExistingEquipment = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user already has a household
        const { data: memberships } = await supabase
          .from('household_members')
          .select('household_id')
          .eq('user_id', user.id)
          .limit(1);

        if (memberships && memberships.length > 0) {
          const household_id = memberships[0].household_id;

          // Fetch existing equipment items
          const { data: existingEquipment } = await supabase
            .from('equipment_items')
            .select('key, label, is_critical')
            .eq('household_id', household_id)
            .eq('active', true)
            .order('sort_order');

          if (existingEquipment && existingEquipment.length > 0) {
            console.log('Loading existing equipment for re-onboarding:', existingEquipment);
            setEquipmentItems(existingEquipment.map(item => ({
              key: item.key,
              label: item.label,
              is_critical: item.is_critical ?? false,
            })));
          }
        }
      } catch (error) {
        console.error('Error loading existing equipment:', error);
      }
    };

    loadExistingEquipment();
  }, []);

  const handleAddEquipmentItem = () => {
    if (!newItemLabel.trim()) return;

    const newKey = newItemLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setEquipmentItems([...equipmentItems, { key: newKey, label: newItemLabel.trim(), is_critical: false }]);
    setNewItemLabel('');
  };

  const handleRemoveEquipmentItem = (key: string) => {
    setEquipmentItems(equipmentItems.filter(item => item.key !== key));
  };

  const handleToggleCritical = (key: string) => {
    setEquipmentItems(equipmentItems.map(item =>
      item.key === key ? { ...item, is_critical: !item.is_critical } : item
    ));
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
      let isNewHousehold = false;

      if (existingMemberships && existingMemberships.length > 0) {
        // User already has a household - use existing
        household_id = existingMemberships[0].household_id;

        // Get child_id and household invite code
        const { data: children } = await supabase
          .from('children')
          .select('id')
          .eq('household_id', household_id)
          .limit(1);

        if (!children || children.length === 0) {
          throw new Error('No child found for existing household');
        }
        child_id = children[0].id;

        // Get invite code from existing household
        const { data: householdData } = await supabase
          .from('households')
          .select('invite_code')
          .eq('id', household_id)
          .single();

        if (householdData?.invite_code) {
          setGeneratedInviteCode(householdData.invite_code);
        } else {
          // Old household without invite code - generate one
          const newInviteCode = await generateInviteCodeForHousehold(household_id);
          if (newInviteCode) {
            setGeneratedInviteCode(newInviteCode);
          }
        }

        // Always show success screen for re-onboarding
        isNewHousehold = true;

        console.log('Re-onboarding: Updating existing household');
        console.log('Child name to update:', childName.trim() || '(empty)');
        console.log('My name to update:', myName.trim() || '(empty)');
        console.log('Partner name to update:', partnerName.trim() || '(empty)');

        // Update child name if provided
        if (childName.trim()) {
          const { error: childUpdateError } = await supabase
            .from('children')
            .update({ name: childName.trim() })
            .eq('id', child_id);

          if (childUpdateError) {
            console.error('Error updating child name:', childUpdateError);
          } else {
            console.log('Child name updated successfully to:', childName.trim());
          }
        }

        // Update member names and avatars
        // Update current user's display name and avatar
        if (myName.trim()) {
          const updateData: { display_name: string; avatar_id?: string } = {
            display_name: myName.trim()
          };
          if (myAvatarId) {
            updateData.avatar_id = myAvatarId;
          }

          const { error: myNameError } = await supabase
            .from('household_members')
            .update(updateData)
            .eq('household_id', household_id)
            .eq('user_id', user.id);

          if (myNameError) {
            console.error('Error updating my name:', myNameError);
          } else {
            console.log('My name updated successfully to:', myName.trim());
          }
        }

        // Update partner's display name (find any member that's not the current user)
        if (partnerName.trim()) {
          // Fetch all members and find the one that's not the current user
          const { data: allMembers, error: membersFetchError } = await supabase
            .from('household_members')
            .select('id, display_name, user_id')
            .eq('household_id', household_id);

          if (membersFetchError) {
            console.error('Error fetching household members:', membersFetchError);
          } else if (allMembers) {
            // Find partner (any member that's not the current user)
            const partnerMember = allMembers.find(m => m.user_id !== user.id);

            console.log('All members:', allMembers);
            console.log('Partner member found:', partnerMember);

            if (partnerMember) {
              const updateData: { display_name: string; avatar_id?: string } = {
                display_name: partnerName.trim()
              };
              if (partnerAvatarId) {
                updateData.avatar_id = partnerAvatarId;
              }

              const { error: partnerUpdateError } = await supabase
                .from('household_members')
                .update(updateData)
                .eq('id', partnerMember.id);

              if (partnerUpdateError) {
                console.error('Error updating partner name:', partnerUpdateError);
              } else {
                console.log('Partner name updated successfully to:', partnerName.trim());
              }
            } else {
              console.log('No partner member found to update');
            }
          }
        }
      } else {
        // Create new household
        isNewHousehold = true;

        const childNameValue = childName.trim() || 'Barn';
        console.log('Creating household with child name:', childNameValue);

        const { data: householdData, error: householdError } = await supabase.rpc('bootstrap_household', {
          p_name: `${myName.trim()}${partnerName.trim() ? ' & ' + partnerName.trim() : ''}`,
          p_my_display_name: myName.trim(),
          p_partner_display_name: partnerName.trim() || null,
          p_child_name: childNameValue,
        });

        console.log('Household created, result:', householdData);

        if (householdError) throw householdError;

        const result = householdData as { household_id: string; child_id: string; invite_code: string };
        household_id = result.household_id;
        child_id = result.child_id;

        // Save invite code to show later
        setGeneratedInviteCode(result.invite_code);

        // Update avatar IDs for newly created members
        if (myAvatarId) {
          await supabase
            .from('household_members')
            .update({ avatar_id: myAvatarId })
            .eq('household_id', household_id)
            .eq('user_id', user.id);
        }

        if (partnerAvatarId && partnerName.trim()) {
          // Find partner member (not current user)
          const { data: partnerMembers } = await supabase
            .from('household_members')
            .select('id')
            .eq('household_id', household_id)
            .neq('user_id', user.id)
            .limit(1);

          if (partnerMembers && partnerMembers.length > 0) {
            await supabase
              .from('household_members')
              .update({ avatar_id: partnerAvatarId })
              .eq('id', partnerMembers[0].id);
          }
        }
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
        // Delete existing equipment status for child (to avoid orphan records)
        await supabase
          .from('equipment_status')
          .delete()
          .eq('child_id', child_id);

        // Delete existing equipment items
        await supabase
          .from('equipment_items')
          .delete()
          .eq('household_id', household_id);

        const equipmentRows = equipmentItems.map((item, index) => ({
          household_id,
          key: item.key,
          label: item.label,
          is_critical: item.is_critical,
          sort_order: index,
          active: true,
          updated_by: user.id,
        }));

        const { error: equipmentError } = await supabase
          .from('equipment_items')
          .insert(equipmentRows);

        if (equipmentError) console.error('Error saving equipment:', equipmentError);

        // Seed equipment status for all selected items (initial status: 'ok')
        const statusRows = equipmentItems.map((item) => ({
          child_id,
          item_key: item.key,
          status: 'ok',
          updated_by: user.id,
        }));

        const { error: statusError } = await supabase
          .from('equipment_status')
          .insert(statusRows);

        if (statusError) console.error('Error seeding equipment status:', statusError);
      }

      // Save schedule template if setup (delete old ones first if re-onboarding)
      if (setupTemplate && Object.keys(templateAssignments).length > 0) {
        // Delete existing templates
        await supabase
          .from('schedule_templates')
          .delete()
          .eq('household_id', household_id)
          .eq('child_id', child_id);

        // Also delete all existing schedule assignments so they get recreated from new templates
        await supabase
          .from('schedule_assignments')
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

      // If new household was created, show success screen with invite code
      if (isNewHousehold) {
        console.log('New household created, showing success screen');
        console.log('generatedInviteCode:', generatedInviteCode);
        setStep(6); // Go to success screen
      } else {
        // Re-onboarding (testing), just refresh
        Alert.alert('Suksess', 'Innstillinger oppdatert!');
        await refresh();
      }
    } catch (error) {
      console.error('Create household error:', error);
      Alert.alert('Feil', error instanceof Error ? error.message : 'Kunne ikke opprette husholdning');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceholderName = async (code: string) => {
    if (!code.trim()) return;

    setFetchingPlaceholderName(true);
    try {
      const { data, error } = await supabase.rpc('get_placeholder_name_for_invite', {
        p_invite_code: code.trim(),
      });

      if (error) {
        console.error('Error fetching placeholder name:', error);
        return;
      }

      if (data) {
        setPlaceholderNameFromInvite(data as string);
        setDisplayName(data as string); // Pre-fill the field
      }
    } catch (error) {
      console.error('Error fetching placeholder name:', error);
    } finally {
      setFetchingPlaceholderName(false);
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

      // Provide more user-friendly error messages
      let errorMessage = 'Kunne ikke bli med i husholdning';
      if (error instanceof Error) {
        if (error.message.includes('already a member')) {
          errorMessage = 'Du er allerede medlem av denne husholdningen';
        } else if (error.message.includes('Invalid invite code')) {
          errorMessage = 'Ugyldig invitasjonskode';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Feil', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Choice screen
  if (mode === 'choice') {
    return (
      <View style={tw`flex-1 bg-background`}>
        <View style={tw`flex-1 justify-center px-6`}>
          <Text style={tw`text-4xl font-bold text-white text-center mb-10`}>
            Kom i gang
          </Text>

          <TouchableOpacity
            style={tw`bg-primary rounded-lg p-5 mb-4`}
            onPress={() => { setMode('create'); setStep(1); }}
          >
            <Text style={tw`text-xl font-semibold text-white mb-1`}>Opprett husholdning</Text>
            <Text style={tw`text-sm text-white/80`}>
              For den som setter opp først
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-info rounded-lg p-5`}
            onPress={() => setMode('join')}
          >
            <Text style={tw`text-xl font-semibold text-white mb-1`}>Bli med</Text>
            <Text style={tw`text-sm text-white/80`}>
              Har du fått en invitasjonskode?
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
            style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-2 text-white text-center text-xl tracking-wider`}
            placeholder="ord-ord"
            placeholderTextColor="#a89985"
            value={inviteCode}
            onChangeText={setInviteCode}
            onBlur={() => fetchPlaceholderName(inviteCode)}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <Text style={tw`text-xs text-slate-400 text-center mb-4`}>
            F.eks. "eple-hund" eller "sol-katt"
          </Text>

          <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Ditt navn (valgfritt)</Text>
          <TextInput
            style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-2 text-white`}
            placeholder="Hvordan andre vil se deg"
            placeholderTextColor="#a89985"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!loading && !fetchingPlaceholderName}
          />
          {placeholderNameFromInvite && (
            <Text style={tw`text-xs text-emerald-400 mb-4`}>
              ✓ Dette navnet er satt av din partner - du kan endre det hvis du vil
            </Text>
          )}
          {fetchingPlaceholderName && (
            <View style={tw`flex-row items-center gap-2 mb-4`}>
              <ActivityIndicator size="small" color="#7fa884" />
              <Text style={tw`text-xs text-slate-400`}>Sjekker invitasjonskode...</Text>
            </View>
          )}

          <TouchableOpacity
            style={tw.style(`bg-primary rounded py-3.5 items-center mt-2`, loading && 'opacity-50')}
            onPress={handleJoinHousehold}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#f5f1ed" />
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
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={tw.style(
                'w-10 h-1.5 rounded-full',
                s <= step ? 'bg-primary' : 'bg-slate-700'
              )}
            />
          ))}
        </View>

        {/* Step 1: My name */}
        {step === 1 && (
          <View style={tw`flex-1 justify-center`}>
            <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Hva heter du?</Text>
            <Text style={tw`text-base text-slate-300 text-center mb-8`}>
              Dette navnet brukes i planleggingen
            </Text>

            <TextInput
              style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-6 text-white`}
              placeholder="Ditt navn"
              placeholderTextColor="#a89985"
              value={myName}
              onChangeText={setMyName}
              editable={!loading}
              autoFocus
            />

            <View style={tw`mb-6`}>
              <AvatarPicker
                selectedAvatarId={myAvatarId}
                onSelect={setMyAvatarId}
              />
            </View>

            {/* Privacy & Terms Consent */}
            <View style={tw`flex-row items-start gap-3 mb-6 px-2`}>
              <Switch
                value={acceptedPrivacy}
                onValueChange={setAcceptedPrivacy}
                trackColor={{ false: '#475569', true: '#7fa884' }}
                thumbColor={acceptedPrivacy ? '#f5f1ed' : '#cbd5e1'}
              />
              <Text style={tw`flex-1 text-sm text-slate-300 leading-5`}>
                Jeg aksepterer{' '}
                <Text
                  onPress={() => Linking.openURL('https://flytfamilie.no/privacy')}
                  style={tw`text-secondary underline`}
                >
                  personvernerklæringen
                </Text>
                {' '}og{' '}
                <Text
                  onPress={() => Linking.openURL('https://flytfamilie.no/terms')}
                  style={tw`text-secondary underline`}
                >
                  vilkårene for bruk
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={tw.style('bg-primary rounded py-3.5 items-center', (!myName.trim() || !acceptedPrivacy) && 'opacity-50')}
              onPress={() => myName.trim() && acceptedPrivacy && setStep(2)}
              disabled={!myName.trim() || !acceptedPrivacy}
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

        {/* Step 2: Partner name */}
        {step === 2 && (
          <View style={tw`flex-1 justify-center`}>
            <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Hva heter samboer/partner?</Text>
            <Text style={tw`text-base text-slate-300 text-center mb-8`}>
              Dette er valgfritt. Du kan også invitere dem senere.
            </Text>

            <TextInput
              style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-6 text-white`}
              placeholder="Partner navn (valgfritt)"
              placeholderTextColor="#a89985"
              value={partnerName}
              onChangeText={setPartnerName}
              editable={!loading}
              autoFocus
            />

            <View style={tw`mb-6`}>
              <AvatarPicker
                selectedAvatarId={partnerAvatarId}
                onSelect={setPartnerAvatarId}
              />
            </View>

            <TouchableOpacity
              style={tw`bg-primary rounded py-3.5 items-center`}
              onPress={() => setStep(3)}
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

        {/* Step 3: Child name */}
        {step === 3 && (
          <View style={tw`flex-1 justify-center`}>
            <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Hva heter barnet?</Text>
            <Text style={tw`text-base text-slate-300 text-center mb-8`}>
              Dette navnet brukes i appen
            </Text>

            <TextInput
              style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-6 text-white`}
              placeholder="Barnets navn"
              placeholderTextColor="#a89985"
              value={childName}
              onChangeText={setChildName}
              editable={!loading}
              autoFocus
            />

            <TouchableOpacity
              style={tw.style('bg-primary rounded py-3.5 items-center', !childName.trim() && 'opacity-50')}
              onPress={() => childName.trim() && setStep(4)}
              disabled={!childName.trim()}
            >
              <Text style={tw`text-white text-base font-semibold`}>Neste</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`mt-4 py-3`}
              onPress={() => setStep(2)}
            >
              <Text style={tw`text-slate-400 text-sm text-center`}>Tilbake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Equipment customization */}
        {step === 4 && (
          <View style={tw`flex-1`}>
            <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Utstyr til barnehagen</Text>
            <Text style={tw`text-base text-slate-300 text-center mb-6`}>
              Tilpass listen etter dine behov
            </Text>

            <View style={tw`mb-6`}>
              <EquipmentList
                items={equipmentItems}
                onToggleCritical={handleToggleCritical}
                onRename={handleRenameEquipmentItem}
                onRemove={handleRemoveEquipmentItem}
              />
            </View>

            <View style={tw`mb-6`}>
              <AddEquipmentItem
                value={newItemLabel}
                onChangeText={setNewItemLabel}
                onAdd={handleAddEquipmentItem}
              />
            </View>

            <TouchableOpacity
              style={tw`bg-primary rounded py-3.5 items-center mb-2`}
              onPress={() => setStep(5)}
            >
              <Text style={tw`text-white text-base font-semibold`}>Neste</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`mt-2 py-3`}
              onPress={() => setStep(3)}
            >
              <Text style={tw`text-slate-400 text-sm text-center`}>Tilbake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 5: Schedule template (optional) */}
        {step === 5 && !setupTemplate && (
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
                <ActivityIndicator color="#f5f1ed" />
              ) : (
                <Text style={tw`text-white text-base font-semibold`}>Hopp over</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`mt-2 py-3`}
              onPress={() => setStep(4)}
            >
              <Text style={tw`text-slate-400 text-sm text-center`}>Tilbake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 5b: Setup template */}
        {step === 5 && setupTemplate && (
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
                <ActivityIndicator color="#f5f1ed" />
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

      {/* Step 6: Success screen with invite code */}
      {step === 6 && generatedInviteCode && (
        <View style={tw`absolute inset-0 bg-background z-50`}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
            <View style={tw`items-center`}>
              <View style={tw`mb-6`}>
                <SuccessIllustration size={140} />
              </View>
              <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Nå er du klar til å få flyt!</Text>
              <Text style={tw`text-base text-text-muted text-center mb-8`}>
                Alt er klart. Del denne koden med {partnerName.trim() || 'partner'} så hen kan bli med!
              </Text>

              <View style={tw`bg-primary/20 border-2 border-primary rounded-2xl p-8 mb-6 w-full max-w-sm`}>
                <Text style={tw`text-sm text-primary-light text-center mb-2 uppercase tracking-wider`}>
                  Invitasjonskode
                </Text>
                <Text style={tw`text-4xl font-bold text-white text-center tracking-wider`}>
                  {generatedInviteCode}
                </Text>
              </View>

              <View style={tw`bg-slate-800/50 rounded-lg p-4 mb-8 w-full max-w-sm`}>
                <Text style={tw`text-sm text-text-muted text-center leading-relaxed`}>
                  💡 {partnerName.trim() || 'Partner'} kan bruke denne koden når hen laster ned appen og velger "Bli med"
                </Text>
              </View>

              <TouchableOpacity
                style={tw`bg-primary rounded-lg py-4 px-8 w-full max-w-sm`}
                onPress={async () => {
                  await refresh();
                }}
              >
                <Text style={tw`text-white text-lg font-semibold text-center`}>
                  Kom i gang!
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

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
              placeholderTextColor="#a89985"
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
