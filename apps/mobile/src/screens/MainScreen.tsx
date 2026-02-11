import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import AssignmentModal from '../components/AssignmentModal';
import type { ScheduleAssignment } from '../types/db';

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

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<'dropoff' | 'pickup'>('dropoff');
  const [selectedCurrentUserId, setSelectedCurrentUserId] = useState<string | null>(null);

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

  const handleSlotPress = (date: string, slot: 'dropoff' | 'pickup') => {
    const key = `${date}-${slot}`;
    const currentUserId = assignments[key] || null;

    setSelectedDate(date);
    setSelectedSlot(slot);
    setSelectedCurrentUserId(currentUserId);
    setModalVisible(true);
  };

  const handleAssignmentSelect = async (userId: string | null) => {
    if (!childId || !householdId || !user) return;

    const key = `${selectedDate}-${selectedSlot}`;
    setSavingSlot(key);

    try {
      if (userId === null) {
        // Delete assignment
        const { error } = await supabase
          .from('schedule_assignments')
          .delete()
          .eq('child_id', childId)
          .eq('date', selectedDate)
          .eq('slot', selectedSlot);

        if (error) throw error;

        setAssignments((prev) => {
          const newAssignments = { ...prev };
          delete newAssignments[key];
          return newAssignments;
        });
      } else {
        // Upsert assignment
        const { error } = await supabase
          .from('schedule_assignments')
          .upsert(
            {
              household_id: householdId,
              child_id: childId,
              date: selectedDate,
              slot: selectedSlot,
              assigned_user_id: userId,
              updated_by: user.id,
            },
            { onConflict: 'child_id,date,slot' }
          );

        if (error) throw error;

        setAssignments((prev) => ({
          ...prev,
          [key]: userId,
        }));
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setWeekOffset(weekOffset - 1)}
        >
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Uke {weekNumber}, {year}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setWeekOffset(weekOffset + 1)}
        >
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Today/Tomorrow Card */}
        {todayOrTomorrow && weekOffset === 0 && (
          <TodayCard
            date={todayOrTomorrow.format('YYYY-MM-DD')}
            dropoffName={getDisplayName(assignments[`${todayOrTomorrow.format('YYYY-MM-DD')}-dropoff`])}
            pickupName={getDisplayName(assignments[`${todayOrTomorrow.format('YYYY-MM-DD')}-pickup`])}
          />
        )}

        {/* Schedule List */}
        <View style={styles.scheduleContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Dato</Text>
            <Text style={styles.tableHeaderText}>Levering</Text>
            <Text style={styles.tableHeaderText}>Henting</Text>
          </View>

          {daysToShow.map((day) => {
            const dateStr = day.format('YYYY-MM-DD');
            const dropoffKey = `${dateStr}-dropoff`;
            const pickupKey = `${dateStr}-pickup`;

            return (
              <View key={dateStr} style={styles.dayRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dayName}>{day.format('ddd')}</Text>
                  <Text style={styles.dayDate}>{day.format('D/M')}</Text>
                </View>

                <View style={styles.slotColumn}>
                  <ScheduleSlot
                    slotType="dropoff"
                    displayName={getDisplayName(assignments[dropoffKey])}
                    onPress={() => handleSlotPress(dateStr, 'dropoff')}
                    loading={savingSlot === dropoffKey}
                  />
                </View>

                <View style={styles.slotColumn}>
                  <ScheduleSlot
                    slotType="pickup"
                    displayName={getDisplayName(assignments[pickupKey])}
                    onPress={() => handleSlotPress(dateStr, 'pickup')}
                    loading={savingSlot === pickupKey}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Assignment Modal */}
      <AssignmentModal
        visible={modalVisible}
        date={selectedDate}
        slotType={selectedSlot}
        currentAssignedUserId={selectedCurrentUserId}
        members={members}
        onSelect={handleAssignmentSelect}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 24,
    color: '#10b981',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  scheduleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    flex: 1,
  },
  dayRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  dateColumn: {
    flex: 1,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  dayDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  slotColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
});
