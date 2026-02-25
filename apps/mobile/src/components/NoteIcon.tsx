import React, { memo, forwardRef } from 'react';
import { TouchableOpacity, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import tw from '../lib/tw';

interface NoteIconProps {
  hasNotes: boolean;
  onPress: () => void;
  size?: number;
}

const NoteIcon = memo(forwardRef<View, NoteIconProps>(function NoteIcon({ hasNotes, onPress, size = 18 }, ref) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <View ref={ref} collapsable={false}>
      <TouchableOpacity
        onPress={handlePress}
        style={tw.style('p-1.5', !hasNotes && 'opacity-50')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={hasNotes ? 'document-text' : 'document-text-outline'}
          size={size}
          color={hasNotes ? '#e8c96f' : '#a89985'} // secondary yellow if has notes, muted beige if empty
        />
      </TouchableOpacity>
    </View>
  );
}));

export default NoteIcon;
