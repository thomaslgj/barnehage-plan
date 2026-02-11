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

export default function OnboardingScreen() {
  const { refresh } = useHousehold();
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [loading, setLoading] = useState(false);

  // Create household fields
  const [householdName, setHouseholdName] = useState('');
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');

  // Join household fields
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleCreateHousehold = async () => {
    if (!myName.trim()) {
      Alert.alert('Error', 'Please enter your name');
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

      Alert.alert('Success', 'Household created!');
      await refresh();
    } catch (error) {
      console.error('Create household error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('accept_household_invite', {
        invite_code: inviteCode.trim(),
        display_name: displayName.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Success', 'Joined household!');
      await refresh();
    } catch (error) {
      console.error('Join household error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join household');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choice') {
    return (
      <View style={tw`flex-1 bg-background`}>
        <View style={tw`flex-1 justify-center px-6`}>
          <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Welcome!</Text>
          <Text style={tw`text-base text-slate-300 text-center mb-8`}>
            Let's get you set up. Would you like to create a new household or join an existing one?
          </Text>

          <TouchableOpacity
            style={tw`bg-primary rounded-lg p-5 mb-4`}
            onPress={() => setMode('create')}
          >
            <Text style={tw`text-lg font-semibold text-white mb-1`}>Create New Household</Text>
            <Text style={tw`text-sm text-white/90`}>
              Start fresh and invite others to join
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-info rounded-lg p-5`}
            onPress={() => setMode('join')}
          >
            <Text style={tw`text-lg font-semibold text-white mb-1`}>Join Existing Household</Text>
            <Text style={tw`text-sm text-white/90`}>
              Use an invite code from your household
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === 'create') {
    return (
      <KeyboardAvoidingView
        style={tw`flex-1 bg-background`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Create Household</Text>
          <Text style={tw`text-base text-slate-300 text-center mb-8`}>
            Fill in the details below to create your household
          </Text>

          <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Household Name (optional)</Text>
          <TextInput
            style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-4 text-white`}
            placeholder="e.g., The Andersons"
            placeholderTextColor="#94a3b8"
            value={householdName}
            onChangeText={setHouseholdName}
            editable={!loading}
          />

          <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Your Name *</Text>
          <TextInput
            style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-4 text-white`}
            placeholder="Your display name"
            placeholderTextColor="#94a3b8"
            value={myName}
            onChangeText={setMyName}
            editable={!loading}
          />

          <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Partner Name (optional)</Text>
          <TextInput
            style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-4 text-white`}
            placeholder="Partner's display name"
            placeholderTextColor="#94a3b8"
            value={partnerName}
            onChangeText={setPartnerName}
            editable={!loading}
          />

          <TouchableOpacity
            style={tw.style(`bg-primary rounded py-3.5 items-center mt-2`, loading && 'opacity-50')}
            onPress={handleCreateHousehold}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={tw`text-white text-base font-semibold`}>Create Household</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`mt-4 py-3`}
            onPress={() => setMode('choice')}
            disabled={loading}
          >
            <Text style={tw`text-slate-400 text-sm text-center`}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // mode === 'join'
  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-background`}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Join Household</Text>
        <Text style={tw`text-base text-slate-300 text-center mb-8`}>
          Enter the invite code you received
        </Text>

        <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Invite Code *</Text>
        <TextInput
          style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-4 text-white`}
          placeholder="Enter invite code"
          placeholderTextColor="#94a3b8"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          editable={!loading}
        />

        <Text style={tw`text-sm font-semibold text-slate-300 mb-2`}>Your Display Name (optional)</Text>
        <TextInput
          style={tw`bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-base mb-4 text-white`}
          placeholder="How others will see you"
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
            <Text style={tw`text-white text-base font-semibold`}>Join Household</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`mt-4 py-3`}
          onPress={() => setMode('choice')}
          disabled={loading}
        >
          <Text style={tw`text-text-muted text-sm text-center`}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
