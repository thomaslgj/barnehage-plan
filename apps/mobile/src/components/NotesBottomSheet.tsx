import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import tw from '../lib/tw';
import type { DayNote } from '../types/db';

interface NotesBottomSheetProps {
  visible: boolean;
  date: string; // YYYY-MM-DD
  notes: DayNote[];
  loading: boolean;
  onAddNote: (content: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function NotesBottomSheet({
  visible,
  date,
  notes,
  loading,
  onAddNote,
  onDeleteNote,
  onClose,
}: NotesBottomSheetProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSaving(true);
    try {
      await onAddNote(noteContent);
      setNoteContent(''); // Clear input after adding
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Feil', 'Kunne ikke lagre notatet');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Alert.alert(
      'Slett notat',
      'Er du sikker på at du vil slette dette notatet?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteNote(noteId);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Feil', 'Kunne ikke slette notatet');
            }
          },
        },
      ]
    );
  };

  const dateObj = dayjs(date);
  const formattedDate = dateObj.format('dddd D. MMMM');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            tw`bg-black/50`,
            { opacity: fadeAnim },
          ]}
        >
          <TouchableOpacity
            style={tw`flex-1`}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            tw`absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl max-h-[75%]`,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={tw`p-5 border-b border-slate-700`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={[tw`text-xl font-bold text-white`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
                Notater for {formattedDate}
              </Text>
              <TouchableOpacity onPress={onClose} style={tw`p-1`}>
                <Ionicons name="close" size={24} color="#f5f1ed" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes List */}
          <ScrollView style={tw`flex-1`}>
            <View style={tw`p-5`}>
              {notes.length === 0 ? (
                <View style={tw`py-8 items-center`}>
                  <Ionicons name="document-text-outline" size={48} color="#a89985" />
                  <Text style={[tw`text-slate-400 mt-3 text-center`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
                    Ingen notater ennå
                  </Text>
                </View>
              ) : (
                notes.map((note, index) => (
                  <View
                    key={note.id}
                    style={tw`mb-3 bg-slate-900/30 border border-slate-700 rounded-lg p-4`}
                  >
                    <View style={tw`flex-row justify-between items-start`}>
                      <Text style={[tw`text-white text-base flex-1 pr-2`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
                        {note.content}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNote(note.id)}
                        style={tw`p-1`}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#a89985" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              {/* Add Note Section */}
              <View style={tw`mt-4`}>
                <Text style={[tw`text-sm text-slate-300 mb-2 font-semibold`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
                  Legg til nytt notat
                </Text>
                <TextInput
                  style={[
                    tw`bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-base text-white min-h-[100px] mb-3`,
                    { fontFamily: 'PlusJakartaSans_400Regular', textAlignVertical: 'top' }
                  ]}
                  multiline
                  numberOfLines={4}
                  placeholder="Skriv ditt notat her..."
                  placeholderTextColor="#a89985"
                  value={noteContent}
                  onChangeText={setNoteContent}
                  editable={!saving}
                />
                <TouchableOpacity
                  style={tw.style(
                    'bg-primary rounded-lg py-3 items-center',
                    (!noteContent.trim() || saving) && 'opacity-50'
                  )}
                  onPress={handleAddNote}
                  disabled={!noteContent.trim() || saving}
                >
                  <Text style={[tw`text-white text-base font-semibold`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
                    {saving ? 'Lagrer...' : 'Legg til notat'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {loading && (
            <View style={tw`absolute inset-0 bg-slate-900/80 justify-center items-center rounded-t-2xl`}>
              <ActivityIndicator size="large" color="#7fa884" />
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
