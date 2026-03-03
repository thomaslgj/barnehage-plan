import React from 'react';
import { Animated } from 'react-native';
import TodayCard from './TodayCard';
import TodayCardSkeleton from './TodayCardSkeleton';
import { useAssignment } from '../stores/assignments-store';
import type { DayNote } from '../types/db';

interface TodayCardSectionProps {
  loading: boolean;
  weekChanging: boolean;
  todayDate: string | undefined;
  members: Array<{ id: string; user_id: string | null; display_name: string | null; avatar_id?: string | null }>;
  getDisplayName: (memberId: string | null) => string | undefined;
  todayNotes: DayNote[];
  todayCardCollapsed: boolean;
  todayCardFade: Animated.Value;
  onDropoffPress: () => void;
  onPickupPress: () => void;
  onNotePress: () => void;
  onToggleCollapse: () => void;
  onEquipmentModalDismiss: () => void;
}

const TodayCardSection = React.memo(function TodayCardSection({
  loading,
  weekChanging,
  todayDate,
  members,
  getDisplayName,
  todayNotes,
  todayCardCollapsed,
  todayCardFade,
  onDropoffPress,
  onPickupPress,
  onNotePress,
  onToggleCollapse,
  onEquipmentModalDismiss,
}: TodayCardSectionProps) {
  // Subscribe to ONLY today's two keys — won't re-render when other days change
  const dropoffUserId = useAssignment(todayDate ? `${todayDate}-dropoff` : '');
  const pickupUserId = useAssignment(todayDate ? `${todayDate}-pickup` : '');
  const dropoffName = getDisplayName(dropoffUserId ?? null);
  const pickupName = getDisplayName(pickupUserId ?? null);

  return (
    <Animated.View style={{ opacity: todayCardFade }}>
      {(loading || weekChanging) ? (
        <TodayCardSkeleton />
      ) : todayDate ? (
        <TodayCard
          date={todayDate}
          dropoffName={dropoffName}
          pickupName={pickupName}
          dropoffUserId={dropoffUserId}
          pickupUserId={pickupUserId}
          members={members}
          onDropoffPress={onDropoffPress}
          onPickupPress={onPickupPress}
          notes={todayNotes}
          onNotePress={onNotePress}
          collapsed={todayCardCollapsed}
          onToggleCollapse={onToggleCollapse}
          onEquipmentModalDismiss={onEquipmentModalDismiss}
        />
      ) : null}
    </Animated.View>
  );
});

export default TodayCardSection;
