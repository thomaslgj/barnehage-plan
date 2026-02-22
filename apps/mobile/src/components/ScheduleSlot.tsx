import React, { memo } from 'react';
import { Pressable, Text, ActivityIndicator, View, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  // Determine which person this is and get avatar - single lookup instead of two
  const member = userId && members.length > 0
    ? members.find(m => m.user_id === userId || m.id === userId)
    : null;

  const personIndex = member ? members.indexOf(member) : null;
  const avatarId = member?.avatar_id || null;

  const hasAssignment = Boolean(displayName && personIndex !== null && personIndex >= 0);

  const borderColor = !hasAssignment ? '#4a3f38'
    : personIndex === 0 ? '#6b8e6f'
    : personIndex === 1 ? '#e8c96f'
    : '#8b7a6a';

  const handlePress = () => {
    // Immediate haptic feedback for instant response feeling
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const contentStyle = {
    flexDirection: slotType === 'dropoff' ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: isInHero ? 10 : 6,
    paddingHorizontal: isInHero ? 8 : 0,
    flex: isInHero ? 1 : undefined,
  };

  const containerStyle = {
    height: isInHero ? 70 : 56,
    paddingVertical: isInHero ? 8 : 3,
    paddingLeft: isInHero ? 12 : (slotType === 'pickup' ? 0 : 3),
    paddingRight: isInHero ? 12 : (slotType === 'dropoff' ? 0 : 3),
    alignItems: isInHero ? 'center' : (slotType === 'dropoff' ? 'flex-end' : 'flex-start'),
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
    opacity: loading ? 0.5 : 1,
  };

  const textStyle = {
    fontSize: isInHero ? 18 : 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_400Regular',
    color: hasAssignment ? '#f5f1ed' : '#a89985',
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={containerStyle}
      testID={`schedule-slot-${slotType}`}
    >
      {({ pressed }) => (
        <View style={contentStyle}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={hasAssignment ? "#f5f1ed" : "#a89985"}
              testID="loading-indicator"
            />
          ) : (
            <>
              <View style={{ transform: [{ scale: pressed ? 0.9 : 1 }] }}>
                <Avatar avatarId={avatarId} size={isInHero ? 56 : 48} borderColor={borderColor} />
              </View>
              <Text style={textStyle} numberOfLines={1} ellipsizeMode="tail">
                {displayName || 'Hvem?'}
              </Text>
            </>
          )}
        </View>
      )}
    </Pressable>
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
