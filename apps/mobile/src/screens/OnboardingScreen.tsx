import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';

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
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>
            Let's get you set up. Would you like to create a new household or join an existing one?
          </Text>

          <TouchableOpacity
            style={styles.choiceButton}
            onPress={() => setMode('create')}
          >
            <Text style={styles.choiceButtonTitle}>Create New Household</Text>
            <Text style={styles.choiceButtonSubtitle}>
              Start fresh and invite others to join
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.choiceButton, styles.choiceButtonSecondary]}
            onPress={() => setMode('join')}
          >
            <Text style={styles.choiceButtonTitle}>Join Existing Household</Text>
            <Text style={styles.choiceButtonSubtitle}>
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Create Household</Text>
          <Text style={styles.subtitle}>
            Fill in the details below to create your household
          </Text>

          <Text style={styles.label}>Household Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., The Andersons"
            value={householdName}
            onChangeText={setHouseholdName}
            editable={!loading}
          />

          <Text style={styles.label}>Your Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Your display name"
            value={myName}
            onChangeText={setMyName}
            editable={!loading}
          />

          <Text style={styles.label}>Partner Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Partner's display name"
            value={partnerName}
            onChangeText={setPartnerName}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreateHousehold}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Household</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode('choice')}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // mode === 'join'
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Join Household</Text>
        <Text style={styles.subtitle}>
          Enter the invite code you received
        </Text>

        <Text style={styles.label}>Invite Code *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter invite code"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          editable={!loading}
        />

        <Text style={styles.label}>Your Display Name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="How others will see you"
          value={displayName}
          onChangeText={setDisplayName}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleJoinHousehold}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Join Household</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setMode('choice')}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  choiceButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  choiceButtonSecondary: {
    backgroundColor: '#3b82f6',
  },
  choiceButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  choiceButtonSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
