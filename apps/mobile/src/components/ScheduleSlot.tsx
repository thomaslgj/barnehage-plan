import React, { useMemo, memo, useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
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

const ScheduleSlot = memo(function ScheduleSlot({
  slotType,
  displayName,
  userId,
  members = [],
  onPress,
  loading,
  isInHero = false
}: ScheduleSlotProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Determine which person this is - memoized
  const personIndex = useMemo(() => {
    if (!userId || members.length === 0) {
      return null;
    }
    const index = members.findIndex(m => m.user_id === userId || m.id === userId);
    return index;
  }, [userId, members]);

  const hasAssignment = Boolean(displayName && personIndex !== null && personIndex >= 0);

  // Person 2 (yellow background) needs dark text for contrast
  const useDarkText = personIndex === 1;

  // Get gradient colors based on person - memoized
  const gradientColors = useMemo((): [string, string] => {
    if (personIndex === 0) {
      return ['#6b8e6f', '#5d8a7f']; // sage green to warm teal
    } else if (personIndex === 1) {
      return ['#e8c96f', '#d4b560']; // warm golden yellow
    }
    // Safeguard: if we somehow get here with hasAssignment=true, use a fallback color instead of transparent
    return ['#8b7a6a', '#6e5e4f']; // warm brown-gray fallback
  }, [personIndex]);

  // Fixed dimensions - reduced height with horizontal layout
  const containerClasses = isInHero
    ? 'h-[50px] py-2.5 px-3'
    : 'h-[50px] py-2.5 px-3';

  const textSize = isInHero ? 'text-xl' : 'text-base';

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  // Render content - centered text without arrow (chevron shape indicates direction)
  const content = (
    <View style={tw`flex-1 items-center justify-center px-2`}>
      {loading ? (
        <ActivityIndicator size="small" color={hasAssignment ? (useDarkText ? "#2d2520" : "#f5f1ed") : "#a89985"} />
      ) : (
        <Text
          style={[tw`${textSize} font-bold`, { fontFamily: 'Manrope_400Regular', color: hasAssignment ? (useDarkText ? '#2d2520' : '#ffffff') : '#a89985' }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayName || '—'}
        </Text>
      )}
    </View>
  );

  // Get background color based on assignment (simplified - no gradient for testing)
  const backgroundColor = useMemo(() => {
    let color;
    if (!hasAssignment) color = '#4a3f38'; // empty slot color
    else if (personIndex === 0) color = '#6b8e6f'; // person 1 color
    else if (personIndex === 1) color = '#e8c96f'; // person 2 color
    else color = '#8b7a6a'; // fallback
    return color;
  }, [hasAssignment, personIndex]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        activeOpacity={0.7}
        style={[
          tw.style(
            `${containerClasses} items-center justify-center rounded-lg`,
            !hasAssignment && 'border border-border/50',
            loading && 'opacity-50'
          ),
          { backgroundColor }
        ]}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these specific props change
  return (
    prevProps.displayName === nextProps.displayName &&
    prevProps.userId === nextProps.userId &&
    prevProps.loading === nextProps.loading &&
    prevProps.slotType === nextProps.slotType &&
    prevProps.isInHero === nextProps.isInHero
    // Deliberately skip members and onPress - they shouldn't cause re-renders
  );
});

export default ScheduleSlot;
