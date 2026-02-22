import React from 'react';
import { View } from 'react-native';
import tw from '../lib/tw';
import { Text } from './Text';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={tw`mb-6`}>
      <Text style={tw`text-3xl font-bold text-white mb-2`}>
        {title}
      </Text>
      {subtitle && (
        <Text style={tw`text-sm text-text-muted`}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
