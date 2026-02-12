import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import FlytIllustration from './FlytIllustration';
import tw from '../lib/tw';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const illustrationFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger the animations - illustration first, then text
    Animated.sequence([
      Animated.timing(illustrationFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={tw`flex-1 bg-background justify-center items-center px-8`}>
      {/* Illustration */}
      <Animated.View style={{ opacity: illustrationFade, marginBottom: 32 }}>
        <FlytIllustration size={140} />
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Main logo text */}
        <Text style={tw`text-7xl font-bold text-text text-center mb-3 tracking-tight`}>
          Flyt
        </Text>

        {/* Tagline */}
        <Text style={tw`text-lg text-text-muted text-center font-light tracking-wide`}>
          Flyt i hverdagen
        </Text>
      </Animated.View>
    </View>
  );
}
