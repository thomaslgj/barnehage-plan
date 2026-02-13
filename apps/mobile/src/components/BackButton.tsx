import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import tw from '../lib/tw';
import { Text } from './Text';

interface BackButtonProps {
  onPress?: () => void;
  label?: string;
}

export function BackButton({ onPress, label = 'Tilbake' }: BackButtonProps) {
  const navigation = useNavigation();

  const handlePress = async () => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      style={tw`flex-row items-center gap-2 mb-6`}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={tw`text-2xl text-text-light`}>‹</Text>
      <Text style={tw`text-base text-text-light`}>{label}</Text>
    </TouchableOpacity>
  );
}
