import React, { useMemo, memo, useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import tw from '../lib/tw';
import Avatar from './Avatar';

interface ScheduleSlotProps {
  slotType: 'dropoff' | 'pickup';
  displayName?: string;
  userId?: string | null;
  members?: Array<{ id: string; user_id: string | null; avatar_id?: string | null }>;
  onPress: () => void;
  loading?: boolean;
  isInHero?: boolean;
  textOpacity?: Animated.Value;
}

const ScheduleSlot = memo(function ScheduleSlot({
  slotType,
  displayName,
  userId,
  members = [],
  onPress,
  loading,
  isInHero = false,
  textOpacity
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

  // Get avatar ID from member
  const avatarId = useMemo(() => {
    if (!userId || members.length === 0) {
      return null;
    }
    const member = members.find(m => m.user_id === userId || m.id === userId);
    return member?.avatar_id || null;
  }, [userId, members]);

  const hasAssignment = Boolean(displayName && personIndex !== null && personIndex >= 0);

  // Get border color based on assignment - must be defined before content
  const borderColor = useMemo(() => {
    if (!hasAssignment) return '#4a3f38'; // empty slot color
    if (personIndex === 0) return '#6b8e6f'; // person 1 color
    if (personIndex === 1) return '#e8c96f'; // person 2 color
    return '#8b7a6a'; // fallback
  }, [hasAssignment, personIndex]);

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

  // Fixed dimensions - transparent background with thick border
  // For schedule: remove padding on side facing center (dropoff: right, pickup: left)
  const containerClasses = isInHero
    ? 'h-[70px] py-2 px-3'
    : (slotType === 'dropoff' ? 'h-[70px] py-1 pl-1 pr-0' : 'h-[70px] py-1 pl-0 pr-1');

  const textSize = isInHero ? 'text-xl' : 'text-base';
  const contentGap = isInHero ? 'gap-3' : 'gap-2';
  // For schedule: remove all padding
  const contentPadding = isInHero
    ? 'px-2'
    : '';

  // For schedule (non-hero), align content towards center instead of centering
  // In a column layout (default): items-* controls horizontal alignment, justify-* controls vertical
  // Dropoff: align right (items-end), Pickup: align left (items-start)
  const containerAlignment = isInHero
    ? 'items-center justify-center'
    : (slotType === 'dropoff' ? 'items-end justify-center' : 'items-start justify-center');

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

  // Render content - avatar + name (layout depends on slotType)
  // Dropoff: text left, avatar right | Pickup: avatar left, text right
  // For schedule: don't use flex-1 so content only takes space it needs
  const contentFlex = isInHero ? 'flex-1' : '';

  const content = (
    <View style={tw`${contentFlex} ${slotType === 'dropoff' ? 'flex-row-reverse' : 'flex-row'} items-center ${contentPadding} ${contentGap}`}>
      {loading ? (
        <ActivityIndicator size="small" color={hasAssignment ? "#f5f1ed" : "#a89985"} />
      ) : (
        <>
          <Avatar avatarId={avatarId} size={56} borderColor={borderColor} />
          {displayName && (
            <Animated.Text
              style={[
                tw`${textSize} font-bold`,
                {
                  fontFamily: 'PlusJakartaSans_400Regular',
                  color: hasAssignment ? '#ffffff' : '#a89985',
                  opacity: textOpacity || 1,
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayName}
            </Animated.Text>
          )}
        </>
      )}
    </View>
  );

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
            `${containerClasses} ${containerAlignment} rounded-lg`,
            loading && 'opacity-50'
          ),
          {
            backgroundColor: 'transparent',
          }
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
