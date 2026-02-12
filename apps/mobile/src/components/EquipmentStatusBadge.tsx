import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, View, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import tw from '../lib/tw';

interface EquipmentStatusBadgeProps {
  status: 'ready' | 'missing' | 'not_ready';
  onPress: () => void;
}

export default function EquipmentStatusBadge({ status, onPress }: EquipmentStatusBadgeProps) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Bounce effect when status changes to 'ready'
  useEffect(() => {
    if (status === 'ready') {
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Initial bounce
      bounceAnim.setValue(0.8);
    }
  }, [status]);

  // Pulsating effect when status is 'not_ready'
  useEffect(() => {
    if (status === 'not_ready') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
        return {
          label: 'Alt klart for barnehagen',
          dotStyle: 'bg-success', // green-500
          borderStyle: 'border-success/30',
          textStyle: 'text-slate-200',
          showCheckmark: true,
        };
      case 'missing':
        return {
          label: 'Bør ordnes',
          dotStyle: 'bg-warning', // yellow-500
          borderStyle: 'border-warning/30',
          textStyle: 'text-slate-200',
          showCheckmark: false,
        };
      case 'not_ready':
        return {
          label: 'Må ordnes før i morgen',
          dotStyle: 'bg-error', // red-500
          borderStyle: 'border-error/30',
          textStyle: 'text-slate-200',
          showCheckmark: false,
        };
    }
  };

  const config = getStatusConfig();

  const combinedScale = status === 'ready' ? bounceAnim : status === 'not_ready' ? pulseAnim : 1;

  return (
    <Animated.View style={{ transform: [{ scale: Animated.multiply(scaleAnim, combinedScale) }] }}>
      <TouchableOpacity
        style={tw.style(
          'flex-row items-center justify-between gap-2 px-4 py-2.5 rounded-lg border w-full',
          config.borderStyle
        )}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <View style={tw`flex-row items-center gap-2 flex-1`}>
          {config.showCheckmark ? (
            <Text style={[tw`text-success text-xl`, { fontFamily: 'Manrope_400Regular' }]}>✓</Text>
          ) : (
            <View style={tw.style('w-2.5 h-2.5 rounded-full', config.dotStyle)} />
          )}
          <Text style={[tw.style('text-sm font-medium flex-1', config.textStyle), { fontFamily: 'Manrope_400Regular' }]}>{config.label}</Text>
        </View>
        <Text style={[tw`text-text-light text-xl`, { fontFamily: 'Manrope_400Regular' }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
