import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AVATAR_SVGS, AVAILABLE_AVATARS } from '../lib/avatars';

interface AvatarProps {
  avatarId: string | null | undefined;
  size?: number;
  style?: any;
}

export default function Avatar({ avatarId, size = 24, style }: AvatarProps) {
  if (!avatarId || !AVATAR_SVGS[avatarId]) {
    // Default avatar - simple circle
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'rgba(168, 153, 133, 0.3)',
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
          overflow: 'hidden',
          backgroundColor: 'rgba(45, 37, 32, 0.6)', // Dark background for better contrast
        },
        style,
      ]}
    >
      <SvgXml xml={AVATAR_SVGS[avatarId]} width="100%" height="100%" />
    </View>
  );
}

export { AVAILABLE_AVATARS };
