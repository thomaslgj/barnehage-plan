import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/nb';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import { Text } from '../components/Text';
import TodayCard from '../components/TodayCard';
import TodayCardSkeleton from '../components/TodayCardSkeleton';
import ScheduleSlot from '../components/ScheduleSlot';
import ScheduleSkeleton from '../components/ScheduleSkeleton';
import type { ScheduleAssignment } from '../types/db';
import tw from '../lib/tw';

dayjs.extend(isoWeek);
dayjs.locale('nb');

interface AssignmentData {
  [key: string]: string | null; // key: "YYYY-MM-DD-dropoff" or "YYYY-MM-DD-pickup", value: user_id
}

export default function MainScreen({ navigation }: any) {
  const { user, householdId, childId, members } = useHousehold();
  const [weekOffset, setWeekOffset] = useState(0);
  const [assignments, setAssignments] = useState<AssignmentData>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [templateAutoApplied, setTemplateAutoApplied] = useState(false);
  const [templateWasSuccessful, setTemplateWasSuccessful] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [childName, setChildName] = useState<string>('');
  const [myName, setMyName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [hasPlaceholderMember, setHasPlaceholderMember] = useState(false);
  const [inviteMessageDismissed, setInviteMessageDismissed] = useState(false);
  const [weekWasFullyFilled, setWeekWasFullyFilled] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [weekChanging, setWeekChanging] = useState(false);
  const initialFetchDone = useRef(false);
  const animationsTriggered = useRef(false);

  // Animation refs
  const celebrationConfettiRef = useRef<any>(null);
  const todayCardFade = useRef(new Animated.Value(1)).current;
  const messagesFade = useRef(new Animated.Value(1)).current;
  const navigationFade = useRef(new Animated.Value(1)).current;
  const scheduleFade = useRef(new Animated.Value(1)).current;
  const prevButtonScale = useRef(new Animated.Value(1)).current;
  const nextButtonScale = useRef(new Animated.Value(1)).current;
  const profileButtonScale = useRef(new Animated.Value(1)).current;

  // Calculate current week dates
  const startOfWeek = dayjs().add(weekOffset, 'week').startOf('isoWeek');
  const weekNumber = startOfWeek.isoWeek();
  const year = startOfWeek.year();

  // Generate 7 days (1 week), Mon-Fri only
  const getDaysToShow = () => {
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
  };

  const daysToShow = getDaysToShow();
  const today = dayjs().format('YYYY-MM-DD');
  const currentDayOfWeek = dayjs().day(); // 0 = Sunday, 6 = Saturday

  // On weekends, show next Monday instead of today/tomorrow
  const todayOrTomorrow = (() => {
    if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
      // It's weekend - find next Monday (first day in daysToShow)
      return daysToShow[0];
    }
    // Weekday - find today or tomorrow
    return daysToShow.find(
      (d) => d.format('YYYY-MM-DD') === today || d.format('YYYY-MM-DD') === dayjs().add(1, 'day').format('YYYY-MM-DD')
    );
  })();

  const fetchAssignments = useCallback(async (isInitialLoad = false) => {
    if (!childId || !householdId) return;

    // Show appropriate loading state
    if (isInitialLoad) {
      setLoading(true);
    } else if (!refreshing) {
      setWeekChanging(true);
    }

    try {
      // Recalculate days based on current weekOffset
      const currentStartOfWeek = dayjs().add(weekOffset, 'week').startOf('isoWeek');
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

      // Replace assignments with fresh data from database
      setAssignments(assignmentMap);
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

  // Initial fetch - deferred to avoid choppy splash animations
  useEffect(() => {
    if (childId && householdId && !initialFetchDone.current) {
      initialFetchDone.current = true;

      // Defer initial data fetching until after splash animation completes
      const fetchTimer = setTimeout(() => {
        fetchAssignments(true);
      }, 2600); // Wait for splash (2s) + fade (500ms) + small buffer (100ms)

      return () => clearTimeout(fetchTimer);
    }
  }, [childId, householdId]);

  // Set content to visible immediately when loading completes (no fade-in animation)
  useEffect(() => {
    if (!loading && !animationsTriggered.current) {
      animationsTriggered.current = true;

      // Set all animations to fully visible immediately (no fade-in)
      todayCardFade.setValue(1);
      messagesFade.setValue(1);
      navigationFade.setValue(1);
      scheduleFade.setValue(1);
    }
  }, [loading]);

  // Smooth fade animation for week changes (only after initial load)
  useEffect(() => {
    if (!initialLoadComplete) return; // Skip until after first load

    if (weekChanging) {
      // Fade out
      Animated.timing(scheduleFade, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade in
      Animated.timing(scheduleFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [weekChanging, initialLoadComplete]);

  // Fetch child name
  useEffect(() => {
    if (!childId) return;

    const fetchChildName = async () => {
      console.log('Fetching child name for childId:', childId);
      const { data, error } = await supabase
        .from('children')
        .select('name')
        .eq('id', childId)
        .single();

      console.log('Child data fetched:', data, 'error:', error);

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

  // Reset template message when week changes
  useEffect(() => {
    setTemplateAutoApplied(false);
    setTemplateWasSuccessful(false);
    setWeekWasFullyFilled(false);
  }, [weekOffset]);

  // Check if week is fully filled and trigger celebration
  useEffect(() => {
    if (loading || weekWasFullyFilled) return;

    const allSlotsFilled = daysToShow.every(day => {
      const dateStr = day.format('YYYY-MM-DD');
      const dropoffKey = `${dateStr}-dropoff`;
      const pickupKey = `${dateStr}-pickup`;
      return assignments[dropoffKey] && assignments[pickupKey];
    });

    if (allSlotsFilled && daysToShow.length > 0) {
      setWeekWasFullyFilled(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      celebrationConfettiRef.current?.start();
    }
  }, [assignments, daysToShow.length, loading]);

  // Auto-apply template if all visible slots are empty
  useEffect(() => {
    if (!childId || !householdId || !user || loading || applyingTemplate || templateAutoApplied) return;

    // Check if all slots in current view are null
    const allSlotsEmpty = daysToShow.every(day => {
      const dateStr = day.format('YYYY-MM-DD');
      const dropoffKey = `${dateStr}-dropoff`;
      const pickupKey = `${dateStr}-pickup`;
      return !assignments[dropoffKey] && !assignments[pickupKey];
    });

    // Only auto-apply if we have days to show and all are empty
    if (allSlotsEmpty && daysToShow.length > 0) {
      setApplyingTemplate(true);
      applyTemplateToWeek()
        .then((wasApplied) => {
          // Always mark as attempted to prevent infinite loop
          setTemplateAutoApplied(true);
          // Only set success flag if templates were actually applied
          setTemplateWasSuccessful(wasApplied);
        })
        .catch((error) => {
          console.error('Error applying template:', error);
          // Mark as attempted even on error to prevent infinite loop
          setTemplateAutoApplied(true);
          setTemplateWasSuccessful(false);
        })
        .finally(() => {
          setApplyingTemplate(false);
        });
    }
  }, [assignments, daysToShow.length, loading]);

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
        console.log('No template found - skipping auto-apply');
        return false; // No template to apply
      }

      console.log('Found templates:', templates);

      // Check which days in current view need assignments
      const newAssignments: Array<{
        household_id: string;
        child_id: string;
        date: string;
        slot: 'dropoff' | 'pickup';
        assigned_user_id: string | null;
        updated_by: string;
      }> = [];

      for (const day of daysToShow) {
        const dateStr = day.format('YYYY-MM-DD');
        const weekday = day.isoWeekday(); // 1-7, Monday=1

        // Check dropoff
        const dropoffKey = `${dateStr}-dropoff`;
        if (!assignments[dropoffKey]) {
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
        if (!assignments[pickupKey]) {
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
        console.log('Upserting assignments:', newAssignments.length);
        console.log('Assignments to upsert:', JSON.stringify(newAssignments, null, 2));
        const { error: upsertError } = await supabase
          .from('schedule_assignments')
          .upsert(newAssignments, { onConflict: 'child_id,date,slot' });

        if (upsertError) {
          console.error('Upsert error:', upsertError);
          return false;
        } else {
          console.log('Successfully upserted, refreshing...');
          // Refresh assignments
          await fetchAssignments();
          return true; // Successfully applied template
        }
      } else {
        console.log('No new assignments to upsert');
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

  const handleSlotPress = async (date: string, slot: 'dropoff' | 'pickup') => {
    // Clear template auto-applied message when user makes manual changes
    if (templateAutoApplied) {
      setTemplateAutoApplied(false);
    }

    if (!childId || !householdId || !user) return;

    const key = `${date}-${slot}`;
    const currentUserId = assignments[key] || null;

    // Build cycle order: null -> person1 -> person2 -> null
    // Always use member_id to match what we store in the database
    const order: (string | null)[] = [
      null,
      ...members.slice(0, 2).map(m => m.id)
    ];

    // Find current index and get next
    const currentIndex = order.indexOf(currentUserId);
    const nextIndex = (currentIndex + 1) % order.length;
    const nextUserId = order[nextIndex];

    // OPTIMISTIC UPDATE: Update UI immediately
    setAssignments((prev) => ({
      ...prev,
      [key]: nextUserId,
    }));

    // Trigger haptic feedback for immediate response
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Database update in background
    try {
      // Find the member corresponding to nextUserId (could be user_id or member id)
      const member = nextUserId ? members.find(m => m.user_id === nextUserId || m.id === nextUserId) : null;

      // Upsert assignment (set to null if empty)
      const { error } = await supabase
        .from('schedule_assignments')
        .upsert(
          {
            household_id: householdId,
            child_id: childId,
            date: date,
            slot: slot,
            assigned_member_id: member?.id || null,
            assigned_user_id: member?.user_id || null,
            updated_by: user.id,
          },
          { onConflict: 'child_id,date,slot' }
        );

      if (error) {
        console.error('Error updating assignment:', error);
        throw error;
      }
    } catch (error) {
      console.error('!!! CAUGHT ERROR - REVERTING !!!', error);
      // Revert on error
      setAssignments((prev) => ({
        ...prev,
        [key]: currentUserId,
      }));

      // Show error feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const getDisplayName = (memberId: string | null): string | undefined => {
    if (!memberId) {
      return undefined;
    }

    // Find member by id (works for both real users and placeholders)
    // Also check user_id for backwards compatibility
    const member = members.find((m) => m.id === memberId || m.user_id === memberId);
    return member?.display_name;
  };

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
    setWeekChanging(true);
    setWeekOffset(offset);

    // Fetch data for new week immediately
    // Note: fetchAssignments depends on weekOffset, so we need to fetch after state updates
    setTimeout(() => {
      if (initialLoadComplete) {
        fetchAssignments(false);
      }
    }, 0);
  }, [initialLoadComplete, fetchAssignments]);

  // Swipe gesture for week navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Only activate on horizontal movement
    .failOffsetY([-10, 10]) // Fail if vertical movement detected
    .onEnd((event) => {
      if (event.velocityX > 500) {
        // Swipe right - go to previous week
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        changeWeek(weekOffset - 1);
      } else if (event.velocityX < -500) {
        // Swipe left - go to next week
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        changeWeek(weekOffset + 1);
      }
    });

  return (
    <>
      {/* Celebration Confetti - positioned absolutely off-screen until triggered */}
      {Platform.OS !== 'web' && (
        <View style={{ position: 'absolute', top: -1000, left: -1000, zIndex: 9999 }}>
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
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7fa884']} />
          }
        >
        {/* Profile Header */}
        {childName && myName && (
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
                <Ionicons name="person-circle-outline" size={22} color="#fff" />
                <Text style={tw`text-base text-white font-medium`}>{myName}</Text>
                <Text style={tw`text-text-light text-xl`}>›</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Today/Tomorrow Card */}
        {weekOffset === 0 && (
          <Animated.View style={{ opacity: todayCardFade }}>
            {(loading || weekChanging) ? (
              <TodayCardSkeleton />
            ) : todayOrTomorrow ? (
              <TodayCard
                date={todayOrTomorrow.format('YYYY-MM-DD')}
                dropoffName={getDisplayName(assignments[`${todayOrTomorrow.format('YYYY-MM-DD')}-dropoff`])}
                pickupName={getDisplayName(assignments[`${todayOrTomorrow.format('YYYY-MM-DD')}-pickup`])}
                dropoffUserId={assignments[`${todayOrTomorrow.format('YYYY-MM-DD')}-dropoff`]}
                pickupUserId={assignments[`${todayOrTomorrow.format('YYYY-MM-DD')}-pickup`]}
                members={members}
              />
            ) : null}
          </Animated.View>
        )}

        {/* Messages Section - Invite, Template, Empty State */}
        <Animated.View style={{ opacity: messagesFade }}>
          {/* Invite Partner Message */}
          {hasPlaceholderMember && inviteCode && weekOffset === 0 && !inviteMessageDismissed && (
            <View style={tw`mb-3 bg-info/10 rounded-lg border border-info/30`}>
              {/* Header with close button */}
              <View style={tw`flex-row items-start justify-between p-4 pb-2`}>
                <Text style={tw`text-sm text-slate-200 flex-1 pr-2`}>
                  💡 Din partner har ikke blitt med enda
                </Text>
                <TouchableOpacity
                  onPress={() => setInviteMessageDismissed(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={tw`ml-2`}
                >
                  <Text style={tw`text-text-light text-xl leading-none`}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={tw`px-4 pb-4`}>
                <Text style={tw`text-xs text-slate-400 mb-2`}>
                  Del denne invitasjonskoden så de kan bli med:
                </Text>
                <View style={tw`bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700`}>
                  <Text style={tw`text-base text-white font-semibold text-center tracking-wider`}>
                    {inviteCode}
                  </Text>
                </View>
              </View>
            </View>
          )}

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

          {/* Empty State Message - show when current week and all slots empty */}
          {weekOffset === 0 && !loading && !applyingTemplate && !templateWasSuccessful && !weekChanging &&
           daysToShow.every(day => {
             const dateStr = day.format('YYYY-MM-DD');
             return !assignments[`${dateStr}-dropoff`] && !assignments[`${dateStr}-pickup`];
           }) && (
            <View style={tw`mb-3 p-4 bg-secondary/10 rounded-lg border border-secondary/30`}>
              <Text style={tw`text-base text-text text-center mb-1 font-medium`}>
                Få flyt i hverdagen 🌊
              </Text>
              <Text style={tw`text-sm text-text-light text-center`}>
                Planlegg uken din for mindre stress og mer familietid
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Week Navigation Header */}
        <Animated.View style={{ opacity: navigationFade }}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
          <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
            <TouchableOpacity
              style={tw`p-2 bg-slate-700/50 rounded-lg`}
              onPress={() => animateButtonPress(prevButtonScale, () => changeWeek(weekOffset - 1))}
              activeOpacity={0.7}
            >
              <Text style={tw`text-2xl text-text`}>‹</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={tw`flex-1 items-center px-3`}>
            <View style={tw`flex-row items-center gap-2`}>
              {weekChanging && (
                <ActivityIndicator size="small" color="#7fa884" />
              )}
              <Text style={tw`text-base font-semibold text-text`}>
                Uke {weekNumber}, {year}
              </Text>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: nextButtonScale }] }}>
            <TouchableOpacity
              style={tw`p-2 bg-slate-700/50 rounded-lg`}
              onPress={() => animateButtonPress(nextButtonScale, () => changeWeek(weekOffset + 1))}
              activeOpacity={0.7}
            >
              <Text style={tw`text-2xl text-text`}>›</Text>
            </TouchableOpacity>
          </Animated.View>
          </View>

          {/* Go to Current Week Button */}
          {weekOffset !== 0 && (
            <TouchableOpacity
              style={tw`mb-3 flex-row items-center justify-center gap-2 bg-slate-700/50 rounded-full py-2 px-4`}
              onPress={() => changeWeek(0)}
              activeOpacity={0.7}
            >
              <Ionicons name="today-outline" size={20} color="#fff" />
              <Text style={tw`text-base text-white font-medium`}>Gå til nåværende uke</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Schedule List */}
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={{ opacity: scheduleFade }}>
            {(loading || weekChanging) ? (
              <ScheduleSkeleton />
            ) : (
              <View style={tw`gap-2`}>
                {/* Header */}
                <View style={tw`flex-row gap-2 mb-2 px-1`}>
                  <View style={tw`flex-1 items-center`}>
                    <Text style={tw`text-[10px] font-medium text-slate-400`}>Levering</Text>
                  </View>
                  <View style={tw`flex-1 items-center`}>
                    <Text style={tw`text-[10px] font-medium text-slate-400`}>Henting</Text>
                  </View>
                </View>

                {/* Template Auto-Applied Message */}
                {templateWasSuccessful && !applyingTemplate && (
                  <View style={tw`mb-3 p-3 bg-primary/20 rounded-lg border border-primary/50`}>
                    <Text style={tw`text-sm text-primary-light text-center`}>
                      Uken er fylt inn fra din standard-uke. Nå har du flyt! 🌟
                    </Text>
                  </View>
                )}

                {daysToShow.map((day, index) => {
            const dateStr = day.format('YYYY-MM-DD');
            const dropoffKey = `${dateStr}-dropoff`;
            const pickupKey = `${dateStr}-pickup`;
            const isToday = day.isSame(dayjs(), 'day');

            return (
              <View key={dateStr}>
                <View style={tw.style(
                  'p-2.5 rounded-lg',
                  isToday
                    ? 'bg-secondary/20 border-2 border-secondary/50'
                    : 'bg-slate-800/50 border border-slate-700/50'
                )}>
                  <View style={tw`flex-row items-center gap-1.5 mb-2`}>
                    {isToday && <View style={tw`w-1.5 h-1.5 bg-secondary rounded-full`} />}
                    <Text style={tw.style(
                      'text-xs font-semibold capitalize',
                      isToday ? 'text-secondary-light' : 'text-text-muted'
                    )}>
                      {day.format('dddd DD.MM')}
                    </Text>
                  </View>

                  <View style={tw`flex-row gap-2`}>
                    <ScheduleSlot
                      key={`${dropoffKey}-${assignments[dropoffKey] ?? 'empty'}`}
                      slotType="dropoff"
                      displayName={getDisplayName(assignments[dropoffKey])}
                      userId={assignments[dropoffKey]}
                      members={members}
                      onPress={() => handleSlotPress(dateStr, 'dropoff')}
                      loading={savingSlot === dropoffKey}
                    />
                    <ScheduleSlot
                      key={`${pickupKey}-${assignments[pickupKey] ?? 'empty'}`}
                      slotType="pickup"
                      displayName={getDisplayName(assignments[pickupKey])}
                      userId={assignments[pickupKey]}
                      members={members}
                      onPress={() => handleSlotPress(dateStr, 'pickup')}
                      loading={savingSlot === pickupKey}
                    />
                  </View>
                </View>
              </View>
            );
          })}
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </ScrollView>
    </SafeAreaView>
    </>
  );
}
