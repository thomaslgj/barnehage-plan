import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import tw from '../lib/tw';

interface AddEquipmentItemProps {
  value: string;
  onChangeText: (text: string) => void;
  onAdd: () => void;
}

export default function AddEquipmentItem({
  value,
  onChangeText,
  onAdd,
}: AddEquipmentItemProps) {
  return (
    <View>
      <Text style={[tw`text-sm font-semibold text-slate-300 mb-2`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
        Legg til nytt
      </Text>
      <View style={tw`flex-row gap-2`}>
        <TextInput
          style={[tw`flex-1 bg-slate-800/50 border border-slate-700 rounded px-4 py-3 text-white`, { fontFamily: 'PlusJakartaSans_400Regular' }]}
          placeholder="Navn på utstyr"
          placeholderTextColor="#a89985"
          value={value}
          onChangeText={onChangeText}
        />
        <TouchableOpacity
          style={tw.style('bg-primary rounded px-4 py-3', !value.trim() && 'opacity-50')}
          onPress={onAdd}
          disabled={!value.trim()}
        >
          <Text style={[tw`text-white font-semibold`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
