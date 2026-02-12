import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import tw from '../lib/tw';

interface EquipmentStatusBadgeProps {
  status: 'ready' | 'missing' | 'not_ready';
  onPress: () => void;
}

export default function EquipmentStatusBadge({ status, onPress }: EquipmentStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
        return {
          label: 'Alt klart for barnehagen',
          dotStyle: 'bg-success', // green-500
          borderStyle: 'border-success/30',
          textStyle: 'text-slate-200',
          showCheckmark: true,
        };
      case 'missing':
        return {
          label: 'Bør ordnes',
          dotStyle: 'bg-warning', // yellow-500
          borderStyle: 'border-warning/30',
          textStyle: 'text-slate-200',
          showCheckmark: false,
        };
      case 'not_ready':
        return {
          label: 'Må ordnes før i morgen',
          dotStyle: 'bg-error', // red-500
          borderStyle: 'border-error/30',
          textStyle: 'text-slate-200',
          showCheckmark: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TouchableOpacity
      style={tw.style(
        'flex-row items-center justify-between gap-2 px-4 py-2.5 rounded-lg border w-full',
        config.borderStyle
      )}
      onPress={onPress}
    >
      <View style={tw`flex-row items-center gap-2 flex-1`}>
        {config.showCheckmark ? (
          <Text style={tw`text-success text-xl`}>✓</Text>
        ) : (
          <View style={tw.style('w-2.5 h-2.5 rounded-full', config.dotStyle)} />
        )}
        <Text style={tw.style('text-sm font-medium flex-1', config.textStyle)}>{config.label}</Text>
      </View>
      <Text style={tw`text-text-light text-xl`}>›</Text>
    </TouchableOpacity>
  );
}
