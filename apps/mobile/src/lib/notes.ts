import { supabase } from './supabase';
import type { DayNote } from '../types/db';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fetch all notes for a date range (weekly view)
export async function fetchNotesForDateRange(
  householdId: string,
  childId: string,
  fromDate: string,
  toDate: string
): Promise<Map<string, DayNote[]>> {
  const cacheKey = `notes_${childId}_${fromDate}_${toDate}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const cachedData = JSON.parse(cached);
      // Return cache but fetch fresh data in background
      setTimeout(() => fetchFreshNotes(householdId, childId, fromDate, toDate, cacheKey), 0);
      return deserializeNotesMap(cachedData);
    }
  } catch (error) {
    console.error('Error loading notes cache:', error);
  }

  return await fetchFreshNotes(householdId, childId, fromDate, toDate, cacheKey);
}

async function fetchFreshNotes(
  householdId: string,
  childId: string,
  fromDate: string,
  toDate: string,
  cacheKey: string
): Promise<Map<string, DayNote[]>> {
  const { data, error } = await supabase
    .from('day_notes')
    .select('*')
    .eq('household_id', householdId)
    .eq('child_id', childId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('created_at', { ascending: true }); // Oldest first

  if (error) {
    console.error('Error fetching notes:', error);
    return new Map();
  }

  // Group notes by date
  const notesMap = new Map<string, DayNote[]>();
  data?.forEach((note: DayNote) => {
    const existing = notesMap.get(note.date) || [];
    notesMap.set(note.date, [...existing, note]);
  });

  // Cache the data
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(serializeNotesMap(notesMap)));
  } catch (error) {
    console.error('Error caching notes:', error);
  }

  return notesMap;
}

// Helper to serialize Map for AsyncStorage
function serializeNotesMap(map: Map<string, DayNote[]>): Record<string, DayNote[]> {
  const obj: Record<string, DayNote[]> = {};
  map.forEach((notes, date) => {
    obj[date] = notes;
  });
  return obj;
}

// Helper to deserialize from AsyncStorage
function deserializeNotesMap(obj: Record<string, DayNote[]>): Map<string, DayNote[]> {
  const map = new Map<string, DayNote[]>();
  Object.entries(obj).forEach(([date, notes]) => {
    map.set(date, notes);
  });
  return map;
}

// Add a new note
export async function addNote(
  householdId: string,
  childId: string,
  date: string,
  content: string,
  userId: string
): Promise<DayNote | null> {
  try {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error('Note content cannot be empty');
    }

    const { data, error } = await supabase
      .from('day_notes')
      .insert({
        household_id: householdId,
        child_id: childId,
        date: date,
        content: trimmedContent,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Clear cache to force refresh
    await clearNotesCache(childId);

    return data;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
}

// Delete a note
export async function deleteNote(
  noteId: string,
  childId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('day_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;

    // Clear cache to force refresh
    await clearNotesCache(childId);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

// Clear all notes cache for a child
async function clearNotesCache(childId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const noteCacheKeys = keys.filter(key => key.startsWith(`notes_${childId}_`));
    await AsyncStorage.multiRemove(noteCacheKeys);
  } catch (error) {
    console.error('Error clearing notes cache:', error);
  }
}
