import React, { useEffect, useRef } from 'react';
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
} from 'react-native';
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
            <Text style={[tw`text-xl font-bold text-white mb-1`, { fontFamily: 'Manrope_400Regular' }]}>Utstyrsstatus</Text>
            <Text style={[tw`text-sm text-slate-300`, { fontFamily: 'Manrope_400Regular' }]}>Trykk for å endre status</Text>
          </View>

          <ScrollView style={tw`max-h-[400px]`}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={tw`flex-row items-center justify-between py-4 px-5 border-b border-slate-700/50`}
                onPress={() => onToggle(item.key)}
                disabled={loading}
              >
                <Text style={[tw`text-base text-slate-200 flex-1`, { fontFamily: 'Manrope_400Regular' }]}>{item.label}</Text>
                <View
                  style={tw.style(
                    'px-3 py-1.5 rounded min-w-[80px] items-center',
                    item.status === 'ok' ? 'bg-success/20' : 'bg-warning/20'
                  )}
                >
                  <Text
                    style={[tw.style(
                      'text-sm font-semibold',
                      item.status === 'ok' ? 'text-success' : 'text-warning'
                    ), { fontFamily: 'Manrope_400Regular' }]}
                  >
                    {item.status === 'ok' ? 'OK' : 'Mangler'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading && (
            <View style={tw`absolute inset-0 bg-slate-900/80 justify-center items-center`}>
              <ActivityIndicator size="large" color="#7fa884" />
            </View>
          )}

          <TouchableOpacity style={tw`p-5 items-center border-t border-slate-700`} onPress={onClose}>
            <Text style={[tw`text-base text-slate-300 font-semibold`, { fontFamily: 'Manrope_400Regular' }]}>Lukk</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
