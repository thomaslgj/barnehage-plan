import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { HouseholdMember } from '../types/db';

interface AssignmentModalProps {
  visible: boolean;
  date: string;
  slotType: 'dropoff' | 'pickup';
  currentAssignedUserId: string | null;
  members: HouseholdMember[];
  onSelect: (userId: string | null) => void;
  onClose: () => void;
}

export default function AssignmentModal({
  visible,
  date,
  slotType,
  currentAssignedUserId,
  members,
  onSelect,
  onClose,
}: AssignmentModalProps) {
  const slotLabel = slotType === 'dropoff' ? 'Levering' : 'Henting';

  const handleSelect = (userId: string | null) => {
    onSelect(userId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Velg ansvarlig</Text>
            <Text style={styles.subtitle}>
              {slotLabel} - {date}
            </Text>
          </View>

          <ScrollView style={styles.list}>
            <TouchableOpacity
              style={[
                styles.option,
                currentAssignedUserId === null && styles.optionSelected,
              ]}
              onPress={() => handleSelect(null)}
            >
              <Text
                style={[
                  styles.optionText,
                  currentAssignedUserId === null && styles.optionTextSelected,
                ]}
              >
                Ikke satt
              </Text>
              {currentAssignedUserId === null && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>

            {members.map((member) => {
              // Use user_id for comparison if available, otherwise use member.id
              const memberId = member.user_id || member.id;
              const isSelected = currentAssignedUserId === memberId;

              return (
                <TouchableOpacity
                  key={member.id}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => handleSelect(memberId)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {member.display_name}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Avbryt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  list: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionSelected: {
    backgroundColor: '#f0fdf4',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#10b981',
  },
  cancelButton: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
});
