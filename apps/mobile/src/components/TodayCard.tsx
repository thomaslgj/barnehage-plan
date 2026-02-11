import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/nb';

dayjs.locale('nb');

interface TodayCardProps {
  date: string; // YYYY-MM-DD format
  dropoffName?: string;
  pickupName?: string;
}

export default function TodayCard({ date, dropoffName, pickupName }: TodayCardProps) {
  const dateObj = dayjs(date);
  const isToday = dateObj.isSame(dayjs(), 'day');
  const isTomorrow = dateObj.isSame(dayjs().add(1, 'day'), 'day');

  const title = isToday ? 'I DAG' : isTomorrow ? 'I MORGEN' : dateObj.format('dddd D. MMM').toUpperCase();
  const dayName = dateObj.format('dddd');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.dayName}>{dayName}</Text>
      </View>

      <View style={styles.slots}>
        <View style={styles.slot}>
          <Text style={styles.slotLabel}>Levering</Text>
          <View style={[styles.badge, dropoffName ? styles.badgeAssigned : styles.badgeUnassigned]}>
            <Text style={[styles.badgeText, dropoffName ? styles.badgeTextAssigned : styles.badgeTextUnassigned]}>
              {dropoffName || 'Ikke satt'}
            </Text>
          </View>
        </View>

        <View style={styles.slot}>
          <Text style={styles.slotLabel}>Henting</Text>
          <View style={[styles.badge, pickupName ? styles.badgeAssigned : styles.badgeUnassigned]}>
            <Text style={[styles.badgeText, pickupName ? styles.badgeTextAssigned : styles.badgeTextUnassigned]}>
              {pickupName || 'Ikke satt'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  dayName: {
    fontSize: 16,
    color: '#6b7280',
  },
  slots: {
    gap: 12,
  },
  slot: {
    marginBottom: 12,
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeAssigned: {
    backgroundColor: '#d1fae5',
  },
  badgeUnassigned: {
    backgroundColor: '#f3f4f6',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgeTextAssigned: {
    color: '#065f46',
  },
  badgeTextUnassigned: {
    color: '#6b7280',
  },
});
