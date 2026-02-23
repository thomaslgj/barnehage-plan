import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import tw from '../lib/tw';

export default function HeaderSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={tw`flex-row items-center justify-between mb-6`}>
      {/* Child name skeleton */}
      <Animated.View
        style={[
          tw`bg-slate-800/30 rounded-full`,
          { opacity, width: 100, height: 43 },
        ]}
      />

      {/* Profile button skeleton */}
      <Animated.View
        style={[
          tw`bg-slate-700/50 rounded-full`,
          { opacity, width: 100, height: 43 },
        ]}
      />
    </View>
  );
}
