import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
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

export default function MainScreen() {
  const { user, householdId, childId, members } = useHousehold();
  const [weekOffset, setWeekOffset] = useState(0);
  const [assignments, setAssignments] = useState<AssignmentData>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);

  // Calculate current week dates
  const startOfWeek = dayjs().add(weekOffset, 'week').startOf('isoWeek');
  const weekNumber = startOfWeek.isoWeek();
  const year = startOfWeek.year();

  // Generate 14 days (2 weeks), Mon-Fri only
  const getDaysToShow = () => {
    const days: dayjs.Dayjs[] = [];
    for (let i = 0; i < 14; i++) {
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
      const fromDate = daysToShow[0].format('YYYY-MM-DD');
      const toDate = daysToShow[daysToShow.length - 1].format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('schedule_assignments')
        .select('date, slot, assigned_user_id')
        .eq('child_id', childId)
        .gte('date', fromDate)
        .lte('date', toDate);

      if (error) throw error;

      // Convert to map
      const assignmentMap: AssignmentData = {};
      data?.forEach((assignment: Pick<ScheduleAssignment, 'date' | 'slot' | 'assigned_user_id'>) => {
        const key = `${assignment.date}-${assignment.slot}`;
        assignmentMap[key] = assignment.assigned_user_id;
      });

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
      fetchAssignments();
    }
  }, [fetchAssignments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const handleSlotPress = async (date: string, slot: 'dropoff' | 'pickup') => {
    if (!childId || !householdId || !user) return;

    const key = `${date}-${slot}`;
    const currentUserId = assignments[key] || null;

    // Build cycle order: null -> person1 -> person2 -> null
    const order: (string | null)[] = [
      null,
      ...members.slice(0, 2).map(m => m.user_id || m.id)
    ];

    // Find current index and get next
    const currentIndex = order.indexOf(currentUserId);
    const nextIndex = (currentIndex + 1) % order.length;
    const nextUserId = order[nextIndex];

    // Optimistic update
    setSavingSlot(key);
    setAssignments((prev) => {
      if (nextUserId === null) {
        const newAssignments = { ...prev };
        delete newAssignments[key];
        return newAssignments;
      }
      return { ...prev, [key]: nextUserId };
    });

    try {
      if (nextUserId === null) {
        // Delete assignment
        const { error } = await supabase
          .from('schedule_assignments')
          .delete()
          .eq('child_id', childId)
          .eq('date', date)
          .eq('slot', slot);

        if (error) throw error;
      } else {
        // Upsert assignment
        const { error } = await supabase
          .from('schedule_assignments')
          .upsert(
            {
              household_id: householdId,
              child_id: childId,
              date: date,
              slot: slot,
              assigned_user_id: nextUserId,
              updated_by: user.id,
            },
            { onConflict: 'child_id,date,slot' }
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      // Revert on error
      setAssignments((prev) => {
        if (currentUserId === null) {
          const newAssignments = { ...prev };
          delete newAssignments[key];
          return newAssignments;
        }
        return { ...prev, [key]: currentUserId };
      });
    } finally {
      setSavingSlot(null);
    }
  };

  const getDisplayName = (userId: string | null): string | undefined => {
    if (!userId) return undefined;

    // Find member by user_id or by member.id (for placeholder partners)
    const member = members.find((m) => m.user_id === userId || m.id === userId);
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
    <View style={tw`flex-1 bg-background`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
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

            // Check if it's a new week
            const prevDay = index > 0 ? daysToShow[index - 1] : null;
            const isNewWeek = prevDay && day.isoWeek() !== prevDay.isoWeek();

            return (
              <View key={dateStr}>
                {isNewWeek && (
                  <View style={tw`my-3 border-t border-slate-700/30`}>
                    <Text style={tw`mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider`}>
                      Uke {day.isoWeek()}
                    </Text>
                  </View>
                )}

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
                      slotType="dropoff"
                      displayName={getDisplayName(assignments[dropoffKey])}
                      userId={assignments[dropoffKey]}
                      members={members}
                      onPress={() => handleSlotPress(dateStr, 'dropoff')}
                      loading={savingSlot === dropoffKey}
                    />
                    <ScheduleSlot
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
      </ScrollView>
    </View>
  );
}
