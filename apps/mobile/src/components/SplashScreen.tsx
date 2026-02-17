import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SplashBackground from './SplashBackground';

const LOGO_COLOR = '#EDE7DF';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Skia background */}
      <SplashBackground />

      {/* Text content */}
      <View style={styles.textContainer}>
        <Text style={styles.wordmark}>F L Y T</Text>
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
  },
});
