import React, { memo, useMemo } from 'react';
import { View, Image } from 'react-native';
import { AVATAR_IMAGES, AVAILABLE_AVATARS } from '../lib/avatar-images';

interface AvatarProps {
  avatarId: string | null | undefined;
  size?: number;
  borderColor?: string;
  style?: any;
}

const Avatar = memo(function Avatar({ avatarId, size = 24, borderColor, style }: AvatarProps) {
  // Always show border if we have an avatar
  const borderWidth = 4;
  const innerSize = size - 8; // size - (borderWidth * 2) = size - 8
  const finalBorderColor = borderColor || '#6b8e6f'; // Fallback to green

  // Direct lookup - no need for useMemo for simple lookups
  const imageSource = avatarId && AVATAR_IMAGES[avatarId];

  if (!avatarId || !AVATAR_IMAGES[avatarId]) {
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

  // PNG image - much faster than SVG
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
          backgroundColor: 'rgba(45, 37, 32, 1)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {imageSource && (
        <Image
          source={imageSource}
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          }}
          resizeMode="cover"
        />
      )}
    </View>
  );
});

export default Avatar;
export { AVAILABLE_AVATARS };
