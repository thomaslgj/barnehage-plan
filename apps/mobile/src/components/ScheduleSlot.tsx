import React, { useMemo, memo } from 'react';
import { Pressable, Text, ActivityIndicator, View, Platform } from 'react-native';
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
  // Determine which person this is and get avatar - single lookup instead of two
  const member = userId && members.length > 0
    ? members.find(m => m.user_id === userId || m.id === userId)
    : null;

  const personIndex = member ? members.indexOf(member) : null;
  const avatarId = member?.avatar_id || null;

  const hasAssignment = Boolean(displayName && personIndex !== null && personIndex >= 0);

  // Get border color based on assignment - simple lookup, no memoization needed
  const borderColor = !hasAssignment ? '#4a3f38'
    : personIndex === 0 ? '#6b8e6f'
    : personIndex === 1 ? '#e8c96f'
    : '#8b7a6a';

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

  const handlePress = () => {
    // Immediate haptic feedback for instant response feeling
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  // Render content - avatar + name (layout depends on slotType)
  // Dropoff: text left, avatar right | Pickup: avatar left, text right
  // For schedule: don't use flex-1 so content only takes space it needs
  const contentFlex = isInHero ? 'flex-1' : '';

  const renderContent = (pressed: boolean) => (
    <View style={tw`${contentFlex} ${slotType === 'dropoff' ? 'flex-row-reverse' : 'flex-row'} items-center ${contentPadding} ${contentGap}`}>
      {loading ? (
        <ActivityIndicator size="small" color={hasAssignment ? "#f5f1ed" : "#a89985"} />
      ) : (
        <>
          <View style={{ transform: [{ scale: pressed ? 0.9 : 1 }] }}>
            <Avatar avatarId={avatarId} size={56} borderColor={borderColor} />
          </View>
          {displayName && (
            <Text
              style={[
                tw`${textSize} font-bold`,
                {
                  fontFamily: 'PlusJakartaSans_400Regular',
                  color: hasAssignment ? '#f5f1ed' : '#a89985',
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayName}
            </Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <View>
      <Pressable
        onPress={handlePress}
        disabled={loading}
        style={tw.style(
          `${containerClasses} ${containerAlignment} rounded-lg`,
          loading && 'opacity-50',
          { backgroundColor: 'transparent' }
        )}
      >
        {({ pressed }) => renderContent(pressed)}
      </Pressable>
    </View>
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
