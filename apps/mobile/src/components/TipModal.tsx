import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import Avatar from './Avatar';
import tw from '../lib/tw';
import * as Haptics from 'expo-haptics';

interface TipModalProps {
  visible: boolean;
  title: string;
  message: string;
  targetPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
  onDismiss: () => void;
  targetElement?: {
    type: 'avatar' | 'noteIcon';
    avatarId?: string | null;
    size?: number;
    borderColor?: string;
    hasNotes?: boolean;
  };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TipModal({
  visible,
  title,
  message,
  targetPosition,
  arrowDirection = 'up',
  onDismiss,
  targetElement,
}: TipModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  // Estimate tooltip height
  const estimatedTooltipHeight = 140;

  // Calculate tooltip position based on target - always position above
  const getTooltipStyle = () => {
    if (!targetPosition) {
      return {
        top: '30%' as any,
        left: 20,
        right: 20,
      };
    }

    const { x, y, width } = targetPosition;
    const centerX = x + width / 2;
    const tooltipWidth = 260;
    const tooltipLeft = Math.max(20, Math.min(centerX - tooltipWidth / 2, SCREEN_WIDTH - tooltipWidth - 20));

    // Position above: tooltip bottom edge should be 12px above target top
    return {
      top: y - estimatedTooltipHeight - 12,
      left: tooltipLeft,
      width: tooltipWidth,
    };
  };

  const tooltipStyle = getTooltipStyle();

  // Arrow always points down (tooltip is always above target)
  const getArrowStyle = () => {
    if (!targetPosition) return {};

    const { x, width } = targetPosition;
    const centerX = x + width / 2;
    const tooltipLeft = (tooltipStyle.left as number) || 0;

    return {
      position: 'absolute' as const,
      bottom: -8,
      left: centerX - tooltipLeft - 8,
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#7fa884',
    };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      {/* Dark backdrop with pointer events */}
      <TouchableOpacity
        style={[
          tw`absolute inset-0`,
        ]}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        <Animated.View
          style={[
            tw`absolute inset-0`,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              opacity: fadeAnim,
            },
          ]}
        />
      </TouchableOpacity>

      {/* Spotlight with duplicate target element */}
      {targetPosition && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: targetPosition.y - 12,
              left: targetPosition.x - 12,
              width: targetPosition.width + 24,
              height: targetPosition.height + 24,
              borderRadius: (targetPosition.height + 24) / 2,
              borderWidth: 3,
              borderColor: '#7fa884',
              shadowColor: '#7fa884',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 20,
              elevation: 100,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2d2520', // Match app background
            },
            { opacity: fadeAnim },
          ]}
        >
          {/* Render duplicate of target element */}
          {targetElement?.type === 'avatar' && (
            <Avatar
              avatarId={targetElement.avatarId}
              size={targetElement.size || 48}
              borderColor={targetElement.borderColor || '#6b8e6f'}
            />
          )}
          {targetElement?.type === 'noteIcon' && (
            <View style={{ padding: 6 }}>
              <Ionicons
                name={targetElement.hasNotes ? 'document-text' : 'document-text-outline'}
                size={targetElement.size || 18}
                color={targetElement.hasNotes ? '#e8c96f' : '#a89985'}
              />
            </View>
          )}
        </Animated.View>
      )}

      {/* Tooltip with drop shadow */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            ...tooltipStyle,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            // iOS shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            // Android shadow
            elevation: 8,
          },
        ]}
      >
        <View style={tw`bg-primary rounded-xl p-4`}>
          {/* Arrow */}
          <View style={getArrowStyle()} />

          <Text style={tw`text-white text-base font-bold mb-1.5`}>{title}</Text>
          <Text style={tw`text-white/90 text-sm mb-3`}>{message}</Text>

          <TouchableOpacity
            onPress={handleDismiss}
            style={tw`bg-white rounded-lg py-2 px-4 self-end`}
            activeOpacity={0.8}
          >
            <Text style={tw`text-primary font-semibold text-sm`}>Skjønner! 👍</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}
