import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import SplashBackground from './SplashBackground';

const LOGO_COLOR = '#EDE7DF';
const SUBTITLE_COLOR = 'rgba(237, 231, 223, 0.55)';

export default function SplashScreen() {
  // Text animation values
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(10);

  useEffect(() => {
    // Fade in animation - 800ms
    textOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });

    textTranslateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });

    // Fade out text just before splash ends (at 1.8s, 200ms before 2s splash fade starts)
    const fadeOutTimer = setTimeout(() => {
      textOpacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });
    }, 1800);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Skia background with animated blob */}
      <SplashBackground />

      {/* Text content */}
      <View style={styles.textContainer}>
        <Animated.View style={textStyle}>
          {/* FLYT wordmark */}
          <Text style={styles.wordmark}>F L Y T</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>Planen. Synlig for begge.</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  wordmark: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 48,
    color: LOGO_COLOR,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 18,
    color: SUBTITLE_COLOR,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
