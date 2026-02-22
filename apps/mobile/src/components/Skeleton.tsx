import React from 'react';
import { View } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export default function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#4a3f38',
          opacity: 0.5,
        },
        style,
      ]}
    />
  );
}
