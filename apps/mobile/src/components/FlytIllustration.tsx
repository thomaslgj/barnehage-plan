import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';

export default function FlytIllustration({ size = 100 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Flowing waves representing "Flyt" (Flow) */}
        <G>
          {/* Background wave */}
          <Path
            d="M 10 30 Q 30 20, 50 30 T 90 30"
            stroke="#6b8e6f"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Middle wave */}
          <Path
            d="M 10 50 Q 30 40, 50 50 T 90 50"
            stroke="#7fa884"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Front wave */}
          <Path
            d="M 10 70 Q 30 60, 50 70 T 90 70"
            stroke="#e8956f"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Decorative dots */}
          <Circle cx="25" cy="45" r="3" fill="#d4734f" opacity="0.5" />
          <Circle cx="50" cy="35" r="2.5" fill="#c17b5c" opacity="0.6" />
          <Circle cx="75" cy="55" r="3.5" fill="#6b8e6f" opacity="0.5" />
        </G>
      </Svg>
    </View>
  );
}
