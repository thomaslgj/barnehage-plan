import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Platform, Animated, TouchableOpacity, LayoutAnimation, UIManager } from 'react-native';
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
import Avatar from './Avatar';
import {
  fetchEquipmentStatus,
  updateEquipmentStatus,
  calculateEquipmentStatus,
  shouldShowEquipmentModal,
} from '../lib/equipment';
import type { EquipmentItem, DayNote } from '../types/db';
import tw from '../lib/tw';

dayjs.locale('nb');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TodayCardProps {
  date: string; // YYYY-MM-DD format
  dropoffName?: string;
  pickupName?: string;
  dropoffUserId?: string | null;
  pickupUserId?: string | null;
  members?: Array<{ id: string; user_id: string | null; display_name: string | null; avatar_id?: string | null }>;
  onDropoffPress?: () => void;
  onPickupPress?: () => void;
  notes?: DayNote[];
  onNotePress?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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
  notes = [],
  onNotePress,
  collapsed = false,
  onToggleCollapse,
}: TodayCardProps) {
  const { user, householdId } = useHousehold();
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [autoModalVisible, setAutoModalVisible] = useState(false);
  const [lastModalShownDate, setLastModalShownDate] = useState<string | null>(null);
  const [prevEquipmentStatus, setPrevEquipmentStatus] = useState<'ready' | 'missing' | 'not_ready' | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [autoCollapseSet, setAutoCollapseSet] = useState(false);
  const confettiRef = useRef<any>(null);
  const prevDate = useRef<string>(date);
  const opacityAnim = useRef(new Animated.Value(collapsed ? 0 : 1)).current; // For opacity/transform (native)
  const heightAnim = useRef(new Animated.Value(collapsed ? 0 : 1)).current;  // For height (JS)

  // No animation - everything visible immediately
  const leftAvatarX = useRef(new Animated.Value(0)).current;
  const leftAvatarOpacity = useRef(new Animated.Value(1)).current;
  const leftTextOpacity = useRef(new Animated.Value(1)).current;
  const rightAvatarX = useRef(new Animated.Value(0)).current;
  const rightAvatarOpacity = useRef(new Animated.Value(1)).current;
  const rightTextOpacity = useRef(new Animated.Value(1)).current;
  const lineOpacity = useRef(new Animated.Value(1)).current;

  const dateObj = dayjs(date);
  const isToday = dateObj.isSame(dayjs(), 'day');
  const isTomorrow = dateObj.isSame(dayjs().add(1, 'day'), 'day');

  const title = isToday ? 'I DAG' : isTomorrow ? 'I MORGEN' : dateObj.format('dddd').toUpperCase();
  const dayName = dateObj.format('dddd D. MMM');
  const equipmentStatus = useMemo(() => calculateEquipmentStatus(equipmentItems), [equipmentItems]);

  // Helper to get avatar ID for a user
  const getAvatarId = (userId?: string | null): string | null => {
    if (!userId || !members.length) return null;
    const member = members.find(m => m.user_id === userId || m.id === userId);
    return member?.avatar_id || null;
  };

  // Helper to get border color based on person index
  const getBorderColor = (userId?: string | null): string => {
    if (!userId || !members.length) return '#4a3f38';
    const member = members.find(m => m.user_id === userId || m.id === userId);
    if (!member) return '#4a3f38';
    const personIndex = members.indexOf(member);
    return personIndex === 0 ? '#6b8e6f' : personIndex === 1 ? '#e8c96f' : '#8b7a6a';
  };

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

  // Auto-collapse logic: On initial load or date change, automatically set collapsed state
  useEffect(() => {
    if (!onToggleCollapse) return; // No toggle function provided, skip auto-collapse

    // Check if this is initial load (equipment just loaded) or date changed
    const isDateChange = prevDate.current !== date;

    if (isDateChange) {
      // Date changed - reset auto-collapse flag so it can run again
      setAutoCollapseSet(false);
      prevDate.current = date;
    }

    const shouldAutoCollapse = !autoCollapseSet && equipmentItems.length > 0;

    if (shouldAutoCollapse) {
      // Determine if we should show expanded or collapsed
      const hasNotes = notes.length > 0;
      const hasIssues = equipmentStatus === 'missing' || equipmentStatus === 'not_ready';

      // If there are notes or issues, show expanded (collapsed = false)
      // Otherwise, show collapsed (collapsed = true)
      const shouldBeCollapsed = !hasNotes && !hasIssues;

      // Only update if the current state doesn't match what it should be
      if (collapsed !== shouldBeCollapsed) {
        onToggleCollapse();
      }

      setAutoCollapseSet(true);
    }
  }, [equipmentItems.length, notes.length, date, collapsed, onToggleCollapse, autoCollapseSet, equipmentStatus]);

  // Animate when collapsed state changes
  useEffect(() => {
    Animated.parallel([
      // Opacity/transform animation (native - smooth)
      Animated.timing(opacityAnim, {
        toValue: collapsed ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Height animation (JS - needed for layout)
      Animated.spring(heightAnim, {
        toValue: collapsed ? 0 : 1,
        friction: 10,
        tension: 50,
        useNativeDriver: false,
      }),
    ]).start();
  }, [collapsed, opacityAnim, heightAnim]);

  const handleToggleCollapse = () => {
    if (!onToggleCollapse) return;

    // Trigger haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onToggleCollapse();
  };

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

      <View style={[
        tw`bg-slate-800 rounded-xl mb-6 overflow-hidden border border-slate-700/20`,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 24,
          elevation: 20,
        }
      ]}>
        {/* Main content section with padding */}
        <View style={tw`px-5 pt-5 pb-4`}>
          <View style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Collapsed view - single row with title and icons */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  opacity: opacityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                  transform: [{
                    scale: opacityAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.95],
                    })
                  }],
                }
              ]}
              pointerEvents={collapsed ? 'auto' : 'none'}
            >
              <View style={tw`flex-row items-center gap-3`}>
              <Text style={[tw.style(
                isToday ? 'text-xl font-black tracking-wide text-white' : 'text-lg font-bold text-slate-300'
              ), { fontFamily: 'PlusJakartaSans_400Regular' }]}>{isToday ? title.toUpperCase() : title}</Text>

              {/* Dropoff avatar */}
              <Avatar
                avatarId={getAvatarId(dropoffUserId)}
                size={36}
                borderColor={getBorderColor(dropoffUserId)}
              />

              {/* Pickup avatar */}
              <Avatar
                avatarId={getAvatarId(pickupUserId)}
                size={36}
                borderColor={getBorderColor(pickupUserId)}
              />

              {/* Note icon if has notes */}
              {notes.length > 0 && (
                <Ionicons name="document-text" size={18} color="#e8c96f" />
              )}

              {/* Equipment status icon */}
              {equipmentStatus === 'ready' && (
                <Ionicons name="checkmark-circle" size={22} color="#7fa884" />
              )}
              {equipmentStatus === 'missing' && (
                <Ionicons name="alert-circle" size={22} color="#d17166" />
              )}
              {equipmentStatus === 'not_ready' && (
                <Ionicons name="time" size={22} color="#e8c96f" />
              )}
              </View>
            </Animated.View>

            {/* Expanded view */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                opacity: opacityAnim,
                transform: [{
                  scale: opacityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  })
                }],
              }}
              pointerEvents={collapsed ? 'none' : 'auto'}
            >
            <View style={tw`mb-4 flex-row items-baseline gap-2`}>
                <Text style={[tw.style(
                  isToday ? 'text-xl font-black tracking-wide text-white' : 'text-lg font-bold text-slate-300'
                ), { fontFamily: 'PlusJakartaSans_400Regular' }]}>{isToday ? title.toUpperCase() : title}</Text>
                {(isToday || isTomorrow) && (
                  <Text style={[tw`text-base text-slate-400`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>· {dayName}</Text>
                )}
              </View>

              {/* Expanded view - full schedule slots */}
              <View style={{ position: 'relative', marginBottom: 0 }}>
              <View style={tw`flex-row gap-4`}>
                <Animated.View
                  style={[
                    tw`flex-1`,
                    {
                      opacity: leftAvatarOpacity,
                      transform: [{ translateX: leftAvatarX }],
                    }
                  ]}
                >
                  <ScheduleSlot
                    key={`${date}-dropoff`}
                    slotType="dropoff"
                    displayName={dropoffName}
                    userId={dropoffUserId}
                    members={members}
                    onPress={onDropoffPress || (() => {})}
                    loading={false}
                    isInHero={true}
                    textOpacity={leftTextOpacity}
                  />
                </Animated.View>
                <Animated.View
                  style={[
                    tw`flex-1`,
                    {
                      opacity: rightAvatarOpacity,
                      transform: [{ translateX: rightAvatarX }],
                    }
                  ]}
                >
                  <ScheduleSlot
                    key={`${date}-pickup`}
                    slotType="pickup"
                    displayName={pickupName}
                    userId={pickupUserId}
                    members={members}
                    onPress={onPickupPress || (() => {})}
                    loading={false}
                    isInHero={true}
                    textOpacity={rightTextOpacity}
                  />
                </Animated.View>
              </View>
              {/* Connecting line between avatars */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 96, // gap-4 (16px) + padding on both sides (~40px each)
                  height: 2,
                  backgroundColor: 'rgba(139, 122, 106, 0.4)', // Darker, more subtle - matches schedule
                  transform: [{ translateX: -48 }, { translateY: -1 }],
                  zIndex: -1,
                  opacity: lineOpacity,
                }}
              />
            </View>
            </Animated.View>

            {/* Spacer to maintain height during animation */}
            <Animated.View
              style={{
                height: heightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [37, 110],
                }),
              }}
            />
          </View>

          {/* Collapse icon - always clickable, positioned in top-right */}
          {onToggleCollapse && (
            <TouchableOpacity
              onPress={handleToggleCollapse}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                padding: 4,
                zIndex: 10,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={collapsed ? 'chevron-down' : 'chevron-up'}
                size={20}
                color="#a89985"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Notes Section - between avatars and equipment (only show when expanded) */}
        {!collapsed && notes.length > 0 && (
          <TouchableOpacity
            onPress={onNotePress}
            activeOpacity={0.7}
            disabled={!onNotePress}
            style={tw`px-5 py-3 bg-[#2d2520] border-t border-slate-700/20 mb-0.5`}
          >
            {notes.map((note, index) => (
              <View key={note.id} style={tw`flex-row gap-2 ${index < notes.length - 1 ? 'mb-2' : ''}`}>
                <Ionicons name="document-text" size={16} color="#a89985" style={tw`mt-0.5`} />
                <Text style={[tw`text-sm text-slate-300 flex-1`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
                  {note.content}
                </Text>
              </View>
            ))}
          </TouchableOpacity>
        )}

        {/* Equipment Status Section - integrated footer (only show when expanded) */}
        {!collapsed && (
          equipmentItems.length > 0 ? (
            <EquipmentStatusBadge
              status={equipmentStatus}
              items={equipmentItems}
              onPress={() => setBottomSheetVisible(true)}
              isFooter={true}
            />
          ) : (
            <View style={tw`w-full flex-row items-center justify-center gap-3 px-5 py-4 bg-[#2d2520]`}>
              <Text style={[tw`text-base text-slate-400`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
                Laster utstyr...
              </Text>
            </View>
          )
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
