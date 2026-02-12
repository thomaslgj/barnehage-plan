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
      return null;
    }
    const index = members.findIndex(m => m.user_id === userId || m.id === userId);
    return index;
  };

  const personIndex = getPersonIndex();
  const hasAssignment = Boolean(displayName && personIndex !== null && personIndex >= 0);

  // Person 2 (yellow background) needs dark text for contrast
  const useDarkText = personIndex === 1;

  // Get gradient colors based on person
  const getGradientColors = (): [string, string] => {
    if (personIndex === 0) {
      return ['#6b8e6f', '#5d8a7f']; // sage green to warm teal
    } else if (personIndex === 1) {
      return ['#e8c96f', '#d4b560']; // warm golden yellow
    }
    // Safeguard: if we somehow get here with hasAssignment=true, use a fallback color instead of transparent
    return ['#8b7a6a', '#6e5e4f']; // warm brown-gray fallback
  };

  // Fixed dimensions - adjusted padding for more space at bottom
  const containerClasses = isInHero
    ? 'h-[60px] pt-1.5 pb-2.5 px-2'
    : 'h-[60px] pt-1.5 pb-2.5 px-2';

  const textSize = isInHero ? 'text-xl' : 'text-base';
  const iconSize = 'text-lg'; // Consistent size for both arrows

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
          <ActivityIndicator size="small" color={hasAssignment ? (useDarkText ? "#2d2520" : "#f5f1ed") : "#a89985"} />
        </View>
      ) : (
        <>
          <Text style={tw`${iconSize} ${hasAssignment ? (useDarkText ? 'text-background/90' : 'text-white/90') : 'text-text-light'}`}>
            {icon}
          </Text>
          <Text
            style={tw`${textSize} font-bold ${hasAssignment ? (useDarkText ? 'text-background' : 'text-text') : 'text-text-light'} mt-0.5`}
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
    : ['#4a3f38', '#3d332d']; // warm brown-700 to brown-800 for empty slots

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
            !hasAssignment && 'border border-border/50'
          )}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
