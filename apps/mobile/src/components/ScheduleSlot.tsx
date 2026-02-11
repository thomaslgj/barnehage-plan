import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ScheduleSlotProps {
  slotType: 'dropoff' | 'pickup';
  displayName?: string;
  onPress: () => void;
  loading?: boolean;
}

export default function ScheduleSlot({ slotType, displayName, onPress, loading }: ScheduleSlotProps) {
  const icon = slotType === 'dropoff' ? '→' : '←';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        displayName ? styles.containerAssigned : styles.containerUnassigned,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#6b7280" />
      ) : (
        <>
          <Text style={styles.icon}>{icon}</Text>
          <Text
            style={[
              styles.text,
              displayName ? styles.textAssigned : styles.textUnassigned,
            ]}
            numberOfLines={1}
          >
            {displayName || '—'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 100,
  },
  containerAssigned: {
    backgroundColor: '#d1fae5',
  },
  containerUnassigned: {
    backgroundColor: '#f3f4f6',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  textAssigned: {
    color: '#065f46',
  },
  textUnassigned: {
    color: '#9ca3af',
  },
});
