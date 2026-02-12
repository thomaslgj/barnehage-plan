import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

export default function SuccessIllustration({ size = 120 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {/* Background circles with warm colors */}
        <Circle cx="60" cy="60" r="50" fill="#6b8e6f" opacity="0.2" />
        <Circle cx="60" cy="60" r="40" fill="#7fa884" opacity="0.3" />
        <Circle cx="60" cy="60" r="30" fill="#e8956f" opacity="0.15" />

        {/* Checkmark */}
        <Path
          d="M 40 60 L 52 72 L 80 44"
          stroke="#f5f1ed"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
