import React, { memo } from 'react';
import { View, Image } from 'react-native';
import { AVATAR_IMAGES, AVAILABLE_AVATARS } from '../lib/avatar-images';

interface AvatarProps {
  avatarId: string | null | undefined;
  size?: number;
  borderColor?: string;
  style?: any;
}

const Avatar = memo(function Avatar({ avatarId, size = 24, borderColor = '#6b8e6f', style }: AvatarProps) {
  const borderWidth = 4;
  const innerSize = size - 8;
  const imageSource = avatarId && AVATAR_IMAGES[avatarId];

  if (!avatarId || !imageSource) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 4,
          borderColor: '#a89985',
          borderStyle: 'dashed',
          backgroundColor: 'transparent',
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 4,
        borderColor: borderColor,
        borderStyle: 'solid',
        backgroundColor: '#2d2520',
        overflow: 'hidden',
      }}
    >
      <Image
        source={imageSource}
        style={{
          width: innerSize,
          height: innerSize,
        }}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
}, (prev, next) => {
  return prev.avatarId === next.avatarId &&
         prev.size === next.size &&
         prev.borderColor === next.borderColor;
});

export default Avatar;
export { AVAILABLE_AVATARS };
