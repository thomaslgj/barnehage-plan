import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import 'dayjs/locale/nb';
import { useHousehold } from '../contexts/HouseholdProvider';
import EquipmentStatusBadge from './EquipmentStatusBadge';
import EquipmentBottomSheet from './EquipmentBottomSheet';
import EquipmentModal from './EquipmentModal';
import ScheduleSlot from './ScheduleSlot';
import {
  fetchEquipmentStatus,
  updateEquipmentStatus,
  calculateEquipmentStatus,
  shouldShowEquipmentModal,
} from '../lib/equipment';
import type { EquipmentItem } from '../types/db';
import tw from '../lib/tw';

dayjs.locale('nb');

interface TodayCardProps {
  date: string; // YYYY-MM-DD format
  dropoffName?: string;
  pickupName?: string;
  dropoffUserId?: string | null;
  pickupUserId?: string | null;
  members?: Array<{ id: string; user_id: string | null; display_name: string | null }>;
  onDropoffPress?: () => void;
  onPickupPress?: () => void;
}

const MODAL_SHOWN_KEY = 'equipment_modal_last_shown';

export default function TodayCard({
  date,
  dropoffName,
  pickupName,
  dropoffUserId,
  pickupUserId,
  members = [],
  onDropoffPress,
  onPickupPress,
}: TodayCardProps) {
  const { user, householdId } = useHousehold();
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [autoModalVisible, setAutoModalVisible] = useState(false);
  const [lastModalShownDate, setLastModalShownDate] = useState<string | null>(null);
  const [prevEquipmentStatus, setPrevEquipmentStatus] = useState<'ready' | 'missing' | 'not_ready' | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const confettiRef = useRef<any>(null);

  const dateObj = dayjs(date);
  const isToday = dateObj.isSame(dayjs(), 'day');
  const isTomorrow = dateObj.isSame(dayjs().add(1, 'day'), 'day');

  const title = isToday ? 'I DAG' : isTomorrow ? 'I MORGEN' : dateObj.format('dddd D. MMM').toUpperCase();
  const dayName = dateObj.format('dddd');
  const equipmentStatus = useMemo(() => calculateEquipmentStatus(equipmentItems), [equipmentItems]);

  // Trigger confetti when status changes to 'ready'
  useEffect(() => {
    // Only check status changes when we have actual equipment data loaded
    if (equipmentItems.length === 0) {
      return;
    }

    // Skip confetti on initial load
    if (!isInitialLoad && prevEquipmentStatus !== null && prevEquipmentStatus !== 'ready' && equipmentStatus === 'ready') {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      confettiRef.current?.start();
    }

    // Update previous status after initial load
    if (!isInitialLoad) {
      setPrevEquipmentStatus(equipmentStatus);
    }
  }, [equipmentStatus, isInitialLoad, equipmentItems.length]);

  // Load equipment status and check if auto-modal should show
  useEffect(() => {
    if (!householdId) return;

    const loadEquipment = async () => {
      const items = await fetchEquipmentStatus(householdId);
      setEquipmentItems(items);

      // Set initial status to prevent false positive confetti on first load
      if (isInitialLoad) {
        const initialStatus = calculateEquipmentStatus(items);
        setPrevEquipmentStatus(initialStatus);
        setIsInitialLoad(false);
      }

      // Check if auto-modal should show
      if (Platform.OS !== 'web') {
        // Only on native - use AsyncStorage
        const lastShown = await AsyncStorage.getItem(MODAL_SHOWN_KEY);
        setLastModalShownDate(lastShown);

        if (shouldShowEquipmentModal(date, lastShown)) {
          setAutoModalVisible(true);
          await AsyncStorage.setItem(MODAL_SHOWN_KEY, dayjs().format('YYYY-MM-DD'));
        }
      } else {
        // On web - use localStorage via AsyncStorage (polyfilled)
        const lastShown = await AsyncStorage.getItem(MODAL_SHOWN_KEY);
        setLastModalShownDate(lastShown);

        if (shouldShowEquipmentModal(date, lastShown)) {
          setAutoModalVisible(true);
          await AsyncStorage.setItem(MODAL_SHOWN_KEY, dayjs().format('YYYY-MM-DD'));
        }
      }
    };

    loadEquipment();
  }, [householdId, date]);

  const handleToggleItem = async (itemKey: string) => {
    if (!householdId || !user) return;

    setEquipmentLoading(true);
    try {
      // Find current item
      const item = equipmentItems.find((i) => i.key === itemKey);
      if (!item) return;

      // Toggle status
      const newStatus = item.status === 'ok' ? 'missing' : 'ok';

      // Update in database
      await updateEquipmentStatus(householdId, user.id, itemKey, newStatus);

      // Update local state
      setEquipmentItems((prev) =>
        prev.map((i) => (i.key === itemKey ? { ...i, status: newStatus } : i))
      );
    } catch (error) {
      console.error('Error toggling equipment item:', error);
    } finally {
      setEquipmentLoading(false);
    }
  };

  return (
    <>
      {/* Confetti Effect - positioned absolutely off-screen until triggered */}
      {Platform.OS !== 'web' && (
        <View style={{ position: 'absolute', top: -1000, left: -1000, zIndex: 9999 }}>
          <ConfettiCannon
            ref={confettiRef}
            count={150}
            origin={{ x: 200, y: 200 }}
            autoStart={false}
            fadeOut={true}
          />
        </View>
      )}

      <View style={tw`bg-slate-800/50 rounded-xl p-5 mb-6 border ${
        isToday ? 'border-slate-600/80' : 'border-slate-700/50'
      }`}>
        <View style={tw`mb-4`}>
          <Text style={[tw.style(
            isToday ? 'text-2xl font-black tracking-wide text-white' : 'text-xl font-bold text-slate-300'
          ), { fontFamily: 'Manrope_400Regular' }]}>{isToday ? title.toUpperCase() : title}</Text>
          <Text style={[tw`text-base text-slate-400`, { fontFamily: 'Manrope_400Regular' }]}>{dayName}</Text>
        </View>

        <View style={{ position: 'relative', marginBottom: 16 }}>
          <View style={tw`flex-row gap-4`}>
            <View style={tw`flex-1`}>
              <ScheduleSlot
                key={`${date}-dropoff-${dropoffUserId || 'empty'}`}
                slotType="dropoff"
                displayName={dropoffName}
                userId={dropoffUserId}
                members={members}
                onPress={onDropoffPress || (() => {})}
                loading={false}
                isInHero={true}
              />
            </View>
            <View style={tw`flex-1`}>
              <ScheduleSlot
                key={`${date}-pickup-${pickupUserId || 'empty'}`}
                slotType="pickup"
                displayName={pickupName}
                userId={pickupUserId}
                members={members}
                onPress={onPickupPress || (() => {})}
                loading={false}
                isInHero={true}
              />
            </View>
          </View>
          {/* Connecting line between avatars */}
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 96, // gap-4 (16px) + padding on both sides (~40px each)
              height: 2,
              backgroundColor: '#a89985',
              transform: [{ translateX: -48 }, { translateY: -1 }],
              zIndex: -1,
            }}
          />
        </View>

        {/* Equipment Status Badge - only show when data is loaded */}
        {equipmentItems.length > 0 ? (
          <EquipmentStatusBadge
            status={equipmentStatus}
            onPress={() => setBottomSheetVisible(true)}
          />
        ) : (
          <View style={tw`w-full flex-row items-center justify-center gap-3 px-5 py-3 rounded-full border border-slate-700 bg-slate-800/30`}>
            <Text style={[tw`text-base text-slate-400`, { fontFamily: 'Manrope_400Regular' }]}>
              Laster utstyr...
            </Text>
          </View>
        )}
      </View>

      {/* Equipment Bottom Sheet */}
      <EquipmentBottomSheet
        visible={bottomSheetVisible}
        items={equipmentItems}
        loading={equipmentLoading}
        onToggle={handleToggleItem}
        onClose={() => setBottomSheetVisible(false)}
      />

      {/* Auto Equipment Modal (4 PM for tomorrow) */}
      <EquipmentModal
        visible={autoModalVisible}
        date={dateObj.format('dddd D. MMMM')}
        items={equipmentItems}
        loading={equipmentLoading}
        onToggle={handleToggleItem}
        onClose={() => setAutoModalVisible(false)}
      />
    </>
  );
}
