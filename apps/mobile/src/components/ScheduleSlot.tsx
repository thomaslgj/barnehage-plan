import React, { useEffect, useRef, useMemo, memo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  // Use consistent arrow symbols
  const icon = slotType === 'dropoff' ? '▶' : '◀';
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
  }, [loading, shimmerAnim]);

  // Determine which person this is - memoized
  const personIndex = useMemo(() => {
    if (!userId || members.length === 0) {
      console.log('personIndex: userId is null or no members');
      return null;
    }
    const index = members.findIndex(m => m.user_id === userId || m.id === userId);
    console.log('personIndex calculation:', { userId, index, members: members.map(m => ({ id: m.id, user_id: m.user_id })) });
    return index;
  }, [userId, members]);

  const hasAssignment = Boolean(displayName && personIndex !== null && personIndex >= 0);
  console.log('ScheduleSlot computed values:', { personIndex, hasAssignment, displayName, userId });

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

  // Fixed dimensions - adjusted padding for more space at bottom
  const containerClasses = isInHero
    ? 'h-[60px] pt-1.5 pb-2.5 px-2'
    : 'h-[60px] pt-1.5 pb-2.5 px-2';

  const textSize = isInHero ? 'text-xl' : 'text-base';
  const iconSize = 'text-lg'; // Consistent size for both arrows

  const shimmerTranslate = useMemo(() => shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  }), [shimmerAnim]);

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
          <Text style={[tw`${iconSize}`, { fontFamily: 'Manrope_400Regular', color: hasAssignment ? (useDarkText ? '#2d2520' : '#ffffff') : '#a89985' }]}>
            {icon}
          </Text>
          <Text
            style={[tw`${textSize} font-bold mt-0.5`, { fontFamily: 'Manrope_400Regular', color: hasAssignment ? (useDarkText ? '#2d2520' : '#ffffff') : '#a89985' }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayName || '—'}
          </Text>
        </>
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
    console.log('backgroundColor calculated:', { hasAssignment, personIndex, backgroundColor: color });
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
              `${containerClasses} items-center justify-center rounded-lg overflow-hidden`,
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
