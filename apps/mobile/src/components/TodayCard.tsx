import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
}

const MODAL_SHOWN_KEY = 'equipment_modal_last_shown';

export default function TodayCard({
  date,
  dropoffName,
  pickupName,
  dropoffUserId,
  pickupUserId,
  members = []
}: TodayCardProps) {
  const { user, householdId } = useHousehold();
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [autoModalVisible, setAutoModalVisible] = useState(false);
  const [lastModalShownDate, setLastModalShownDate] = useState<string | null>(null);

  const dateObj = dayjs(date);
  const isToday = dateObj.isSame(dayjs(), 'day');
  const isTomorrow = dateObj.isSame(dayjs().add(1, 'day'), 'day');

  const title = isToday ? 'I DAG' : isTomorrow ? 'I MORGEN' : dateObj.format('dddd D. MMM').toUpperCase();
  const dayName = dateObj.format('dddd');
  const equipmentStatus = calculateEquipmentStatus(equipmentItems);

  // Load equipment status and check if auto-modal should show
  useEffect(() => {
    if (!householdId) return;

    const loadEquipment = async () => {
      const items = await fetchEquipmentStatus(householdId);
      setEquipmentItems(items);

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
      <View style={tw`bg-slate-800/50 rounded-xl p-5 mb-6 border ${
        isToday ? 'border-slate-600/80' : 'border-slate-700/50'
      }`}>
        <View style={tw`mb-4`}>
          <Text style={[tw.style(
            isToday ? 'text-2xl font-black tracking-wide text-white' : 'text-xl font-bold text-slate-300'
          ), { fontFamily: 'Manrope_400Regular' }]}>{isToday ? title.toUpperCase() : title}</Text>
          <Text style={[tw`text-base text-slate-400`, { fontFamily: 'Manrope_400Regular' }]}>{dayName}</Text>
        </View>

        <View style={tw`flex-row gap-2 mb-4`}>
          {(dropoffName || pickupName) ? (
            <>
              {dropoffName && (
                <View style={tw`flex-1`}>
                  <ScheduleSlot
                    slotType="dropoff"
                    displayName={dropoffName}
                    userId={dropoffUserId}
                    members={members}
                    onPress={() => {}}
                    loading={false}
                    isInHero={true}
                  />
                </View>
              )}
              {pickupName && (
                <View style={tw`flex-1`}>
                  <ScheduleSlot
                    slotType="pickup"
                    displayName={pickupName}
                    userId={pickupUserId}
                    members={members}
                    onPress={() => {}}
                    loading={false}
                    isInHero={true}
                  />
                </View>
              )}
            </>
          ) : (
            <Text style={[tw`text-sm py-2 text-slate-400`, { fontFamily: 'Manrope_400Regular' }]}>
              Ingen oppgaver {isToday ? 'i dag' : 'i morgen'}
            </Text>
          )}
        </View>

        {/* Equipment Status Badge */}
        <EquipmentStatusBadge
          status={equipmentStatus}
          onPress={() => setBottomSheetVisible(true)}
        />
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
