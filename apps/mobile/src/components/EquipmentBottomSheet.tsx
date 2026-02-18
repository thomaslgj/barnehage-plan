import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { EquipmentItem } from '../types/db';
import tw from '../lib/tw';

interface EquipmentBottomSheetProps {
  visible: boolean;
  items: EquipmentItem[];
  loading: boolean;
  onToggle: (itemKey: string) => void;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Animated Equipment Item Component
function EquipmentItemRow({ item, onToggle, loading }: { item: EquipmentItem; onToggle: (key: string) => void; loading: boolean }) {
  const [prevStatus, setPrevStatus] = useState(item.status);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (prevStatus !== item.status) {
      // Animate status change
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
      setPrevStatus(item.status);
    }
  }, [item.status]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle(item.key);
  };

  // Determine colors based on status and criticality
  const getColors = () => {
    if (item.status === 'ok') {
      return {
        bg: 'rgba(127, 168, 132, 0.2)', // success/20
        text: '#7fa884', // success
      };
    } else if (item.is_critical) {
      return {
        bg: 'rgba(209, 113, 102, 0.2)', // error/20
        text: '#d17166', // error
      };
    } else {
      return {
        bg: 'rgba(232, 201, 111, 0.2)', // warning/20
        text: '#e8c96f', // warning
      };
    }
  };

  const colors = getColors();

  return (
    <TouchableOpacity
      style={tw`flex-row items-center justify-between py-4 px-5 border-b border-slate-700/50`}
      onPress={handlePress}
      disabled={loading}
    >
      <Text style={[tw`text-base text-slate-200 flex-1`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>{item.label}</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View
          style={[
            tw`px-3 py-1.5 rounded min-w-[80px] items-center`,
            {
              backgroundColor: colors.bg,
            },
          ]}
        >
          <Text
            style={[
              tw`text-sm font-semibold`,
              { fontFamily: 'PlusJakartaSans_400Regular', color: colors.text },
            ]}
          >
            {item.status === 'ok' ? 'OK' : 'Mangler'}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function EquipmentBottomSheet({
  visible,
  items,
  loading,
  onToggle,
  onClose,
}: EquipmentBottomSheetProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset to starting position
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);

      // Then slide up and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1`}>
        {/* Animated Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            tw`bg-black/50`,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={tw`flex-1`}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Animated Bottom Sheet */}
        <Animated.View
          style={[
            tw`absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl max-h-[70%]`,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={tw`p-5 border-b border-slate-700`}>
            <Text style={[tw`text-xl font-bold text-white mb-1`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Utstyrsstatus</Text>
            <Text style={[tw`text-sm text-slate-300`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Trykk for å endre status</Text>
          </View>

          <ScrollView style={tw`max-h-[400px]`}>
            {items.map((item) => (
              <EquipmentItemRow
                key={item.key}
                item={item}
                onToggle={onToggle}
                loading={loading}
              />
            ))}
          </ScrollView>

          {loading && (
            <View style={tw`absolute inset-0 bg-slate-900/80 justify-center items-center`}>
              <ActivityIndicator size="large" color="#7fa884" />
            </View>
          )}

          <TouchableOpacity style={tw`p-5 pb-8 items-center border-t border-slate-700`} onPress={onClose}>
            <Text style={[tw`text-base text-slate-300 font-semibold`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Lukk</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
