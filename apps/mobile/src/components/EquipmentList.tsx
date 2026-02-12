import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import tw from '../lib/tw';

interface EquipmentItem {
  key: string;
  label: string;
  is_critical: boolean;
}

interface EquipmentListProps {
  items: EquipmentItem[];
  onToggleCritical: (key: string) => void;
  onRename: (key: string) => void;
  onRemove: (key: string) => void;
}

export default function EquipmentList({
  items,
  onToggleCritical,
  onRename,
  onRemove,
}: EquipmentListProps) {
  return (
    <View>
      {items.map((item) => (
        <View key={item.key} style={tw`mb-3 bg-slate-800/50 rounded-lg p-3`}>
          {/* Item header with name and critical toggle */}
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <Text style={[tw`text-white flex-1`, { fontFamily: 'Manrope_400Regular' }]}>
              {item.label}
            </Text>
            <View style={tw`flex-row items-center gap-2`}>
              <Text style={[tw`text-xs text-slate-400`, { fontFamily: 'Manrope_400Regular' }]}>
                {item.is_critical ? 'Nødvendig' : 'Valgfritt'}
              </Text>
              <Switch
                value={item.is_critical}
                onValueChange={() => onToggleCritical(item.key)}
                trackColor={{ false: '#4a3f38', true: '#6b8e6f' }}
                thumbColor={item.is_critical ? '#7fa884' : '#8b7a6a'}
              />
            </View>
          </View>

          {/* Action buttons */}
          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              style={tw`flex-1 bg-slate-700 rounded px-3 py-1.5`}
              onPress={() => onRename(item.key)}
            >
              <Text style={[tw`text-slate-300 text-sm text-center`, { fontFamily: 'Manrope_400Regular' }]}>
                Endre
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-error/20 rounded px-3 py-1.5`}
              onPress={() => onRemove(item.key)}
            >
              <Text style={[tw`text-error text-sm text-center`, { fontFamily: 'Manrope_400Regular' }]}>
                Slett
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
