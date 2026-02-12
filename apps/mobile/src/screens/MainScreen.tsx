import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/nb';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import TodayCard from '../components/TodayCard';
import ScheduleSlot from '../components/ScheduleSlot';
import type { ScheduleAssignment } from '../types/db';
import tw from '../lib/tw';

dayjs.extend(isoWeek);
dayjs.locale('nb');

interface AssignmentData {
  [key: string]: string | null; // key: "YYYY-MM-DD-dropoff" or "YYYY-MM-DD-pickup", value: user_id
}

export default function MainScreen({ navigation }: any) {
  const { user, householdId, childId, members, forceOnboarding } = useHousehold();
  const [weekOffset, setWeekOffset] = useState(0);
  const [assignments, setAssignments] = useState<AssignmentData>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [templateAutoApplied, setTemplateAutoApplied] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [childName, setChildName] = useState<string>('');
  const [myName, setMyName] = useState<string>('');

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
  const todayOrTomorrow = daysToShow.find(
    (d) => d.format('YYYY-MM-DD') === today || d.format('YYYY-MM-DD') === dayjs().add(1, 'day').format('YYYY-MM-DD')
  );

  const fetchAssignments = useCallback(async () => {
    if (!childId || !householdId) return;

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
      setLoading(false);
      setRefreshing(false);
    }
  }, [childId, householdId, weekOffset]);

  useEffect(() => {
    if (childId && householdId) {
      setLoading(true);
      fetchAssignments();
    }
  }, [fetchAssignments, childId, householdId]);

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

  // Reset template message when week changes
  useEffect(() => {
    setTemplateAutoApplied(false);
  }, [weekOffset]);

  // Auto-apply template if all visible slots are empty
  useEffect(() => {
    if (!childId || !householdId || !user || loading || applyingTemplate) return;

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
        .then(() => {
          setTemplateAutoApplied(true);
        })
        .catch((error) => {
          console.error('Error applying template:', error);
        })
        .finally(() => {
          setApplyingTemplate(false);
        });
    }
  }, [assignments, daysToShow.length, loading, applyingTemplate]);

  // Note: Automatic template application is disabled
  // Use the debug button below to manually apply template when needed

  // Apply template to empty weeks
  const applyTemplateToWeek = async () => {
    if (!childId || !householdId || !user) return;

    try {
      // Fetch template
      const { data: templates, error: templateError } = await supabase
        .from('schedule_templates')
        .select('weekday, slot, assigned_member_id, assigned_user_id')
        .eq('household_id', householdId)
        .eq('child_id', childId);

      if (templateError) {
        console.error('Template error:', templateError);
        return;
      }

      if (!templates || templates.length === 0) {
        console.log('No template found - skipping auto-apply');
        return; // This is OK, just means no template to apply
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

      // Insert new assignments from template
      if (newAssignments.length > 0) {
        console.log('Inserting assignments:', newAssignments.length);
        console.log('Assignments to insert:', JSON.stringify(newAssignments, null, 2));
        const { error: insertError } = await supabase
          .from('schedule_assignments')
          .insert(newAssignments);

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          console.log('Successfully inserted, refreshing...');
          // Refresh assignments
          await fetchAssignments();
        }
      } else {
        console.log('No new assignments to insert');
      }
    } catch (error) {
      console.error('Error applying template:', error);
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

    // Set loading state
    setSavingSlot(key);

    try {
      // Always upsert (even for null) instead of deleting
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
      // Fetch assignments to sync with database and ensure consistency
      await fetchAssignments();
    } catch (error) {
      console.error('!!! CAUGHT ERROR - REVERTING !!!', error);
      // Revert on error
      setAssignments((prev) => ({
        ...prev,
        [key]: currentUserId,
      }));
    } finally {
      setSavingSlot(null);
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

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-background`}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-background`} edges={['top']}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {/* Profile Header */}
        {childName && myName && (
          <View style={tw`flex-row items-center justify-between mb-6`}>
            {/* Child info (non-clickable) */}
            <View style={tw`flex-row items-center gap-2 bg-slate-800/30 rounded-full py-2 px-4`}>
              <MaterialCommunityIcons name="baby-face-outline" size={22} color="#94a3b8" />
              <Text style={tw`text-base text-slate-300 font-medium`}>{childName}</Text>
            </View>

            {/* User info (clickable) */}
            <TouchableOpacity
              style={tw`flex-row items-center gap-2 bg-slate-700/50 rounded-full py-2 px-4`}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle-outline" size={22} color="#fff" />
              <Text style={tw`text-base text-white font-medium`}>{myName}</Text>
              <Text style={tw`text-slate-400 text-lg`}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today/Tomorrow Card */}
        {todayOrTomorrow && weekOffset === 0 && (
          <TodayCard
            date={todayOrTomorrow.format('YYYY-MM-DD')}
            dropoffName={getDisplayName(assignments[`${todayOrTomorrow.format('YYYY-MM-DD')}-dropoff`])}
            pickupName={getDisplayName(assignments[`${todayOrTomorrow.format('YYYY-MM-DD')}-pickup`])}
            dropoffUserId={assignments[`${todayOrTomorrow.format('YYYY-MM-DD')}-dropoff`]}
            pickupUserId={assignments[`${todayOrTomorrow.format('YYYY-MM-DD')}-pickup`]}
            members={members}
          />
        )}

        {/* Template Loading Animation */}
        {applyingTemplate && (
          <View style={tw`mb-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50`}>
            <View style={tw`flex-row items-center justify-center gap-2`}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={tw`text-sm text-slate-300`}>
                Fyller inn standarduke...
              </Text>
            </View>
          </View>
        )}

        {/* Template Auto-Applied Message */}
        {templateAutoApplied && !applyingTemplate && (
          <View style={tw`mb-3 p-3 bg-emerald-500/20 rounded-lg border border-emerald-400/50`}>
            <Text style={tw`text-sm text-emerald-200 text-center`}>
              ✓ Standarduke er fylt inn
            </Text>
          </View>
        )}

        {/* Week Navigation Header */}
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <TouchableOpacity
            style={tw`p-2 bg-slate-700/50 rounded-lg`}
            onPress={() => setWeekOffset(weekOffset - 1)}
          >
            <Text style={tw`text-xl text-white`}>‹</Text>
          </TouchableOpacity>

          <View style={tw`flex-1 items-center px-3`}>
            <Text style={tw`text-base font-semibold text-white`}>
              Uke {weekNumber}, {year}
            </Text>
          </View>

          <TouchableOpacity
            style={tw`p-2 bg-slate-700/50 rounded-lg`}
            onPress={() => setWeekOffset(weekOffset + 1)}
          >
            <Text style={tw`text-xl text-white`}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Go to Current Week Button */}
        {weekOffset !== 0 && (
          <TouchableOpacity
            style={tw`mb-3 py-2 px-3 bg-blue-500/20 rounded-lg border border-blue-400/50`}
            onPress={() => setWeekOffset(0)}
          >
            <Text style={tw`text-center text-sm text-blue-200 font-medium`}>
              📅 Gå til nåværende uke
            </Text>
          </TouchableOpacity>
        )}

        {/* Schedule List */}
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
                    ? 'bg-blue-500/20 border-2 border-blue-400/50'
                    : 'bg-slate-800/50 border border-slate-700/50'
                )}>
                  <View style={tw`flex-row items-center gap-1.5 mb-2`}>
                    {isToday && <View style={tw`w-1.5 h-1.5 bg-blue-400 rounded-full`} />}
                    <Text style={tw.style(
                      'text-xs font-semibold capitalize',
                      isToday ? 'text-blue-300' : 'text-slate-300'
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

        {/* Debug: Test Onboarding Button */}
        <TouchableOpacity
          style={tw`mt-6 mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50`}
          onPress={forceOnboarding}
        >
          <Text style={tw`text-center text-sm text-slate-300`}>
            Test Onboarding (Debug)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
