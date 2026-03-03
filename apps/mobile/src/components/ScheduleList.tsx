import React, { useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import ScheduleSlot from './ScheduleSlot';
import ScheduleSkeleton from './ScheduleSkeleton';
import NoteIcon from './NoteIcon';
import { useAssignments } from '../stores/assignments-store';
import type { DayNote } from '../types/db';
import tw from '../lib/tw';

const CONNECTING_LINE_STYLE = {
  position: 'absolute' as const,
  top: '50%' as const,
  left: '50%' as const,
  width: 32,
  height: 2,
  backgroundColor: 'rgba(139, 122, 106, 0.4)',
  transform: [{ translateX: -16 }, { translateY: -1 }],
  zIndex: -1,
};

export interface DayMetadata {
  dateStr: string;
  dayName: string;
  isToday: boolean;
  dropoffKey: string;
  pickupKey: string;
}

interface ScheduleDayRowProps {
  dateStr: string;
  dayName: string;
  isToday: boolean;
  dropoffKey: string;
  pickupKey: string;
  dropoffUserId: string | null;
  pickupUserId: string | null;
  dropoffLoading: boolean;
  pickupLoading: boolean;
  members: Array<{ id: string; user_id: string | null; display_name: string | null; avatar_id?: string | null }>;
  getDisplayName: (memberId: string | null) => string | undefined;
  onSlotPress: (date: string, slot: 'dropoff' | 'pickup') => void;
  onNotePress: (date: string) => void;
  hasNotes: boolean;
  isFirstDay: boolean;
  dropoffAvatarRef?: React.MutableRefObject<any>;
  noteIconRefs: React.MutableRefObject<Map<string, any>>;
}

const ScheduleDayRow = React.memo(function ScheduleDayRow({
  dateStr,
  dayName,
  isToday,
  dropoffKey,
  pickupKey,
  dropoffUserId,
  pickupUserId,
  dropoffLoading,
  pickupLoading,
  members,
  getDisplayName,
  onSlotPress,
  onNotePress,
  hasNotes,
  isFirstDay,
  dropoffAvatarRef,
  noteIconRefs,
}: ScheduleDayRowProps) {
  return (
    <View key={dateStr}>
      <View style={tw`pb-1`}>
        <View style={tw`h-px bg-slate-600/40 mt-3`} />
        <View style={tw`flex-row items-center justify-between mt-1.5`}>
          <View style={tw`flex-row items-center gap-1.5`}>
            {isToday && <View style={tw`w-1.5 h-1.5 bg-secondary rounded-full`} />}
            <Text style={tw.style(
              'text-[11px] font-semibold capitalize',
              isToday ? 'text-secondary-light' : 'text-slate-400'
            )}>
              {dayName}
            </Text>
          </View>
          <NoteIcon
            ref={(ref) => {
              if (ref) {
                noteIconRefs.current.set(dateStr, ref);
              }
            }}
            hasNotes={hasNotes}
            onPress={() => onNotePress(dateStr)}
          />
        </View>

        <View style={{ position: 'relative' }}>
          <View style={tw`flex-row gap-6`}>
            <View style={tw`flex-1`}>
              <ScheduleSlot
                key={dropoffKey}
                slotType="dropoff"
                displayName={getDisplayName(dropoffUserId)}
                userId={dropoffUserId}
                members={members}
                onPress={() => onSlotPress(dateStr, 'dropoff')}
                loading={dropoffLoading}
                avatarRef={isFirstDay ? dropoffAvatarRef : undefined}
              />
            </View>
            <View style={tw`flex-1`}>
              <ScheduleSlot
                key={pickupKey}
                slotType="pickup"
                displayName={getDisplayName(pickupUserId)}
                userId={pickupUserId}
                members={members}
                onPress={() => onSlotPress(dateStr, 'pickup')}
                loading={pickupLoading}
              />
            </View>
          </View>
          <View style={CONNECTING_LINE_STYLE} />
        </View>
      </View>
    </View>
  );
}, (prev, next) => {
  // Only re-render when THIS day's actual data changes
  return (
    prev.dropoffUserId === next.dropoffUserId &&
    prev.pickupUserId === next.pickupUserId &&
    prev.dropoffLoading === next.dropoffLoading &&
    prev.pickupLoading === next.pickupLoading &&
    prev.hasNotes === next.hasNotes
  );
});

export interface ScheduleListProps {
  loading: boolean;
  weekChanging: boolean;
  dayMetadata: DayMetadata[];
  members: Array<{ id: string; user_id: string | null; display_name: string | null; avatar_id?: string | null }>;
  notes: Map<string, DayNote[]>;
  savingSlot: string | null;
  templateWasSuccessful: boolean;
  applyingTemplate: boolean;
  getDisplayName: (memberId: string | null) => string | undefined;
  onSlotPress: (date: string, slot: 'dropoff' | 'pickup') => void;
  onNotePress: (date: string) => void;
  onDismissTemplate: () => void;
  onAllSlotsFilled: () => void;
  dropoffAvatarRef: React.MutableRefObject<any>;
  noteIconRefs: React.MutableRefObject<Map<string, any>>;
}

const ScheduleList = React.memo(function ScheduleList({
  loading,
  weekChanging,
  dayMetadata,
  members,
  notes,
  savingSlot,
  templateWasSuccessful,
  applyingTemplate,
  getDisplayName,
  onSlotPress,
  onNotePress,
  onDismissTemplate,
  onAllSlotsFilled,
  dropoffAvatarRef,
  noteIconRefs,
}: ScheduleListProps) {
  // Subscribe directly to the assignments store — re-renders here, NOT in MainScreen
  const assignments = useAssignments();

  // Check if all slots filled → trigger celebration (runs inside ScheduleList, not MainScreen)
  useEffect(() => {
    if (loading || dayMetadata.length === 0) return;
    const allFilled = dayMetadata.every(day =>
      assignments[day.dropoffKey] && assignments[day.pickupKey]
    );
    if (allFilled) onAllSlotsFilled();
  }, [assignments, dayMetadata, loading, onAllSlotsFilled]);

  if (loading || weekChanging) return <ScheduleSkeleton />;

  return (
    <View>
      {/* Header */}
      <View style={tw`flex-row gap-6 mt-2 mb-1 px-1`}>
        <View style={tw`flex-1 items-end`}>
          <Text style={tw`text-xs font-medium text-slate-400`}>Levering</Text>
        </View>
        <View style={tw`flex-1 items-start`}>
          <Text style={tw`text-xs font-medium text-slate-400`}>Henting</Text>
        </View>
      </View>

      {/* Template Auto-Applied Message */}
      {templateWasSuccessful && !applyingTemplate && (
        <View style={tw`mb-3 p-3 bg-primary/20 rounded-lg border border-primary/50 flex-row items-center`}>
          <Text style={tw`text-sm text-primary-light text-center flex-1`}>
            Uken er fylt inn fra din standard-uke. Nå har du flyt! 🌟
          </Text>
          <TouchableOpacity
            onPress={onDismissTemplate}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={tw`ml-2`}
          >
            <Ionicons name="close" size={18} color="#7fa884" />
          </TouchableOpacity>
        </View>
      )}

      {dayMetadata.map((day, index) => (
        <ScheduleDayRow
          key={day.dateStr}
          dateStr={day.dateStr}
          dayName={day.dayName}
          isToday={day.isToday}
          dropoffKey={day.dropoffKey}
          pickupKey={day.pickupKey}
          dropoffUserId={assignments[day.dropoffKey] || null}
          pickupUserId={assignments[day.pickupKey] || null}
          dropoffLoading={savingSlot === day.dropoffKey}
          pickupLoading={savingSlot === day.pickupKey}
          members={members}
          getDisplayName={getDisplayName}
          onSlotPress={onSlotPress}
          onNotePress={onNotePress}
          hasNotes={notes.has(day.dateStr) && (notes.get(day.dateStr)?.length || 0) > 0}
          isFirstDay={index === 0}
          dropoffAvatarRef={dropoffAvatarRef}
          noteIconRefs={noteIconRefs}
        />
      ))}
    </View>
  );
});

export default ScheduleList;
