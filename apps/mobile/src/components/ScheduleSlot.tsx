import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, Animated } from 'react-native';
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
  // Use consistent arrow symbols
  const icon = slotType === 'dropoff' ? '▶' : '◀';
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      shimmerAnim.setValue(0);
    }
  }, [loading]);

  // Determine which person this is
  const getPersonIndex = () => {
    if (!userId || members.length === 0) {
      console.log(`[ScheduleSlot ${slotType}] userId is null/empty or no members, personIndex=null`);
      return null;
    }
    const index = members.findIndex(m => m.user_id === userId || m.id === userId);
    console.log(`[ScheduleSlot ${slotType}] userId=${userId}, personIndex=${index}, members.length=${members.length}`);
    return index;
  };

  const personIndex = getPersonIndex();
  const hasAssignment = Boolean(displayName && personIndex !== null && personIndex >= 0);
  console.log(`[ScheduleSlot ${slotType}] displayName=${displayName}, personIndex=${personIndex}, hasAssignment=${hasAssignment}`);

  // Get gradient colors based on person
  const getGradientColors = (): [string, string] => {
    if (personIndex === 0) {
      return ['#059669', '#0f766e']; // emerald-600 to teal-700
    } else if (personIndex === 1) {
      return ['#f59e0b', '#ea580c']; // amber-500 to orange-600
    }
    // Safeguard: if we somehow get here with hasAssignment=true, use a fallback color instead of transparent
    console.warn(`[ScheduleSlot ${slotType}] Invalid personIndex=${personIndex} with hasAssignment=${hasAssignment}`);
    return ['#64748b', '#475569']; // slate-500 to slate-600 as fallback
  };

  // Fixed dimensions - adjusted padding for more space at bottom
  const containerClasses = isInHero
    ? 'h-[60px] pt-1.5 pb-2.5 px-2'
    : 'h-[60px] pt-1.5 pb-2.5 px-2';

  const textSize = isInHero ? 'text-xl' : 'text-base';
  const iconSize = 'text-base'; // Consistent size for both arrows

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  // Render content - identical structure for both states
  const content = (
    <View style={tw`flex-1 items-center justify-center`}>
      {loading ? (
        <View style={tw`flex-1 w-full items-center justify-center relative overflow-hidden`}>
          {/* Shimmer effect */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, width: 200 }}
            />
          </Animated.View>
          <ActivityIndicator size="small" color={hasAssignment ? "#ffffff" : "#94a3b8"} />
        </View>
      ) : (
        <>
          <Text style={tw`${iconSize} ${hasAssignment ? 'text-white/90' : 'text-slate-400'}`}>
            {icon}
          </Text>
          <Text
            style={tw`${textSize} font-bold ${hasAssignment ? 'text-white' : 'text-slate-500'} mt-0.5`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayName || '—'}
          </Text>
        </>
      )}
    </View>
  );

  // Always use the same structure - just change colors based on assignment state
  const [startColor, endColor] = hasAssignment
    ? getGradientColors()
    : ['#334155', '#1e293b']; // slate-700 to slate-800 for empty slots

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
          style={tw.style(
            `${containerClasses} items-center justify-center`,
            !hasAssignment && 'border border-slate-600/50'
          )}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
