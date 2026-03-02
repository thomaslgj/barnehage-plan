import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/nb';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import { Text } from '../components/Text';
import TodayCard from '../components/TodayCard';
import TodayCardSkeleton from '../components/TodayCardSkeleton';
import HeaderSkeleton from '../components/HeaderSkeleton';
import ScheduleSlot from '../components/ScheduleSlot';
import ScheduleSkeleton from '../components/ScheduleSkeleton';
import NoteIcon from '../components/NoteIcon';
import NotesBottomSheet from '../components/NotesBottomSheet';
import TipModal from '../components/TipModal';
import { fetchNotesForDateRange, addNote, deleteNote } from '../lib/notes';
import { useTips } from '../hooks/useTips';
import { useAssignments, useAssignment, setAssignments, getAssignments, type AssignmentData } from '../stores/assignments-store';
import type { ScheduleAssignment, DayNote } from '../types/db';
import tw from '../lib/tw';

dayjs.extend(isoWeek);
dayjs.locale('nb');

const EMPTY_NOTES: DayNote[] = [];
const REFRESH_COLORS = ['#7fa884'];
const SCROLL_CONTENT_STYLE = { padding: 16, paddingBottom: 80 } as const;
const OFFSCREEN_STYLE = { position: 'absolute', top: -1000, left: -1000, zIndex: 9999 } as const;
const NAV_BUTTON_STYLE = {
  padding: 8,
  borderRadius: 20,
  backgroundColor: 'rgba(168, 153, 133, 0.15)',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
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

interface DayMetadata {
  dateStr: string;
  dayName: string;
  isToday: boolean;
  dropoffKey: string;
  pickupKey: string;
}

// Memoized day row - only re-renders when THIS day's data changes
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

// Schedule list - subscribes to assignments store directly, bypassing MainScreen re-render
interface ScheduleListProps {
  loading: boolean;
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

function ScheduleList({
  loading,
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

  if (loading) return <ScheduleSkeleton />;

  return (
    <View>
      {/* Header */}
      <View style={tw`flex-row gap-6 mb-3 px-1`}>
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
}

// TodayCard section - subscribes to assignments store directly
interface TodayCardSectionProps {
  loading: boolean;
  weekChanging: boolean;
  todayDate: string | undefined;
  members: Array<{ id: string; user_id: string | null; display_name: string | null; avatar_id?: string | null }>;
  getDisplayName: (memberId: string | null) => string | undefined;
  todayNotes: DayNote[];
  todayCardCollapsed: boolean;
  todayCardFade: Animated.Value;
  onDropoffPress: () => void;
  onPickupPress: () => void;
  onNotePress: () => void;
  onToggleCollapse: () => void;
  onEquipmentModalDismiss: () => void;
}

function TodayCardSection({
  loading,
  weekChanging,
  todayDate,
  members,
  getDisplayName,
  todayNotes,
  todayCardCollapsed,
  todayCardFade,
  onDropoffPress,
  onPickupPress,
  onNotePress,
  onToggleCollapse,
  onEquipmentModalDismiss,
}: TodayCardSectionProps) {
  // Subscribe to ONLY today's two keys — won't re-render when other days change
  const dropoffUserId = useAssignment(todayDate ? `${todayDate}-dropoff` : '');
  const pickupUserId = useAssignment(todayDate ? `${todayDate}-pickup` : '');
  const dropoffName = getDisplayName(dropoffUserId ?? null);
  const pickupName = getDisplayName(pickupUserId ?? null);

  return (
    <Animated.View style={{ opacity: todayCardFade }}>
      {(loading || weekChanging) ? (
        <TodayCardSkeleton />
      ) : todayDate ? (
        <TodayCard
          date={todayDate}
          dropoffName={dropoffName}
          pickupName={pickupName}
          dropoffUserId={dropoffUserId}
          pickupUserId={pickupUserId}
          members={members}
          onDropoffPress={onDropoffPress}
          onPickupPress={onPickupPress}
          notes={todayNotes}
          onNotePress={onNotePress}
          collapsed={todayCardCollapsed}
          onToggleCollapse={onToggleCollapse}
          onEquipmentModalDismiss={onEquipmentModalDismiss}
        />
      ) : null}
    </Animated.View>
  );
}

export default function MainScreen({ navigation }: any) {
  const { user, householdId, childId, members } = useHousehold();
  // "Current week" is next week on weekends, this week on weekdays
  const isWeekend = dayjs().day() === 0 || dayjs().day() === 6;
  const currentWeekOffset = isWeekend ? 1 : 0;
  const [weekOffset, setWeekOffset] = useState(currentWeekOffset);
  // assignments live in external store (assignments-store.ts) — not in MainScreen state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [templateWasSuccessful, setTemplateWasSuccessful] = useState(false);
  const [templateDismissed, setTemplateDismissed] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [childName, setChildName] = useState<string>('');
  const [myName, setMyName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [hasPlaceholderMember, setHasPlaceholderMember] = useState(false);
  const [inviteMessageDismissed, setInviteMessageDismissed] = useState(false);
  const [showInviteCodePopup, setShowInviteCodePopup] = useState(false);
  const [weekWasFullyFilled, setWeekWasFullyFilled] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [weekChanging, setWeekChanging] = useState(false);
  const [notes, setNotes] = useState<Map<string, DayNote[]>>(new Map());
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesBottomSheetVisible, setNotesBottomSheetVisible] = useState(false);
  const [selectedNoteDate, setSelectedNoteDate] = useState<string | null>(null);
  const [todayCardCollapsed, setTodayCardCollapsed] = useState(true); // Start collapsed by default
  const initialFetchDone = useRef(false);
  const animationsTriggered = useRef(false);
  const prevWeekChanging = useRef(false);

  // Contextual tips
  const { shouldShowTip, markTipAsShown } = useTips();
  const [activeTip, setActiveTip] = useState<{
    id: 'avatar_switch' | 'note_added' | 'equipment_button';
    title: string;
    message: string;
    targetPosition?: { x: number; y: number; width: number; height: number };
    arrowDirection?: 'up' | 'down' | 'left' | 'right';
    targetElement?: {
      type: 'avatar' | 'noteIcon';
      avatarId?: string | null;
      size?: number;
      borderColor?: string;
      hasNotes?: boolean;
    };
  } | null>(null);
  const dropoffAvatarRef = useRef<any>(null);
  const noteIconRefs = useRef<Map<string, any>>(new Map());
  const [equipmentModalDismissed, setEquipmentModalDismissed] = useState(false);

  // Set equipment modal as dismissed after a short delay if it hasn't been set by user interaction
  // This handles cases where the modal doesn't show at all (wrong time, already shown, etc.)
  // Short delay allows avatar tip to show quickly after onboarding
  useEffect(() => {
    if (initialLoadComplete && !equipmentModalDismissed) {
      const timer = setTimeout(() => {
        setEquipmentModalDismissed(true);
      }, 800); // Short delay - if modal shows it will override this, otherwise tip shows quickly
      return () => clearTimeout(timer);
    }
  }, [initialLoadComplete, equipmentModalDismissed]);

  // Animation refs
  const celebrationConfettiRef = useRef<any>(null);
  const todayCardFade = useRef(new Animated.Value(1)).current;
  const messagesFade = useRef(new Animated.Value(1)).current;
  const navigationFade = useRef(new Animated.Value(1)).current;
  const prevButtonScale = useRef(new Animated.Value(1)).current;
  const nextButtonScale = useRef(new Animated.Value(1)).current;
  const profileButtonScale = useRef(new Animated.Value(1)).current;

  // Calculate current week dates - memoized to avoid dayjs ops on every render
  const startOfWeek = useMemo(() => dayjs().add(weekOffset, 'week').startOf('isoWeek'), [weekOffset]);
  const weekRange = useMemo(() => {
    const endOfWeek = startOfWeek.add(6, 'day');
    return `${startOfWeek.format('D. MMM')} - ${endOfWeek.format('D. MMM')}`;
  }, [startOfWeek]);

  // Generate 7 days (1 week), Mon-Fri only - memoized to avoid recalculation
  const daysToShow = useMemo(() => {
    const days: dayjs.Dayjs[] = [];
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.add(i, 'day');
      const dayOfWeek = day.day();
      // Only Monday (1) to Friday (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        days.push(day);
      }
    }
    return days;
  }, [weekOffset]);

  // Pre-compute day metadata - only recalculates on week change, NOT on assignment change
  const dayMetadata = useMemo<DayMetadata[]>(() => daysToShow.map(day => {
    const dateStr = day.format('YYYY-MM-DD');
    return {
      dateStr,
      dayName: day.format('dddd'),
      isToday: day.isSame(dayjs(), 'day'),
      dropoffKey: `${dateStr}-dropoff`,
      pickupKey: `${dateStr}-pickup`,
    };
  }), [daysToShow]);

  // Memoize time-based values - only recalculate on week change, not every render
  const { today, currentDayOfWeek, currentHour } = useMemo(() => ({
    today: dayjs().format('YYYY-MM-DD'),
    currentDayOfWeek: dayjs().day(), // 0 = Sunday, 6 = Saturday
    currentHour: dayjs().hour(),
  }), [weekOffset]);

  // Check if all slots in current week are empty - reads from store on load/week change
  const allSlotsEmpty = useMemo(() => {
    const current = getAssignments();
    return dayMetadata.every(day =>
      !current[day.dropoffKey] && !current[day.pickupKey]
    );
  // Re-evaluate when week changes or loading finishes (store has fresh data at that point)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayMetadata, loading]);

  // On weekends, show next Monday instead of today/tomorrow - memoized
  // After 16:00 on weekdays, show tomorrow instead of today
  const todayOrTomorrow = useMemo(() => {
    // Weekend (Saturday or Sunday) - show next Monday
    if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
      return daysToShow[0];
    }

    // Friday after 16:00 - show next Monday (not Saturday)
    if (currentDayOfWeek === 5 && currentHour >= 16) {
      return daysToShow[0];
    }

    // Weekday - show tomorrow if after 16:00, otherwise show today
    const targetDate = currentHour >= 16
      ? dayjs().add(1, 'day').format('YYYY-MM-DD')
      : today;

    return daysToShow.find(
      (d) => d.format('YYYY-MM-DD') === targetDate || d.format('YYYY-MM-DD') === dayjs().add(1, 'day').format('YYYY-MM-DD')
    );
  }, [daysToShow, currentDayOfWeek, today, currentHour]);

  const fetchAssignments = useCallback(async (isInitialLoad = false, targetWeekOffset?: number) => {
    if (!childId || !householdId) return;

    // Use provided offset or fall back to current weekOffset
    const effectiveOffset = targetWeekOffset !== undefined ? targetWeekOffset : weekOffset;

    // Recalculate days based on effective weekOffset
    const currentStartOfWeek = dayjs().add(effectiveOffset, 'week').startOf('isoWeek');
    const currentDays: dayjs.Dayjs[] = [];
    for (let i = 0; i < 7; i++) {
      const day = currentStartOfWeek.add(i, 'day');
      const dayOfWeek = day.day();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        currentDays.push(day);
      }
    }

    const fromDate = currentDays[0].format('YYYY-MM-DD');
    const toDate = currentDays[currentDays.length - 1].format('YYYY-MM-DD');
    const cacheKey = `schedule_${childId}_${fromDate}_${toDate}`;

    // Try to load from cache first on initial load
    if (isInitialLoad) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          setAssignments(cachedData);
          setLoading(false);
          setInitialLoadComplete(true);
          // Continue to fetch fresh data in background
        } else {
          setLoading(true);
        }
      } catch (error) {
        console.error('Error loading cache:', error);
        setLoading(true);
      }
    } else if (!refreshing && targetWeekOffset === undefined) {
      setWeekChanging(true);
    }

    try {
      const { data, error } = await supabase
        .from('schedule_assignments')
        .select('date, slot, assigned_member_id, assigned_user_id')
        .eq('child_id', childId)
        .gte('date', fromDate)
        .lte('date', toDate);

      if (error) throw error;

      // Convert to map - use member_id (works for both real users and placeholders)
      const assignmentMap: AssignmentData = {};
      data?.forEach((assignment: Pick<ScheduleAssignment, 'date' | 'slot' | 'assigned_member_id' | 'assigned_user_id'>) => {
        const key = `${assignment.date}-${assignment.slot}`;
        // Use member_id if available, fallback to user_id for backwards compatibility
        // If both are null, explicitly set to null (not undefined)
        const memberId = assignment.assigned_member_id || assignment.assigned_user_id || null;
        assignmentMap[key] = memberId;
      });

      // Save to cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(assignmentMap));

      // Update with fresh data from database
      setAssignments(assignmentMap);

      // Also fetch notes for this date range
      const notesMap = await fetchNotesForDateRange(householdId, childId, fromDate, toDate);
      setNotes(notesMap);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setInitialLoadComplete(true);
      }
      setWeekChanging(false);
      setRefreshing(false);

    }
  }, [childId, householdId, weekOffset, refreshing]);

  // Initial fetch - start immediately, cache will make it fast
  useEffect(() => {
    if (childId && householdId && !initialFetchDone.current) {
      initialFetchDone.current = true;
      // Fetch immediately - cached data will show instantly if available
      fetchAssignments(true);

      // Check if a template exists
      supabase
        .from('schedule_templates')
        .select('id')
        .eq('household_id', householdId)
        .eq('child_id', childId)
        .limit(1)
        .then(({ data }) => {
          setHasTemplate(!!data && data.length > 0);
        });
    }
  }, [childId, householdId, fetchAssignments]);

  // Set content to visible immediately when loading completes (no fade-in animation)
  useEffect(() => {
    if (!loading && !animationsTriggered.current) {
      animationsTriggered.current = true;

      // Set all animations to fully visible immediately (no fade-in)
      todayCardFade.setValue(1);
      messagesFade.setValue(1);
      navigationFade.setValue(1);
    }
  }, [loading]);

  // Note: Fade animation is now handled directly in changeWeek and fetchAssignments
  // to avoid double-animation issues from effect re-running

  // Show avatar switch tip after initial load and equipment modal is dismissed
  useEffect(() => {
    if (initialLoadComplete && shouldShowTip('avatar_switch') && !activeTip && daysToShow.length > 0 && equipmentModalDismissed) {
      // Wait a bit for UI to settle after equipment modal dismissal
      const timer = setTimeout(() => {
        if (dropoffAvatarRef.current) {
          // Get first day's dropoff assignment to determine avatar details
          const firstDay = daysToShow[0];
          const firstDateStr = firstDay.format('YYYY-MM-DD');
          const firstDropoffUserId = getAssignments()[`${firstDateStr}-dropoff`];

          // Find member and get avatar info
          const member = firstDropoffUserId && members.length > 0
            ? members.find(m => m.user_id === firstDropoffUserId || m.id === firstDropoffUserId)
            : null;
          const avatarId = member?.avatar_id || null;
          const personIndex = member ? members.indexOf(member) : null;
          const borderColor = !firstDropoffUserId ? '#4a3f38'
            : personIndex === 0 ? '#6b8e6f'
            : personIndex === 1 ? '#e8c96f'
            : '#8b7a6a';

          dropoffAvatarRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            setActiveTip({
              id: 'avatar_switch',
              title: 'Bytt ansvar',
              message: 'Trykk på avataren for å endre hvem som har levering eller henting',
              targetPosition: { x: pageX, y: pageY, width, height },
              arrowDirection: 'down',
              targetElement: {
                type: 'avatar',
                avatarId: avatarId,
                size: 48,
                borderColor: borderColor,
              },
            });
          });
        }
      }, 500); // Short delay after modal dismissal
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- assignments/members intentionally excluded: this tip only needs to fire once on initial load
  }, [initialLoadComplete, shouldShowTip, activeTip, daysToShow, equipmentModalDismissed]);

  // Fetch child name
  useEffect(() => {
    if (!childId) return;

    const fetchChildName = async () => {
      // console.log('Fetching child name for childId:', childId);
      const { data, error } = await supabase
        .from('children')
        .select('name')
        .eq('id', childId)
        .single();

      // console.log('Child data fetched:', data, 'error:', error);

      if (data) {
        setChildName(data.name);
      }
    };

    fetchChildName();
  }, [childId]);

  // Get current user's display name
  useEffect(() => {
    if (!user || members.length === 0) return;

    const currentUserMember = members.find(m => m.user_id === user.id);
    if (currentUserMember) {
      setMyName(currentUserMember.display_name);
    }
  }, [user, members]);

  // Fetch invite code and check for placeholder members
  useEffect(() => {
    if (!householdId) return;

    const fetchInviteCodeAndPlaceholder = async () => {
      // Fetch household invite code
      const { data: householdData } = await supabase
        .from('households')
        .select('invite_code')
        .eq('id', householdId)
        .single();

      if (householdData?.invite_code) {
        setInviteCode(householdData.invite_code);
      }

      // Check if there are placeholder members (user_id IS NULL)
      const { data: placeholderMembers } = await supabase
        .from('household_members')
        .select('id')
        .eq('household_id', householdId)
        .is('user_id', null)
        .limit(1);

      setHasPlaceholderMember(placeholderMembers && placeholderMembers.length > 0);
    };

    fetchInviteCodeAndPlaceholder();
  }, [householdId, members]); // Re-check when members change

  // Reset template success message when week changes (but keep templateAutoApplied to prevent re-triggering)
  useEffect(() => {
    setTemplateWasSuccessful(false);
    setWeekWasFullyFilled(false);
  }, [weekOffset]);

  // Celebration callback - called by ScheduleList when all slots become filled
  const handleAllSlotsFilled = useCallback(() => {
    if (weekWasFullyFilled) return;
    setWeekWasFullyFilled(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    celebrationConfettiRef.current?.start();
  }, [weekWasFullyFilled]);

  // Manual template application
  const handleApplyTemplate = async () => {
    setApplyingTemplate(true);
    try {
      const wasApplied = await applyTemplateToWeek();
      setTemplateWasSuccessful(wasApplied);
    } catch (error) {
      console.error('Error applying template:', error);
      setTemplateWasSuccessful(false);
    } finally {
      setApplyingTemplate(false);
    }
  };

  // Note: Automatic template application is disabled
  // Use the debug button below to manually apply template when needed

  // Apply template to empty weeks
  // Returns true if templates were actually applied, false otherwise
  const applyTemplateToWeek = async (): Promise<boolean> => {
    if (!childId || !householdId || !user) return false;

    try {
      // Fetch template
      const { data: templates, error: templateError } = await supabase
        .from('schedule_templates')
        .select('weekday, slot, assigned_member_id, assigned_user_id')
        .eq('household_id', householdId)
        .eq('child_id', childId);

      if (templateError) {
        console.error('Template error:', templateError);
        return false;
      }

      if (!templates || templates.length === 0) {
        setHasTemplate(false);
        return false; // No template to apply
      }

      setHasTemplate(true);

      // Check which days in current view need assignments
      const newAssignments: Array<{
        household_id: string;
        child_id: string;
        date: string;
        slot: 'dropoff' | 'pickup';
        assigned_user_id: string | null;
        updated_by: string;
      }> = [];

      const currentAssignments = getAssignments();
      for (const day of daysToShow) {
        const dateStr = day.format('YYYY-MM-DD');
        const weekday = day.isoWeekday(); // 1-7, Monday=1

        // Check dropoff
        const dropoffKey = `${dateStr}-dropoff`;
        if (!currentAssignments[dropoffKey]) {
          const template = templates.find(t => t.weekday === weekday && t.slot === 'dropoff');
          if (template?.assigned_member_id) {
            newAssignments.push({
              household_id: householdId,
              child_id: childId,
              date: dateStr,
              slot: 'dropoff',
              assigned_member_id: template.assigned_member_id,
              assigned_user_id: template.assigned_user_id,
              updated_by: user.id,
            });
          }
        }

        // Check pickup
        const pickupKey = `${dateStr}-pickup`;
        if (!currentAssignments[pickupKey]) {
          const template = templates.find(t => t.weekday === weekday && t.slot === 'pickup');
          if (template?.assigned_member_id) {
            newAssignments.push({
              household_id: householdId,
              child_id: childId,
              date: dateStr,
              slot: 'pickup',
              assigned_member_id: template.assigned_member_id,
              assigned_user_id: template.assigned_user_id,
              updated_by: user.id,
            });
          }
        }
      }

      // Insert/update new assignments from template (use upsert to handle duplicates)
      if (newAssignments.length > 0) {
        // console.log('Upserting assignments:', newAssignments.length);
        // console.log('Assignments to upsert:', JSON.stringify(newAssignments, null, 2));
        const { error: upsertError } = await supabase
          .from('schedule_assignments')
          .upsert(newAssignments, { onConflict: 'child_id,date,slot' });

        if (upsertError) {
          console.error('Upsert error:', upsertError);
          return false;
        } else {
          // Refresh assignments
          await fetchAssignments();
          return true; // Successfully applied template
        }
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error applying template:', error);
      return false;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  // Memoized cycle order: null -> person1 -> person2 -> null
  const cycleOrder = useMemo<(string | null)[]>(() => [
    null,
    ...members.slice(0, 2).map(m => m.id)
  ], [members]);

  const handleSlotPress = useCallback((date: string, slot: 'dropoff' | 'pickup') => {
    if (!childId || !householdId || !user) return;

    const key = `${date}-${slot}`;
    let pendingNextUserId: string | null = null;

    // Pure state update - no side effects
    setAssignments((prev) => {
      const currentUserId = prev[key] || null;
      const currentIndex = cycleOrder.indexOf(currentUserId);
      const nextIndex = (currentIndex + 1) % cycleOrder.length;
      pendingNextUserId = cycleOrder[nextIndex];
      return { ...prev, [key]: pendingNextUserId };
    });

    // DB save deferred to next tick - runs after state update & render
    setTimeout(() => {
      if (pendingNextUserId === null) {
        supabase
          .from('schedule_assignments')
          .delete()
          .eq('child_id', childId)
          .eq('date', date)
          .eq('slot', slot)
          .then(({ error }) => {
            if (error) console.error('Error deleting assignment:', error);
          });
      } else {
        supabase
          .from('schedule_assignments')
          .upsert({
            household_id: householdId,
            child_id: childId,
            date: date,
            slot: slot,
            assigned_member_id: pendingNextUserId,
            assigned_user_id: pendingNextUserId,
            updated_by: user.id,
          }, { onConflict: 'child_id,date,slot' })
          .then(({ error }) => {
            if (error) console.error('Error saving assignment:', error);
          });
      }
    }, 0);
  }, [childId, householdId, user, cycleOrder]);

  const getDisplayName = useCallback((memberId: string | null): string | undefined => {
    if (!memberId) {
      return undefined;
    }

    // Find member by id (works for both real users and placeholders)
    // Also check user_id for backwards compatibility
    const member = members.find((m) => m.id === memberId || m.user_id === memberId);
    return member?.display_name;
  }, [members]);

  const handleNotePress = useCallback((date: string) => {
    setSelectedNoteDate(date);
    setNotesBottomSheetVisible(true);
  }, []);

  const handleAddNote = async (content: string) => {
    if (!householdId || !childId || !user || !selectedNoteDate) return;

    setNotesLoading(true);
    try {
      const newNote = await addNote(householdId, childId, selectedNoteDate, content, user.id);

      if (newNote) {
        // Update local state - add to existing notes array for this date
        setNotes(prev => {
          const newNotes = new Map(prev);
          const existingNotes = newNotes.get(selectedNoteDate) || [];
          newNotes.set(selectedNoteDate, [...existingNotes, newNote]);
          return newNotes;
        });

        // Show tip about note indicator (first time only)
        if (shouldShowTip('note_added')) {
          // Close the notes bottom sheet first
          setNotesBottomSheetVisible(false);
          const noteDate = selectedNoteDate;
          setSelectedNoteDate(null);

          // Wait for bottom sheet to close and note icon to update, then show tip
          setTimeout(() => {
            const noteIconRef = noteIconRefs.current.get(noteDate);
            if (noteIconRef) {
              noteIconRef.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                setActiveTip({
                  id: 'note_added',
                  title: 'Notater lagt til!',
                  message: 'Se det gule ikonet? Det viser at det er notater for denne dagen',
                  targetPosition: { x: pageX, y: pageY, width, height },
                  arrowDirection: 'down',
                  targetElement: {
                    type: 'noteIcon',
                    hasNotes: true,
                    size: 18,
                  },
                });
              });
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    } finally {
      setNotesLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!childId || !selectedNoteDate) return;

    setNotesLoading(true);
    try {
      await deleteNote(noteId, childId);

      // Update local state - remove note from array
      setNotes(prev => {
        const newNotes = new Map(prev);
        const existingNotes = newNotes.get(selectedNoteDate) || [];
        const filteredNotes = existingNotes.filter(note => note.id !== noteId);

        if (filteredNotes.length === 0) {
          newNotes.delete(selectedNoteDate);
        } else {
          newNotes.set(selectedNoteDate, filteredNotes);
        }

        return newNotes;
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    } finally {
      setNotesLoading(false);
    }
  };

  const handleNoteClose = () => {
    setNotesBottomSheetVisible(false);
    setSelectedNoteDate(null);
  };

  const handleTipDismiss = () => {
    if (activeTip) {
      markTipAsShown(activeTip.id);
      setActiveTip(null);
    }
  };

  // Stable callbacks for memoized components
  const onDismissTemplate = useCallback(() => {
    setTemplateWasSuccessful(false);
    setTemplateDismissed(true);
  }, []);

  const todayDate = useMemo(() => todayOrTomorrow?.format('YYYY-MM-DD'), [todayOrTomorrow]);
  const todayNotes = todayDate ? notes.get(todayDate) || EMPTY_NOTES : EMPTY_NOTES;

  const handleTodayDropoffPress = useCallback(() => {
    if (todayDate) handleSlotPress(todayDate, 'dropoff');
  }, [todayDate, handleSlotPress]);

  const handleTodayPickupPress = useCallback(() => {
    if (todayDate) handleSlotPress(todayDate, 'pickup');
  }, [todayDate, handleSlotPress]);

  const handleTodayNotePress = useCallback(() => {
    if (todayDate) handleNotePress(todayDate);
  }, [todayDate, handleNotePress]);

  const handleToggleTodayCard = useCallback(() => {
    setTodayCardCollapsed(prev => !prev);
  }, []);

  const handleEquipmentModalDismiss = useCallback(() => {
    setEquipmentModalDismissed(true);
  }, []);

  // Button animation helpers
  const animateButtonPress = (animValue: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.spring(animValue, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(animValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    callback();
  };

  // Week navigation helper - sets loading state and fetches immediately
  const changeWeek = useCallback((offset: number) => {
    if (!initialLoadComplete) return;

    setWeekChanging(true);
    setWeekOffset(offset);
    fetchAssignments(false, offset);
  }, [initialLoadComplete, fetchAssignments]);

  // Swipe gesture removed - use arrow buttons for week navigation to avoid blocking slot taps

  return (
    <>
      {/* Celebration Confetti - positioned absolutely off-screen until triggered */}
      {Platform.OS !== 'web' && (
        <View style={OFFSCREEN_STYLE}>
          <ConfettiCannon
            ref={celebrationConfettiRef}
            count={200}
            origin={{ x: 200, y: 200 }}
            autoStart={false}
            fadeOut={true}
          />
        </View>
      )}

      <SafeAreaView style={tw`flex-1 bg-background`} edges={['top']}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={SCROLL_CONTENT_STYLE}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={REFRESH_COLORS} />
          }
        >
        {/* Profile Header */}
        {loading || !childName || !myName ? (
          <HeaderSkeleton />
        ) : (
          <View style={tw`flex-row items-center justify-between mb-6`}>
            {/* Child info (non-clickable) */}
            <View style={tw`flex-row items-center gap-2 bg-slate-800/30 rounded-full py-2 px-4`}>
              <MaterialCommunityIcons name="baby-face-outline" size={22} color="#a89985" />
              <Text style={tw`text-base text-text-muted font-medium`}>{childName}</Text>
            </View>

            {/* User info (clickable) */}
            <Animated.View style={{ transform: [{ scale: profileButtonScale }] }}>
              <TouchableOpacity
                style={tw`flex-row items-center gap-2 bg-slate-700/50 rounded-full py-2 px-4`}
                onPress={() => animateButtonPress(profileButtonScale, () => navigation.navigate('Profile'))}
                activeOpacity={0.7}
              >
                <Ionicons name="person-circle-outline" size={22} color="#f5f1ed" />
                <Text style={tw`text-base text-white font-medium`}>{myName}</Text>
                <Text style={tw`text-text-light text-xl`}>›</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Invite Partner Button */}
        {hasPlaceholderMember && inviteCode && weekOffset === currentWeekOffset && !inviteMessageDismissed && (
          <View style={tw`mb-5`}>
            <TouchableOpacity
              style={tw`flex-row items-center gap-2.5 bg-secondary/15 rounded-lg px-4 py-3 border border-secondary/30`}
              onPress={() => setShowInviteCodePopup(!showInviteCodePopup)}
              activeOpacity={0.7}
            >
              <Ionicons name="bulb-outline" size={18} color="#e8c96f" />
              <Text style={tw`flex-1 text-sm text-slate-200 font-medium`}>
                Din partner har ikke blitt med enda
              </Text>
              <Ionicons name={showInviteCodePopup ? 'chevron-up' : 'chevron-down'} size={16} color="#a89985" />
            </TouchableOpacity>
            {showInviteCodePopup && (
              <View style={tw`mt-2 bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700`}>
                <Text style={tw`text-xs text-slate-400 mb-2`}>
                  Del denne invitasjonskoden:
                </Text>
                <Text style={tw`text-lg text-white font-bold text-center tracking-wider`}>
                  {inviteCode}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Today/Tomorrow Card */}
        {weekOffset === currentWeekOffset && (
          <TodayCardSection
            loading={loading}
            weekChanging={weekChanging}
            todayDate={todayDate}
            members={members}
            getDisplayName={getDisplayName}
            todayNotes={todayNotes}
            todayCardCollapsed={todayCardCollapsed}
            todayCardFade={todayCardFade}
            onDropoffPress={handleTodayDropoffPress}
            onPickupPress={handleTodayPickupPress}
            onNotePress={handleTodayNotePress}
            onToggleCollapse={handleToggleTodayCard}
            onEquipmentModalDismiss={handleEquipmentModalDismiss}
          />
        )}

        {/* Messages Section - Template, Empty State */}
        <Animated.View style={{ opacity: messagesFade }}>
        {/* Template Loading Animation */}
        {applyingTemplate && (
          <View style={tw`mb-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50`}>
            <View style={tw`flex-row items-center justify-center gap-2`}>
              <ActivityIndicator size="small" color="#7fa884" />
              <Text style={tw`text-sm text-text-muted`}>
                Setter opp flyt...
              </Text>
            </View>
          </View>
        )}

          {/* Apply Template Button - show when week is empty */}
          {!loading && !weekChanging && !applyingTemplate && !templateWasSuccessful && !templateDismissed && allSlotsEmpty && hasTemplate && dayMetadata.length > 0 && (
            <View style={tw`mb-3 p-4 bg-primary/20 rounded-lg border border-primary/50`}>
              <Text style={tw`text-base text-text text-center mb-3 font-medium`}>
                Fyll inn fra standard-uke ✨
              </Text>
              <TouchableOpacity
                style={tw`bg-primary py-2.5 px-4 rounded-lg`}
                onPress={handleApplyTemplate}
                activeOpacity={0.7}
              >
                <Text style={tw`text-center text-base font-semibold text-white`}>
                  Fyll inn uken
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Week Navigation Header */}
        <Animated.View style={[tw`mt-8`, { opacity: navigationFade }]}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
          <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
            <TouchableOpacity
              style={NAV_BUTTON_STYLE}
              onPress={() => animateButtonPress(prevButtonScale, () => changeWeek(weekOffset - 1))}
              activeOpacity={0.5}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={20} color="#a89985" />
            </TouchableOpacity>
          </Animated.View>

          <View style={tw`flex-1 items-center px-3`}>
            <View style={tw`flex-row items-center gap-2`}>
              {weekChanging && (
                <ActivityIndicator size="small" color="#7fa884" />
              )}
              <Text style={tw`text-base font-semibold text-text`}>
                {weekRange}
              </Text>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: nextButtonScale }] }}>
            <TouchableOpacity
              style={NAV_BUTTON_STYLE}
              onPress={() => animateButtonPress(nextButtonScale, () => changeWeek(weekOffset + 1))}
              activeOpacity={0.5}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={20} color="#a89985" />
            </TouchableOpacity>
          </Animated.View>
          </View>

          {/* Go to Current Week Button */}
          {weekOffset !== currentWeekOffset && (
            <TouchableOpacity
              style={tw`mb-3 flex-row items-center justify-center gap-2 bg-slate-700/50 rounded-full py-2 px-4`}
              onPress={() => changeWeek(currentWeekOffset)}
              activeOpacity={0.7}
            >
              <Ionicons name="today-outline" size={20} color="#f5f1ed" />
              <Text style={tw`text-base text-white font-medium`}>Gå til nåværende uke</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Schedule List */}
        <ScheduleList
          loading={loading}
          dayMetadata={dayMetadata}
          members={members}
          notes={notes}
          savingSlot={savingSlot}
          templateWasSuccessful={templateWasSuccessful}
          applyingTemplate={applyingTemplate}
          getDisplayName={getDisplayName}
          onSlotPress={handleSlotPress}
          onNotePress={handleNotePress}
          onDismissTemplate={onDismissTemplate}
          onAllSlotsFilled={handleAllSlotsFilled}
          dropoffAvatarRef={dropoffAvatarRef}
          noteIconRefs={noteIconRefs}
        />
      </ScrollView>
    </SafeAreaView>

    <NotesBottomSheet
      visible={notesBottomSheetVisible}
      date={selectedNoteDate || ''}
      notes={selectedNoteDate ? (notes.get(selectedNoteDate) || []) : []}
      loading={notesLoading}
      onAddNote={handleAddNote}
      onDeleteNote={handleDeleteNote}
      onClose={handleNoteClose}
    />

    {/* Contextual Tips */}
    <TipModal
      visible={!!activeTip}
      title={activeTip?.title || ''}
      message={activeTip?.message || ''}
      targetPosition={activeTip?.targetPosition}
      arrowDirection={activeTip?.arrowDirection}
      targetElement={activeTip?.targetElement}
      onDismiss={handleTipDismiss}
    />
    </>
  );
}
