import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import tw from '../lib/tw';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={tw`flex-1 bg-background justify-center items-center px-8`}>
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Main logo text */}
        <Text style={tw`text-7xl font-bold text-text text-center mb-3 tracking-tight`}>
          Flyt
        </Text>

        {/* Tagline */}
        <Text style={tw`text-lg text-text-muted text-center font-light tracking-wide`}>
          Flyt i hverdagen
        </Text>

        {/* Subtle decorative element */}
        <View style={tw`w-16 h-1 bg-primary rounded-full mx-auto mt-6`} />
      </Animated.View>
    </View>
  );
}
