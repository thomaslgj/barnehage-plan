import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tw';

interface ScheduleSlotProps {
  slotType: 'dropoff' | 'pickup';
  displayName?: string;
  userId?: string | null;
  members?: Array<{ id: string; user_id: string | null }>;
  onPress: () => void;
  loading?: boolean;
  isInHero?: boolean;
}

export default function ScheduleSlot({
  slotType,
  displayName,
  userId,
  members = [],
  onPress,
  loading,
  isInHero = false
}: ScheduleSlotProps) {
  const icon = slotType === 'dropoff' ? '→' : '←';

  // Determine which person this is
  const getPersonIndex = () => {
    if (!userId || members.length === 0) return null;
    const index = members.findIndex(m => (m.user_id || m.id) === userId);
    return index;
  };

  const personIndex = getPersonIndex();

  // Get gradient colors based on person
  const getGradientColors = (): [string, string] => {
    if (personIndex === 0) {
      return ['#059669', '#0f766e']; // emerald-600 to teal-700
    } else if (personIndex === 1) {
      return ['#f59e0b', '#ea580c']; // amber-500 to orange-600
    }
    return ['transparent', 'transparent'];
  };

  const hasAssignment = displayName && personIndex !== null && personIndex >= 0;

  // Fixed dimensions - exact same for both states
  const containerClasses = isInHero
    ? 'h-[68px] py-2.5 px-2'
    : 'h-[68px] py-2.5 px-2';

  const textSize = isInHero ? 'text-xl' : 'text-base';
  const iconSize = 'text-sm';

  // Render content - identical structure for both states
  const content = (
    <View style={tw`flex-1 items-center justify-center`}>
      {loading ? (
        <ActivityIndicator size="small" color={hasAssignment ? "#ffffff" : "#94a3b8"} />
      ) : (
        <>
          <Text style={tw`${iconSize} mb-0.5 ${hasAssignment ? 'text-white/90' : 'text-slate-400'}`}>
            {icon}
          </Text>
          <Text
            style={tw`${textSize} font-bold ${hasAssignment ? 'text-white' : 'text-slate-500'}`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayName || '—'}
          </Text>
        </>
      )}
    </View>
  );

  if (hasAssignment) {
    // Assigned slot with gradient
    const [startColor, endColor] = getGradientColors();

    return (
      <View style={tw`flex-1`}>
        <TouchableOpacity
          style={tw.style('rounded-lg overflow-hidden', loading && 'opacity-50')}
          onPress={onPress}
          disabled={loading}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[startColor, endColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`${containerClasses} items-center justify-center`}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty slot
  return (
    <View style={tw`flex-1`}>
      <TouchableOpacity
        style={tw.style(
          `rounded-lg ${containerClasses} items-center justify-center bg-slate-700/50 border border-slate-600/50`,
          loading && 'opacity-50'
        )}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    </View>
  );
}
