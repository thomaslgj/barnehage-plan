import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';
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
  onEquipmentModalDismiss?: () => void;
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
  onEquipmentModalDismiss,
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
  // Local visual state gives immediate response on click - no waiting for parent re-render
  const [visualCollapsed, setVisualCollapsed] = useState(collapsed);
  const confettiRef = useRef<any>(null);
  const prevDate = useRef<string>(date);
  const opacityAnim = useRef(new Animated.Value(collapsed ? 0 : 1)).current; // opacity/transform (native driver)
  const heightAnim = useRef(new Animated.Value(collapsed ? 0 : 1)).current;  // height (JS driver - unavoidable)

  const dateObj = dayjs(date);
  const isToday = dateObj.isSame(dayjs(), 'day');
  const isTomorrow = dateObj.isSame(dayjs().add(1, 'day'), 'day');

  const title = isToday ? 'I DAG' : isTomorrow ? 'I MORGEN' : dateObj.format('dddd').toUpperCase();
  const dayName = dateObj.format('dddd D. MMM');
  const equipmentStatus = useMemo(() => calculateEquipmentStatus(equipmentItems), [equipmentItems]);

  const getAvatarId = useCallback((userId?: string | null): string | null => {
    if (!userId || !members.length) return null;
    const member = members.find(m => m.user_id === userId || m.id === userId);
    return member?.avatar_id || null;
  }, [members]);

  const getBorderColor = useCallback((userId?: string | null): string => {
    if (!userId || !members.length) return '#4a3f38';
    const member = members.find(m => m.user_id === userId || m.id === userId);
    if (!member) return '#4a3f38';
    const personIndex = members.indexOf(member);
    return personIndex === 0 ? '#6b8e6f' : personIndex === 1 ? '#e8c96f' : '#8b7a6a';
  }, [members]);

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

  // Sync external prop to local visual state (e.g. auto-collapse triggered by parent)
  useEffect(() => {
    if (visualCollapsed !== collapsed) {
      setVisualCollapsed(collapsed);
    }
  }, [collapsed]);

  // Animate when visual state changes - starts immediately since visualCollapsed is local state
  useEffect(() => {
    Animated.parallel([
      // Opacity/transform crossfade (native driver - runs on UI thread)
      Animated.timing(opacityAnim, {
        toValue: visualCollapsed ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Height animation (JS driver - unavoidable for layout, but starts immediately now)
      Animated.spring(heightAnim, {
        toValue: visualCollapsed ? 0 : 1,
        friction: 10,
        tension: 50,
        useNativeDriver: false,
      }),
    ]).start();
  }, [visualCollapsed, opacityAnim, heightAnim]);

  const handleToggleCollapse = () => {
    if (!onToggleCollapse) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Update local visual state immediately - Animated.spring starts on THIS setState.
    setVisualCollapsed(prev => !prev);
    // Mark parent update as low-priority so React commits the animation first.
    // Without this, React 19 batches both updates together and waits for all of
    // MainScreen's expensive re-render before starting the animation.
    startTransition(() => {
      onToggleCollapse();
    });
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
          <TouchableOpacity
            testID="today-card-header"
            onPress={handleToggleCollapse}
            activeOpacity={0.95}
            disabled={!onToggleCollapse}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
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
              pointerEvents={visualCollapsed ? 'auto' : 'none'}
            >
              <View style={tw`flex-row items-center gap-3`}>
              <Text style={[tw.style(
                isToday ? 'text-xl font-black tracking-wide text-white' : 'text-xl font-bold text-slate-300'
              ), { fontFamily: 'PlusJakartaSans_400Regular' }]}>{isToday ? title.toUpperCase() : title}</Text>

              {/* Dropoff avatar */}
              <Avatar
                avatarId={getAvatarId(dropoffUserId)}
                size={30}
                borderColor={getBorderColor(dropoffUserId)}
              />

              {/* Pickup avatar */}
              <Avatar
                avatarId={getAvatarId(pickupUserId)}
                size={30}
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
              {equipmentStatus === 'not_ready' && (
                <Ionicons name="alert-circle" size={22} color="#d17166" />
              )}
              {equipmentStatus === 'missing' && (
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
              pointerEvents={visualCollapsed ? 'none' : 'auto'}
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
                <View style={tw`flex-1`}>
                  <ScheduleSlot
                    key={`${date}-dropoff`}
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
                    key={`${date}-pickup`}
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
                  width: 96,
                  height: 2,
                  backgroundColor: 'rgba(139, 122, 106, 0.4)',
                  transform: [{ translateX: -48 }, { translateY: -1 }],
                  zIndex: -1,
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
          </TouchableOpacity>

          {/* Collapse icon with visual feedback */}
          {onToggleCollapse && (
            <TouchableOpacity
              testID="today-card-toggle"
              onPress={handleToggleCollapse}
              activeOpacity={0.5}
              style={{
                position: 'absolute',
                top: 19,
                right: 20,
                padding: 8,
                borderRadius: 20,
                backgroundColor: 'rgba(168, 153, 133, 0.15)',
                zIndex: 10,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={visualCollapsed ? 'chevron-down' : 'chevron-up'}
                size={20}
                color="#a89985"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Notes Section - LayoutAnimation + overflow:hidden on card handles show/hide animation */}
        {!visualCollapsed && notes.length > 0 && (
          <TouchableOpacity
            testID="today-card-notes-section"
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

        {/* Equipment Status Section - LayoutAnimation + overflow:hidden on card handles show/hide */}
        {!visualCollapsed && (
          <View testID="today-card-equipment-section">
            {equipmentItems.length > 0 ? (
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
            )}
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
        onClose={() => {
          setAutoModalVisible(false);
          onEquipmentModalDismiss?.();
        }}
      />
    </>
  );
}
