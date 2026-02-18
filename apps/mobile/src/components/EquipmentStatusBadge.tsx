import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import tw from '../lib/tw';
import type { EquipmentItem } from '../types/db';

interface EquipmentStatusBadgeProps {
  status: 'ready' | 'missing' | 'not_ready';
  items: EquipmentItem[];
  onPress: () => void;
}

export default function EquipmentStatusBadge({ status, items, onPress }: EquipmentStatusBadgeProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
        return {
          label: 'Alt klart for barnehagen',
          dotStyle: 'bg-success',
          borderStyle: 'border-success/40',
          bgStyle: 'bg-success/10',
          textStyle: 'text-text',
          iconStyle: 'text-success text-2xl',
          showCheckmark: true,
        };
      case 'missing':
        return {
          label: 'Bør ordnes',
          dotStyle: 'bg-warning',
          borderStyle: 'border-warning/30',
          bgStyle: 'bg-transparent',
          textStyle: 'text-slate-200',
          iconStyle: '',
          showCheckmark: false,
        };
      case 'not_ready':
        return {
          label: 'Må ordnes før i morgen',
          dotStyle: 'bg-error',
          borderStyle: 'border-error/30',
          bgStyle: 'bg-transparent',
          textStyle: 'text-slate-200',
          iconStyle: '',
          showCheckmark: false,
        };
    }
  };

  const config = getStatusConfig();

  // Get missing items
  const missingItems = items.filter(item => item.status === 'missing');
  const criticalMissing = missingItems.filter(item => item.is_critical);
  const nonCriticalMissing = missingItems.filter(item => !item.is_critical);

  // Build details text
  const getDetailsText = () => {
    if (status === 'ready') return null;

    const itemsToShow = status === 'not_ready' ? criticalMissing : nonCriticalMissing;
    if (itemsToShow.length === 0) return null;

    return itemsToShow.map(item => item.label).join(', ');
  };

  const detailsText = getDetailsText();

  return (
    <View style={tw`w-full`}>
      <TouchableOpacity
        style={tw.style(
          'flex-row items-center justify-between gap-3 px-5 py-3 rounded-full border',
          config.borderStyle,
          config.bgStyle
        )}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={tw`flex-row items-center gap-3 flex-1`}>
          {config.showCheckmark ? (
            <Text style={[tw.style(config.iconStyle), { fontFamily: 'PlusJakartaSans_400Regular' }]}>✓</Text>
          ) : (
            <View style={tw.style('w-2.5 h-2.5 rounded-full', config.dotStyle)} />
          )}
          <View style={tw`flex-1`}>
            <Text style={[tw.style('text-base font-semibold', config.textStyle), { fontFamily: 'PlusJakartaSans_400Regular' }]}>{config.label}</Text>
            {detailsText && (
              <Text style={[tw`text-sm text-text-light mt-1`, { fontFamily: 'PlusJakartaSans_400Regular' }]} numberOfLines={2}>
                {detailsText}
              </Text>
            )}
          </View>
        </View>
        <Text style={[tw`text-text-light text-2xl`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}
