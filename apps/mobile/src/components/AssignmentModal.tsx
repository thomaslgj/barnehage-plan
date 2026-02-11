import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { HouseholdMember } from '../types/db';
import tw from '../lib/tw';

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
      <View style={tw`flex-1 bg-black/60 justify-end`}>
        <View style={tw`bg-slate-800 rounded-t-2xl max-h-[80%]`}>
          <View style={tw`p-5 border-b border-slate-700`}>
            <Text style={tw`text-xl font-bold text-white mb-1`}>Velg ansvarlig</Text>
            <Text style={tw`text-sm text-slate-300`}>
              {slotLabel} - {date}
            </Text>
          </View>

          <ScrollView style={tw`max-h-[400px]`}>
            <TouchableOpacity
              style={tw.style(
                'flex-row items-center justify-between py-4 px-5 border-b border-slate-700/50',
                currentAssignedUserId === null && 'bg-primary/20'
              )}
              onPress={() => handleSelect(null)}
            >
              <Text
                style={tw.style(
                  'text-base',
                  currentAssignedUserId === null ? 'text-primary font-semibold' : 'text-slate-200'
                )}
              >
                Ikke satt
              </Text>
              {currentAssignedUserId === null && (
                <Text style={tw`text-xl text-primary`}>✓</Text>
              )}
            </TouchableOpacity>

            {members.map((member) => {
              const memberId = member.user_id || member.id;
              const isSelected = currentAssignedUserId === memberId;

              return (
                <TouchableOpacity
                  key={member.id}
                  style={tw.style(
                    'flex-row items-center justify-between py-4 px-5 border-b border-slate-700/50',
                    isSelected && 'bg-primary/20'
                  )}
                  onPress={() => handleSelect(memberId)}
                >
                  <Text
                    style={tw.style(
                      'text-base',
                      isSelected ? 'text-primary font-semibold' : 'text-slate-200'
                    )}
                  >
                    {member.display_name}
                  </Text>
                  {isSelected && <Text style={tw`text-xl text-primary`}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={tw`p-5 items-center border-t border-slate-700`}
            onPress={onClose}
          >
            <Text style={tw`text-base text-slate-300 font-semibold`}>Avbryt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
