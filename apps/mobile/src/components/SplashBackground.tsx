import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Rect,
  Circle,
  BlurMask,
  Paint,
  Skia,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Colors
const BASE_COLOR = '#2B1E16';
const BLOB_COLOR = 'rgba(120, 78, 52, 0.22)'; // Reduced opacity for softer look

export default function SplashBackground() {
  // Blob animation values
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  useEffect(() => {
    // Animate X: -40 to 40 over 14000ms
    offsetX.value = withRepeat(
      withTiming(40, {
        duration: 14000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Animate Y: -30 to 30 over 14000ms
    offsetY.value = withRepeat(
      withTiming(30, {
        duration: 14000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Start from negative values
    offsetX.value = -40;
    offsetY.value = -30;

    // Then start animation
    offsetX.value = withRepeat(
      withTiming(40, {
        duration: 14000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    offsetY.value = withRepeat(
      withTiming(30, {
        duration: 14000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  // Blob center position with animation
  const blobCenterX = useDerivedValue(() => screenWidth / 2 + offsetX.value);
  const blobCenterY = useDerivedValue(() => screenHeight / 2 + offsetY.value);

  // Blob radius - large to create gradient-like ambient light
  const blobRadius = Math.min(screenWidth, screenHeight) * 0.85; // Large but visible gradient

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      {/* Base solid background */}
      <Rect x={0} y={0} width={screenWidth} height={screenHeight} color={BASE_COLOR} />

      {/* Large soft blob with heavy blur */}
      <Circle cx={blobCenterX} cy={blobCenterY} r={blobRadius} color={BLOB_COLOR}>
        <BlurMask blur={120} style="normal" />
      </Circle>
    </Canvas>
  );
}
