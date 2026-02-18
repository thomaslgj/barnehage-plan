import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AVATAR_SVGS, AVAILABLE_AVATARS } from '../lib/avatars';

interface AvatarProps {
  avatarId: string | null | undefined;
  size?: number;
  borderColor?: string;
  style?: any;
}

export default function Avatar({ avatarId, size = 24, borderColor, style }: AvatarProps) {
  // Always show border if we have an avatar
  const borderWidth = 4;
  const innerSize = size - (borderWidth * 2);
  const finalBorderColor = borderColor || '#6b8e6f'; // Fallback to green

  if (!avatarId || !AVATAR_SVGS[avatarId]) {
    // Default avatar - empty circle with dashed border
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: borderWidth,
            borderColor: '#a89985', // Gray/beige border for empty state
            borderStyle: 'dashed',
            backgroundColor: 'transparent',
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: borderWidth,
          borderColor: finalBorderColor,
          borderStyle: 'solid',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
        },
        style,
      ]}
    >
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          overflow: 'hidden',
          backgroundColor: 'rgba(45, 37, 32, 1)', // Dark background for better contrast
        }}
      >
        <SvgXml xml={AVATAR_SVGS[avatarId]} width="100%" height="100%" />
      </View>
    </View>
  );
}

export { AVAILABLE_AVATARS };
