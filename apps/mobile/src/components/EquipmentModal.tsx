import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import type { EquipmentItem } from '../types/db';
import tw from '../lib/tw';

interface EquipmentModalProps {
  visible: boolean;
  date: string;
  items: EquipmentItem[];
  loading: boolean;
  onToggle: (itemKey: string) => void;
  onClose: () => void;
}

export default function EquipmentModal({
  visible,
  date,
  items,
  loading,
  onToggle,
  onClose,
}: EquipmentModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Reset to starting position
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);

      // Then fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out and scale down
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          tw`flex-1 bg-black/70 justify-center items-center p-5`,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            tw`bg-slate-800 rounded-2xl w-full max-w-[400px] max-h-[80%]`,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={tw`p-6 border-b border-slate-700`}>
            <Text style={tw`text-[22px] font-bold text-white mb-2`}>Utstyrskontroll</Text>
            <Text style={tw`text-[15px] text-slate-300 leading-[22px]`}>
              Ble noe sendt hjem i dag? Merk det som mangler for {date}:
            </Text>
          </View>

          <ScrollView style={tw`p-4 max-h-[300px]`}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={tw.style(
                  'flex-row items-center justify-between p-4 rounded-lg border-2 mb-3',
                  item.status === 'missing'
                    ? 'border-warning bg-warning/20'
                    : 'border-slate-600 bg-slate-700/30'
                )}
                onPress={() => onToggle(item.key)}
                disabled={loading}
              >
                <Text
                  style={tw.style(
                    'text-base font-medium',
                    item.status === 'missing' ? 'text-warning font-semibold' : 'text-slate-200'
                  )}
                >
                  {item.label}
                </Text>
                {item.status === 'missing' && (
                  <View style={tw`w-6 h-6 rounded-full bg-warning justify-center items-center`}>
                    <Text style={tw`text-white text-base font-bold`}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading && (
            <View style={tw`absolute inset-0 bg-slate-900/90 justify-center items-center rounded-2xl`}>
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          )}

          <View style={tw`p-4 border-t border-slate-700`}>
            <TouchableOpacity
              style={tw`bg-primary p-4 rounded-lg items-center`}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={tw`text-white text-base font-semibold`}>Ferdig</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
